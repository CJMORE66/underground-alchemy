#!/usr/bin/env python3
"""Export a read-only, public-field-only Printful catalogue; never place orders."""
from __future__ import annotations

import argparse
import datetime as dt
from html import unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import ssl
import sys
import tempfile
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, HTTPSHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "dist/shop/catalog.json"
STORE_ID = 18912189
API_ORIGIN = "https://api.printful.com"
PAGE_SIZE = 100
MAX_PRODUCTS = 500
MAX_PAGES = 10
MAX_VARIANTS = 500
MAX_TOTAL_VARIANTS = 5000
MAX_RESPONSE_BYTES = 8 * 1024 * 1024
MAX_CATALOGUE_BYTES = 8 * 1024 * 1024
MAX_SAFE_INTEGER = 9007199254740991


class SyncError(Exception):
    """A deliberately non-sensitive explanation safe to print."""


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        raise SyncError("Printful returned a redirect; no redirect was followed.")


def identifier(value):
    if type(value) is int and 0 < value <= MAX_SAFE_INTEGER:
        return value
    if isinstance(value, str) and re.fullmatch(r"[1-9][0-9]{0,15}", value):
        number = int(value)
        if number <= MAX_SAFE_INTEGER:
            return number
    raise SyncError("Printful returned an invalid identifier.")


def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("Duplicate JSON member")
            result[key] = value
        return result

    def constant(value):
        raise ValueError("Non-finite JSON constant")

    return json.loads(raw, object_pairs_hook=pairs, parse_constant=constant)


def text(value, maximum=300, required=False):
    if value is None and not required:
        return ""
    if not isinstance(value, str) or len(value) > maximum:
        raise SyncError("A catalogue text field has an invalid format or length.")
    if any(ord(char) < 32 and char not in "\n\r\t" for char in value):
        raise SyncError("A catalogue text field contains unsupported control characters.")
    value = re.sub(r"\s+", " ", value).strip()
    if required and not value:
        raise SyncError("A required catalogue text field is empty.")
    return value


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        elif tag in ("br", "p", "div", "li") and not self.skip:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        elif not self.skip:
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def description(value):
    value = text(value, 12000)
    parser = PlainText()
    parser.feed(value)
    return text(unescape("".join(parser.parts)), 12000)


def public_image(value):
    """Only unsigned Printful preview/thumbnail images, never original printfiles."""
    if not isinstance(value, str) or len(value) > 1500:
        return None
    try:
        url = urlsplit(value)
        if (url.scheme != "https" or url.netloc != "files.cdn.printful.com"
                or url.query or url.fragment or url.username or url.password):
            return None
        if re.fullmatch(r"/files/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+_(?:preview|thumbnail)\.(?:png|jpg|jpeg|webp)", url.path, re.I):
            return value
    except ValueError:
        pass
    return None


def local_image(value):
    if not isinstance(value, str) or not re.fullmatch(r"/assets/catalog/[A-Za-z0-9_-]+\.(?:png|jpg|jpeg|webp)", value, re.I):
        return None
    image = ROOT / "dist" / value.lstrip("/")
    if image.is_symlink() or not image.resolve().is_relative_to(ROOT / "dist/assets/catalog"):
        return None
    return value if image.is_file() else None


class PrintfulClient:
    def __init__(self, token):
        if (not isinstance(token, str) or not 8 <= len(token) <= 4096
                or not re.fullmatch(r"[!-~]+", token)):
            raise SyncError("PRINTFUL_API_TOKEN is missing or has an invalid format. Set it only in the process environment.")
        self.token = token
        self.opener = build_opener(NoRedirect(), HTTPSHandler(context=ssl.create_default_context()))

    def get(self, path, query=None):
        if not (path == "/stores" or path == "/store/products" or re.fullmatch(r"/store/products/[1-9][0-9]{0,15}", path)):
            raise SyncError("This synchronizer permits only store identity and catalogue GET requests.")
        url = API_ORIGIN + path + ("?" + urlencode(query) if query else "")
        request = Request(url, headers={"Authorization": "Bearer " + self.token,
                          "X-PF-Store-Id": str(STORE_ID), "Accept": "application/json",
                          "User-Agent": "CAISIK-readonly-catalogue/1.0"}, method="GET")
        try:
            with self.opener.open(request, timeout=25) as response:
                if response.geturl() != url or response.status != 200:
                    raise SyncError("Printful returned an unexpected response; the catalogue was not changed.")
                if response.headers.get_content_type() != "application/json":
                    raise SyncError("Printful did not return JSON; the catalogue was not changed.")
                raw = response.read(MAX_RESPONSE_BYTES + 1)
                if len(raw) > MAX_RESPONSE_BYTES:
                    raise SyncError("Printful response exceeds the configured size limit.")
        except HTTPError as error:
            # Never include the exception, URL, upstream body or headers in logs.
            if error.code in (401, 403):
                raise SyncError("Printful authentication or read permission failed; the catalogue was not changed.") from None
            raise SyncError("Printful returned an HTTP error; the catalogue was not changed.") from None
        except (URLError, TimeoutError, OSError):
            raise SyncError("The secure Printful request failed; the catalogue was not changed.") from None
        try:
            envelope = strict_json(raw.decode("utf-8"))
        except (UnicodeError, ValueError, RecursionError):
            raise SyncError("Printful returned malformed JSON; the catalogue was not changed.") from None
        if not isinstance(envelope, dict) or type(envelope.get("code")) is not int or envelope["code"] != 200 or "result" not in envelope:
            raise SyncError("Printful returned an invalid API envelope; the catalogue was not changed.")
        return envelope

    def products(self):
        stores = self.get("/stores")["result"]
        if (not isinstance(stores, list) or len(stores) != 1 or not isinstance(stores[0], dict)
                or identifier(stores[0].get("id")) != STORE_ID):
            raise SyncError("Use a token limited to the expected CAISIK store 18912189; store identity did not match.")
        seen, offset, total = set(), 0, None
        for _ in range(MAX_PAGES):
            page = self.get("/store/products", {"status": "synced", "offset": offset, "limit": PAGE_SIZE})
            batch, paging = page["result"], page.get("paging")
            if not isinstance(batch, list) or not isinstance(paging, dict):
                raise SyncError("Printful product pagination is malformed.")
            current_total, current_offset, limit = paging.get("total"), paging.get("offset"), paging.get("limit")
            if (type(current_total) is not int or not 1 <= current_total <= MAX_PRODUCTS
                    or type(current_offset) is not int or current_offset != offset
                    or type(limit) is not int or not 1 <= limit <= PAGE_SIZE
                    or len(batch) > limit or not batch):
                raise SyncError("Printful returned an empty, oversized or inconsistent catalogue page.")
            if total is None:
                total = current_total
            if current_total != total or offset + len(batch) > total:
                raise SyncError("The Printful catalogue changed during pagination. Try again later.")
            for item in batch:
                if not isinstance(item, dict):
                    raise SyncError("Printful returned an invalid product record.")
                product_id = identifier(item.get("id"))
                if product_id in seen:
                    raise SyncError("Printful returned a duplicate product identifier.")
                seen.add(product_id)
                yield product_id, self.get("/store/products/" + str(product_id))["result"]
            offset += len(batch)
            if offset == total:
                return
        raise SyncError("The Printful catalogue exceeds the pagination limit.")


def previous_catalogue(output):
    path = output if output.exists() else DEFAULT_OUTPUT
    if not path.exists():
        return {}
    if path.is_symlink() or path.stat().st_size > MAX_CATALOGUE_BYTES:
        raise SyncError("The previous catalogue is a symbolic link or exceeds the size limit.")
    try:
        previous = strict_json(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError, RecursionError):
        raise SyncError("The previous catalogue is unreadable or invalid. Preserve it for recovery.") from None
    if (not isinstance(previous, dict) or type(previous.get("version")) is not int
            or previous["version"] != 1 or not isinstance(previous.get("products"), list)
            or len(previous["products"]) > MAX_PRODUCTS):
        raise SyncError("The previous catalogue schema is invalid. It was not overwritten.")
    mapped = {}
    for product in previous["products"]:
        if not isinstance(product, dict):
            raise SyncError("The previous catalogue contains an invalid product.")
        product_id = identifier(product.get("printfulSyncProductId"))
        if str(product.get("printfulStoreId")) != str(STORE_ID) or product_id in mapped:
            raise SyncError("The previous catalogue contains conflicting Printful identities.")
        mapped[product_id] = product
    return mapped


def stable_id(value, fallback):
    if value is None:
        return fallback
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,120}", value):
        raise SyncError("A previous public identifier has an invalid format.")
    return value


def variant_options(variant, previous):
    result = []
    for key, title in (("color", "Color"), ("size", "Size")):
        if variant.get(key) is not None:
            value = text(variant[key], 150, required=True)
            result.append({"title": title, "value": value})
    if not result and previous and previous.get("printfulCatalogVariantId") == variant.get("variant_id"):
        for option in previous.get("options", []):
            if not isinstance(option, dict) or len(result) >= 10:
                raise SyncError("Previous variant options have an invalid format.")
            result.append({"title": text(option.get("title"), 100, required=True),
                           "value": text(option.get("value"), 150, required=True)})
    if not result:
        result = [{"title": "Variant", "value": text(variant.get("name"), 300, required=True)}]
    return result


def public_product(product_id, detail, previous):
    if not isinstance(detail, dict) or not isinstance(detail.get("sync_product"), dict) or not isinstance(detail.get("sync_variants"), list):
        raise SyncError("Printful returned malformed product details.")
    product, source_variants = detail["sync_product"], detail["sync_variants"]
    if identifier(product.get("id")) != product_id or not 1 <= len(source_variants) <= MAX_VARIANTS:
        raise SyncError("Printful product identity or variant count is invalid.")
    name = text(product.get("name"), 300, required=True)
    previous = previous or {}
    previous_variants = {}
    for item in previous.get("variants", []):
        if not isinstance(item, dict):
            raise SyncError("A previous variant has an invalid format.")
        variant_id = identifier(item.get("printfulSyncVariantId"))
        if variant_id in previous_variants:
            raise SyncError("The previous catalogue contains duplicate variant identifiers.")
        previous_variants[variant_id] = item
    variants, images, options, seen = [], [], {}, set()
    local = local_image(previous.get("localImage"))
    if previous.get("localImage") and local is None:
        raise SyncError("A retained local product image is missing or has an unsafe path.")
    if local:
        images.append(local)
    preview = public_image(product.get("thumbnail_url"))
    if preview:
        images.append(preview)
    for variant in source_variants:
        if not isinstance(variant, dict):
            raise SyncError("Printful returned an invalid variant.")
        variant_id = identifier(variant.get("id"))
        if variant_id in seen:
            raise SyncError("Printful returned a duplicate variant identifier.")
        seen.add(variant_id)
        if variant.get("is_ignored") is True or variant.get("variant_id") is None:
            continue
        catalog_id = identifier(variant.get("variant_id"))
        old = previous_variants.get(variant_id, {})
        values = variant_options(variant, old)
        for option in values:
            options.setdefault(option["title"], [])
            if option["value"] not in options[option["title"]]:
                options[option["title"]].append(option["value"])
        variants.append({"id": stable_id(old.get("id"), "pfv-" + str(variant_id)),
                         "sku": text(variant.get("sku"), 200),
                         "title": text(old.get("title") or variant.get("name"), 300, required=True),
                         "options": values, "printfulSyncVariantId": variant_id,
                         "printfulCatalogVariantId": catalog_id})
        # Only designated preview mockups, never front/back print files or their original URLs.
        files = variant.get("files", [])
        if isinstance(files, list):
            for item in files[:30]:
                if isinstance(item, dict) and item.get("type") == "preview":
                    preview = public_image(item.get("preview_url")) or public_image(item.get("thumbnail_url"))
                    if preview and preview not in images and len(images) < 20:
                        images.append(preview)
    if not variants or not images:
        raise SyncError("A synced product has no exportable variants or safe preview image.")
    public_id = stable_id(previous.get("id") or previous.get("productId"), "pf-" + str(product_id))
    return {"id": public_id, "productId": stable_id(previous.get("productId"), public_id),
            "handle": stable_id(previous.get("handle"), "printful-" + str(STORE_ID) + "-" + str(product_id)),
            "name": name, "originalName": name,
            "displayName": text(previous.get("displayName") or name, 300, required=True),
            "category": stable_id(previous.get("category"), "other"),
            "description": description(product.get("description") or previous.get("description")),
            "localImage": local, "image": local or images[0], "images": images,
            "options": [{"title": key, "values": values} for key, values in options.items()],
            "variants": variants, "printfulSyncProductId": product_id, "printfulStoreId": str(STORE_ID)}


def sync_catalogue(output, client):
    output = Path(output)
    if output.is_symlink() or output.suffix.lower() != ".json":
        raise SyncError("Choose a regular JSON output path, not a symbolic link.")
    previous = previous_catalogue(output)
    products, seen_variants, public_ids, public_handles, public_variants, variant_count = [], set(), set(), set(), set(), 0
    for product_id, detail in client.products():
        if len(products) >= MAX_PRODUCTS:
            raise SyncError("The catalogue exceeds the configured product limit.")
        product = public_product(product_id, detail, previous.get(product_id))
        if product["id"] in public_ids or product["handle"] in public_handles:
            raise SyncError("Retained public product identities conflict.")
        public_ids.add(product["id"])
        public_handles.add(product["handle"])
        variant_count += len(product["variants"])
        if variant_count > MAX_TOTAL_VARIANTS:
            raise SyncError("The catalogue exceeds the configured variant limit.")
        for variant in product["variants"]:
            variant_id = variant["printfulSyncVariantId"]
            if variant_id in seen_variants or variant["id"] in public_variants:
                raise SyncError("The catalogue contains conflicting variant identifiers.")
            seen_variants.add(variant_id)
            public_variants.add(variant["id"])
        products.append(product)
    if not products:
        raise SyncError("An empty catalogue cannot replace the existing catalogue.")
    catalogue = {"version": 1, "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
                 "mode": "printful-readonly", "catalogueVerifiedLive": True,
                 "checkout": {"enabled": False, "url": None, "verifiedAt": None}, "products": products}
    payload = (json.dumps(catalogue, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
    if len(payload) > MAX_CATALOGUE_BYTES or client.token.encode("utf-8") in payload:
        raise SyncError("The public export failed its size or secret-exclusion check.")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="wb", prefix=".printful-", suffix=".tmp", dir=output.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, output)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
    return len(products), variant_count


class SafeArguments(argparse.ArgumentParser):
    def error(self, message):
        # argparse normally echoes unknown arguments; a mistakenly supplied token must not leak.
        self.exit(2, "Invalid arguments. Use --output PATH; supply the token only through PRINTFUL_API_TOKEN.\n")


def main(argv=None):
    parser = SafeArguments(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Public JSON output; defaults to dist/shop/catalog.json")
    args = parser.parse_args(argv)
    try:
        client = PrintfulClient(os.environ.get("PRINTFUL_API_TOKEN", ""))
        products, variants = sync_catalogue(args.output, client)
    except SyncError as error:
        print(str(error), file=sys.stderr)
        return 1
    except (OSError, ValueError, TypeError):
        print("Catalogue synchronization failed. The previous catalogue was not replaced with incomplete data.", file=sys.stderr)
        return 1
    print(f"Exported {products} products and {variants} variants. Checkout remains disabled. Review the Git diff before publishing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

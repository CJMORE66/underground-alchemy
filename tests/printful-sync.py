"""Offline HTTP-pipeline tests: no account, external connection or order request."""
import contextlib
from email.message import Message
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit
from urllib.request import BaseHandler, build_opener
from urllib.response import addinfourl

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("printful_sync", ROOT / "tools/sync-printful.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
TOKEN = "TEST_TOKEN_ONLY_NOT_A_REAL_CREDENTIAL"
IMAGE = "https://files.cdn.printful.com/files/abc/abcdef_preview.png"
LOCAL = "/assets/catalog/printful-18912189-482100507.png"


def envelope(result, paging=None):
    value = {"code": 200, "result": result}
    if paging is not None:
        value["paging"] = paging
    return value


def details(product_id=101, variant_id=1001):
    return {"sync_product": {"id": product_id, "name": "Skutečný návrh", "thumbnail_url": IMAGE,
                             "description": "<p>Čistý <b>popis</b></p><script>nevystavovat()</script>",
                             "private": TOKEN, "retail_price": "9.99"},
            "sync_variants": [{"id": variant_id, "name": "Navy / 3XL", "variant_id": 51734,
                               "color": "Navy", "size": "3XL", "sku": "PF-SKU", "retail_price": "99.00",
                               "price": "12.00", "availability_status": "active",
                               "files": [{"type": "front", "url": "https://secret.test/original.png",
                                          "preview_url": "https://files.cdn.printful.com/files/abc/private-design_preview.png",
                                          "private": TOKEN}]}],
            "private_metadata": TOKEN}


class MockHTTPS(BaseHandler):
    handler_order = 100

    def __init__(self, route):
        self.route, self.calls = route, []

    def https_open(self, request):
        parsed = urlsplit(request.full_url)
        # Exercise actual urllib Request construction and redirect/error handling.
        assert parsed.scheme == "https" and parsed.netloc == "api.printful.com"
        assert request.get_method() == "GET"
        assert request.get_header("Authorization") == "Bearer " + TOKEN
        assert request.get_header("X-pf-store-id") == "18912189"
        self.calls.append((parsed.path, parse_qs(parsed.query)))
        status, value, extra = self.route(parsed.path, parse_qs(parsed.query))
        headers = Message()
        headers["Content-Type"] = extra.get("Content-Type", "application/json")
        for key, item in extra.items():
            if key != "Content-Type":
                headers[key] = item
        body = value if isinstance(value, bytes) else json.dumps(value).encode("utf-8")
        response = addinfourl(io.BytesIO(body), headers, request.full_url, status)
        response.msg = "Test response"
        return response


def normal_route(path, query):
    if path == "/stores":
        return 200, envelope([{"id": 18912189, "name": "CAISIK"}]), {}
    if path == "/store/products":
        assert query["status"] == ["synced"]
        return 200, envelope([{"id": 101}], {"offset": 0, "limit": 100, "total": 1}), {}
    if path == "/store/products/101":
        return 200, envelope(details()), {}
    raise AssertionError("An unexpected endpoint was requested")


class SyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.output = Path(self.temporary.name) / "catalogue.json"
        self.baseline = {"version": 1, "products": [{
            "id": "legacy-product", "productId": "legacy-product", "handle": "legacy-handle",
            "displayName": "Schválený název", "localImage": LOCAL, "category": "tees",
            "printfulSyncProductId": 101, "printfulStoreId": "18912189",
            "variants": [{"id": "legacy-variant", "title": "Navy / 3XL", "printfulSyncVariantId": 1001,
                          "printfulCatalogVariantId": 51734,
                          "options": [{"title": "Color", "value": "Navy"}, {"title": "Size", "value": "3XL"}]}]}]}
        self.output.write_text(json.dumps(self.baseline), encoding="utf-8")
        self.before = self.output.read_bytes()

    def client(self, route=normal_route, platform="api"):
        handler = MockHTTPS(route)
        real_build = build_opener
        with patch.object(sync, "build_opener", side_effect=lambda *parts: real_build(handler, *parts)):
            client = sync.PrintfulClient(TOKEN, platform)
        return client, handler

    def failed(self, route, message=None):
        client, handler = self.client(route)
        with self.assertRaises(sync.SyncError) as caught:
            sync.sync_catalogue(self.output, client)
        if message:
            self.assertIn(message, str(caught.exception))
        self.assertNotIn(TOKEN, str(caught.exception))
        self.assertEqual(self.before, self.output.read_bytes())
        self.assertFalse(list(self.output.parent.glob(".printful-*.tmp")))
        return handler

    def test_real_request_pipeline_export_is_public_and_preserves_identity(self):
        client, handler = self.client()
        self.assertEqual(sync.sync_catalogue(self.output, client), (1, 1))
        result = json.loads(self.output.read_text())
        self.assertEqual(result["mode"], "printful-readonly")
        self.assertIs(result["catalogueVerifiedLive"], True)
        self.assertEqual(result["checkout"], {"enabled": False, "url": None, "verifiedAt": None})
        product = result["products"][0]
        self.assertEqual(product["id"], "legacy-product")
        self.assertEqual(product["displayName"], "Schválený název")
        self.assertEqual(product["localImage"], LOCAL)
        self.assertEqual(product["variants"][0]["id"], "legacy-variant")
        self.assertEqual(product["description"], "Čistý popis")
        self.assertEqual(product["options"], [{"title": "Color", "values": ["Navy"]}, {"title": "Size", "values": ["3XL"]}])
        public = self.output.read_text()
        for forbidden in (TOKEN, "original.png", "private-design", "retail_price", "availability_status", "private_metadata", '"files"', '"price"'):
            self.assertNotIn(forbidden, public)
        self.assertEqual([call[0] for call in handler.calls], ["/stores", "/store/products", "/store/products/101"])

    def test_paginated_new_products_receive_stable_namespace_ids(self):
        def route(path, query):
            if path == "/store/products":
                offset = int(query["offset"][0])
                return 200, envelope([{"id": 101 + offset}], {"offset": offset, "limit": 1, "total": 2}), {}
            if path == "/store/products/102":
                return 200, envelope(details(102, 1002)), {}
            return normal_route(path, query)
        client, handler = self.client(route)
        with patch.object(sync, "PAGE_SIZE", 1):
            self.assertEqual(sync.sync_catalogue(self.output, client), (2, 2))
        result = json.loads(self.output.read_text())
        second = result["products"][1]
        self.assertEqual(second["id"], "pf-102")
        self.assertEqual(second["variants"][0]["id"], "pfv-1002")
        self.assertEqual([q["offset"] for p, q in handler.calls if p == "/store/products"], [["0"], ["1"]])

    def test_wrong_or_multiple_store_refuses_before_reading_products(self):
        for stores in ([{"id": 7}], [{"id": 18912189}, {"id": 7}], []):
            handler = self.failed(lambda path, query: (200, envelope(stores), {}), "store identity")
            self.assertEqual(len(handler.calls), 1)

    def test_redirect_does_not_transmit_token_to_another_host(self):
        handler = self.failed(lambda path, query: (302, b"", {"Location": "https://external.test/collect"}), "redirect")
        self.assertEqual(len(handler.calls), 1)

    def test_auth_upstream_body_malformed_and_oversized_responses_never_replace(self):
        fixtures = [(401, {"error": TOKEN}, {}), (403, {"private": TOKEN}, {}),
                    (500, {"error": TOKEN}, {}), (200, b"not JSON " + TOKEN.encode(), {}),
                    (200, b"x" * (sync.MAX_RESPONSE_BYTES + 1), {}),
                    (200, {"code": True, "result": []}, {}),
                    (200, b'{"code":200,"code":200,"result":[]}', {}),
                    (200, b'{"code":200,"result":NaN}', {}),
                    (200, envelope([]), {"Content-Type": "text/html"})]
        for fixture in fixtures:
            self.failed(lambda path, query, response=fixture: response)

    def test_empty_duplicate_changed_pagination_and_hard_bounds(self):
        pages = [envelope([], {"offset": 0, "limit": 100, "total": 0}),
                 envelope([{"id": 101}, {"id": 101}], {"offset": 0, "limit": 100, "total": 2}),
                 envelope([{"id": 101}], {"offset": 0, "limit": 100, "total": 501}),
                 envelope([{"id": 101}], {"offset": 1, "limit": 100, "total": 1})]
        for page in pages:
            self.failed(lambda path, query, page=page: (200, page, {}) if path == "/store/products" else normal_route(path, query))
        def changed(path, query):
            if path == "/store/products":
                offset = int(query["offset"][0])
                return 200, envelope([{"id": 101 + offset}], {"offset": offset, "limit": 100, "total": 2 if offset == 0 else 3}), {}
            return normal_route(path, query)
        self.failed(changed, "changed during pagination")

    def test_duplicate_variant_wrong_product_and_missing_safe_image_fail(self):
        cases = []
        duplicate = details()
        duplicate["sync_variants"] *= 2
        cases.append(duplicate)
        cases.append(details(999))
        missing = details(102, 1002)
        missing["sync_product"]["id"] = 101
        missing["sync_product"]["thumbnail_url"] = "https://files.cdn.printful.com/files/abc/original.png?token=" + TOKEN
        cases.append(missing)
        for item in cases[:2]:
            self.failed(lambda path, query, item=item: (200, envelope(item), {}) if path == "/store/products/101" else normal_route(path, query))
        # A new product cannot use the old product's fallback image.
        client, _ = self.client()
        with self.assertRaises(sync.SyncError):
            sync.public_product(101, missing, None)

    def test_corrupt_previous_catalogue_and_failed_atomic_replace_are_preserved(self):
        self.output.write_bytes(b"corrupt original")
        client, handler = self.client()
        with self.assertRaises(sync.SyncError):
            sync.sync_catalogue(self.output, client)
        self.assertEqual(handler.calls, [])
        self.assertEqual(self.output.read_bytes(), b"corrupt original")
        self.output.write_bytes(self.before)
        with patch.object(sync.os, "replace", side_effect=OSError("test failure")):
            with self.assertRaises(OSError):
                sync.sync_catalogue(self.output, client)
        self.assertEqual(self.output.read_bytes(), self.before)
        self.assertFalse(list(self.output.parent.glob(".printful-*.tmp")))

    def test_token_never_echoed_or_written_and_missing_token_does_not_connect(self):
        stderr = io.StringIO()
        with patch.dict(os.environ, {}, clear=True), patch.object(sync, "build_opener") as opener, contextlib.redirect_stderr(stderr):
            self.assertEqual(sync.main(["--output", str(self.output)]), 1)
            opener.assert_not_called()
        with contextlib.redirect_stderr(stderr), self.assertRaises(SystemExit):
            sync.main(["--token", TOKEN])
        self.assertNotIn(TOKEN, stderr.getvalue())
        self.assertEqual(self.output.read_bytes(), self.before)
        bad = details()
        bad["sync_product"]["name"] = TOKEN
        self.failed(lambda path, query: (200, envelope(bad), {}) if path == "/store/products/101" else normal_route(path, query), "secret-exclusion")

    def test_endpoint_allowlist_blocks_every_order_or_write_path(self):
        client, handler = self.client()
        for path in ("/orders", "/orders/1/confirm", "/store/products/../orders", "https://external.test", "/store/products/1?token=bad"):
            with self.assertRaises(sync.SyncError):
                client.get(path)
        self.assertEqual(handler.calls, [])

    def test_variant_limit_is_enforced_while_streaming_before_later_requests(self):
        expanded = details()
        second = dict(expanded["sync_variants"][0])
        second["id"] = 1002
        expanded["sync_variants"].append(second)
        route = lambda path, query: (200, envelope(expanded), {}) if path == "/store/products/101" else normal_route(path, query)
        with patch.object(sync, "MAX_TOTAL_VARIANTS", 1):
            self.failed(route, "variant limit")

    def test_ecommerce_uses_sync_api_without_probing_or_writes(self):
        def route(path, query):
            return normal_route(path.replace("/sync/products", "/store/products"), query)
        client, handler = self.client(route, platform="ecommerce")
        self.assertEqual(sync.sync_catalogue(self.output, client), (1, 1))
        self.assertEqual([p for p, _ in handler.calls], ["/stores", "/sync/products", "/sync/products/101"])
        for path in ("/store/products", "/orders", "/sync/variant/1001", "/sync/products/../orders"):
            with self.assertRaises(sync.SyncError):
                client.get(path)

    def test_historical_storefront_price_and_date_survive_live_import(self):
        product = self.baseline["products"][0]
        product.update(id="prod_OLD", productId="prod_OLD", handle="printful-18912189-101",
                       sourceUrl="https://hiphop.caisik.i234.me/dk/products/printful-18912189-101")
        price = {"amount": 56.5, "currency": "EUR", "taxInclusive": False,
                 "checkedAt": "2026-10-16T04:52:09.112124+00:00"}
        product["variants"][0].update(sku="PF-SKU", sourcePrice=price)
        self.output.write_text(json.dumps(self.baseline))
        client, _ = self.client()
        sync.sync_catalogue(self.output, client)
        result = json.loads(self.output.read_text())["products"][0]
        self.assertEqual(result["variants"][0]["sourcePrice"], price)
        self.assertEqual(result["sourceUrl"], product["sourceUrl"])
        self.assertNotEqual(result["variants"][0]["sourcePrice"]["amount"], 99.00,
                            "Printful retail_price is not the original store's quote")

    def test_changed_existing_sku_or_catalog_identity_does_not_overwrite(self):
        for field, value in (("sku", "DIFFERENT-SKU"), ("printfulCatalogVariantId", 999)):
            self.baseline["products"][0]["variants"][0][field] = value
            self.output.write_text(json.dumps(self.baseline))
            self.before = self.output.read_bytes()
            self.failed(normal_route, "identity mapping")
            self.baseline["products"][0]["variants"][0].pop(field)
            self.baseline["products"][0]["variants"][0]["printfulCatalogVariantId"] = 51734


if __name__ == "__main__":
    unittest.main(verbosity=2)

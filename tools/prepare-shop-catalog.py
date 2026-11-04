"""Preserve public source identities and dated prices; never turn snapshots into checkout quotes."""
from pathlib import Path
from urllib.parse import urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def public_image(value):
    if not isinstance(value, str):
        return None
    if re.fullmatch(r"/assets/catalog/[A-Za-z0-9_.-]+\.(?:png|webp|jpg)", value):
        return value if (ROOT / "dist" / value.lstrip("/")).is_file() else None
    parsed = urlparse(value)
    if (parsed.scheme == "https" and parsed.hostname == "files.cdn.printful.com"
            and not parsed.username and not parsed.password and not parsed.query
            and not parsed.fragment and parsed.path.endswith((".png", ".jpg", ".webp"))):
        return value
    return None


def prepare(source):
    products = []
    for product in source["products"]:
        meta = product.get("sourceMetadata", {})
        if str(meta.get("printful_store_id")) != "18912189":
            raise ValueError("Unexpected Printful store; review source identities first")
        images = list(dict.fromkeys(filter(None, (public_image(url) for url in
            [product.get("localImage"), product.get("image"), *product.get("images", [])]))))
        variants = [{
            "id": item["id"], "sku": item["sku"], "title": item["title"],
            "options": item["options"],
            "sourcePrice": {"amount": item["calculatedAmount"], "currency": item["currency"].upper(),
                            "taxInclusive": item.get("priceTaxInclusive"),
                            "checkedAt": product.get("checkedAt", source["checkedAt"])},
            "printfulSyncVariantId": item["printfulSyncVariantId"],
            "printfulCatalogVariantId": item["printfulCatalogVariantId"],
        } for item in product["variants"]]
        products.append({
            "id": product["productId"], "productId": product["productId"],
            "handle": product["handle"], "sourceUrl": product["url"], "name": product["name"],
            "originalName": product.get("originalName", product["name"]),
            "displayName": product.get("displayName", product["name"]),
            "category": product.get("category", "other"),
            "localImage": public_image(product.get("localImage")),
            "image": images[0] if images else None, "images": images,
            "options": product["options"], "variants": variants,
            "printfulSyncProductId": meta["printful_sync_product_id"],
            "printfulStoreId": str(meta["printful_store_id"]),
        })
    return {
        "version": 1, "checkedAt": source["checkedAt"], "mode": "snapshot",
        "catalogueVerifiedLive": False,
        "checkout": {"enabled": False, "url": None, "verifiedAt": None},
        "products": products,
    }


if __name__ == "__main__":
    destination = ROOT / "dist/shop/catalog.json"
    if destination.exists():
        previous = json.loads(destination.read_text())
        if previous.get("mode") != "snapshot":
            raise SystemExit("A newer Printful catalogue exists; snapshot regeneration refused.")
    result = prepare(json.loads((ROOT / "dist/catalog.json").read_text()))
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Prepared {len(result['products'])} original designs; sales remain disabled.")

# Commerce integration and verification

Verified on 16 October 2026. The exhibition preserves source product IDs, handles,
variant IDs, SKUs, source names and prices. It does not receive payment details or
create orders. Checkout runs on the existing original storefront.

## Actual catalog source

The current working public catalog comes from:

- https://hiphop.caisik.i234.me/dk/store?page=1
- https://hiphop.caisik.i234.me/dk/store?page=2

Both pages returned HTTP 200. Fresh read-only inspection of all 20 linked product
pages verified 86 variants. Product IDs, names and SKU sets matched the existing
catalog snapshot. The product payload contains `prod_…` and `variant_…` IDs,
calculated prices and Printful synchronization metadata. Its schema is consistent
with Medusa; identifying the backend platform from that payload is an inference,
not an inspection of its private deployment.

The exhibition's embedded catalog is a dated snapshot, not a live inventory or
final-price API. Each exact matched variant displays its source SKU, source price
and currency. Color/size values come from the original product options. No finite
stock quantities or scarcity are inferred. Public variants expose
`manage_inventory: false`, and no verified inventory quantity was supplied.

## Magento boundary

https://magento.caisik.i234.me/ is a separate installation. Public GraphQL GET
queries returned HTTP 200 but no matching public products for an empty search,
`search: "WU"`, or an exact known SKU filter for `6AD171237B77A`.
`availableStores` returned only `default` / Default Store View, base currency EUR
and default display currency CZK.

This does not prove Magento has no admin products. It means the tested public
storefront queries did not expose the required catalog. The working hiphop product
IDs have not been mapped to Magento IDs. This release therefore does **not** claim
a verified Magento cart, Magento checkout or Magento-to-Printful integration.
Store assignments, visibility, indexes, API configuration and identity mapping
require server/repository access to diagnose. No Magento records or settings were
changed.

## Variant handoff

`dist/commerce-v7.js` observes the existing product modal. Selecting all source
options finds the exact source variant, displays its SKU and variant-specific
price, and sets the original product link's `v_id` query parameter. This is a
native original-store variant preview; it does not itself add anything to a cart.
The customer still clicks **Add to cart** in the original store.

An incomplete selection or a combination absent from the saved source data resets
the purchase link to the unmodified original product URL. No guessed variant ID is
sent. Product information remains available if the enhancement does not mount.

Verified handoff example:

https://hiphop.caisik.i234.me/dk/products/printful-18912189-482104768?v_id=variant_01M51CDGGHJT72J1PK1DY3QJBX

This fresh-tab URL opened **OMERTA WITH EGO**, Black / 2XL, at **€56.50**, with
Black and 2XL selected and Add to cart enabled. The exact source SKU is
`PF-18912189-5577030794`. Additional source price checks: S €54.50 and 3XL €58.50.

## Browser checkout verification

A browser test selected the real OMERTA Black / 2XL variant, added one item to the
original store's bag, and verified the correct variant and €56.50 product price
on `/dk/cart`. Proceeding to `/dk/checkout?step=address` displayed the shipping
address form and the same variant in the checkout summary with its displayed
total. No address, personal fields or payment information were entered, and no
order was placed. The test item was removed; a fresh cart then showed **BAG 0**.

A separate direct GET of `/dk/checkout` without cart context returned 404. That
response is not evidence of a broken checkout: the browser cart flow above reached
the checkout address step successfully.

The verified boundary is **product → correct variant → cart → checkout address
step**. Shipping selection, destination tax, final delivered total, payment
authorization, order confirmation, refunds and fulfillment were not tested.

## Pricing, imagery and fulfillment limits

- OMERTA source price data declares `is_calculated_price_tax_inclusive: false`.
  The native storefront determines current applicable taxes, shipping and totals.
  Snapshot prices must not be advertised as delivered or universally tax-inclusive
  prices.
- Source metadata identifies Printful store `18912189`, synchronization product
  and variant IDs, and `fulfillment_provider: "printful"`. This verifies that
  synchronization metadata is present. It does not verify a paid order reaching
  production or delivery. `printful_available` is synchronization data, not a
  real-time inventory promise.
- Gallery assets are authentic original-store / Printful preview images, not
  evidence of photographed physical samples. They are labeled Preview 1, Preview 2,
  etc.; front/back orientation is not invented when the source does not label it.
  The exhibition's sculptural 3D artwork is conceptual and is not a manufacturing-
  accurate garment mesh. No source garment dimensions or material composition were
  invented.
- Thirteen terminal `copy` labels were conservatively removed in the presentation
  layer after reviewing the naming map under the requested cleanup. `displayName`
  is separate from preserved `name` / `originalName`; backend titles, product IDs,
  SKUs and prices are unchanged. No semantic design names or limited quantities
  were fabricated.

## Regression checks

1. Open OMERTA, choose Size 2XL, and verify €56.50 plus
   `PF-18912189-5577030794`.
2. Verify `[data-v7-original-buy]` contains the exact selected source variant ID
   in `v_id`. Open it and confirm native options and native current price.
3. Reset Size to its placeholder: the link must return to the original product URL
   without the added `v_id`; SKU and exact selected price must clear.
4. Select 3XL and verify €58.50. Closing and reopening the modal must initialize a
   fresh selection, with no stale previous variant ID.
5. For a product with multiple images, activate `[data-v7-preview="1"]` and verify
   the main image changes to the second verified source image. Buttons expose
   `aria-pressed`; option controls have native labels and keyboard operation.
6. Verify browsing and variant previews create no Site-side cart, payment or
   fulfillment requests. Native original-store actions remain on that store.

Key selectors: `[data-v7-option="Size"]`, `[data-v7-selected-price]`,
`[data-v7-selected-sku]`, `[data-v7-selected-variant-id]`,
`[data-v7-original-buy]`, and `[data-v7-preview]`.

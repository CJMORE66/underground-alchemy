> Aktuální doplnění: [SHOP_REPAIR.md](SHOP_REPAIR.md) a úvod
> [COMMERCE.md](../COMMERCE.md) popisují novější audit a zachování datovaných
> původních cen. Dřívější požadavek této specifikace „bez cen“ je tím nahrazen.
> Checkout zůstává nedostupný; současná oprava neověřila placenou výrobu.

# Native CAISIK shop / preview release

The new `/shop/` route uses the approved CAISIK logo, saturated yellow/black identity and authentic existing Printful mockups. It consumes `/shop/catalog.json?v=2`, with no external ecommerce SDK, new account, remote tracking, microphone or location request.

## Product and checkout boundary

The catalogue contract is version 1 with `checkedAt`, `products`, and an explicit preview state. Product identity, `displayName`/`name`, `category` (`tees`, `hoodies`, `accessories`), local image, original preview images, actual option values and exact variant IDs/SKUs are retained. A unique matching combination yields its exact source SKU; incomplete, missing or ambiguous selections yield no match. Size/colour option **values** are never translated or rewritten, even when their visible labels are translated.

This release intentionally has no active checkout/cart/payment or order request. Historical prices and availability are not rendered. Even an unexpected `checkout.enabled=true` in a modified JSON cannot create a purchase action. Root must implement and separately verify real checkout when merchant credentials and a payment provider become available; merely changing a flag is insufficient. The UI says the collection is available to browse and sales have not opened. Provider credentials, private print-file URLs and upstream JSON are never used in the browser.

Local images use only `/assets/catalog/…` filenames. Additional views may load only HTTPS Printful `files.cdn.printful.com/files/…` URLs, and only after the visitor opens a product and chooses that view. No generic or invented views are added. A failed image leaves a readable fallback; catalogue fetch failure offers retry.

## Interactions and accessibility

Actual search matches names and original SKU strings, case/accent-insensitively. Category buttons use the actual catalogue categories. Dialog option controls are native selects; close returns focus to the original card without scrolling the page. An unmounted page aborts loading, removes listeners, closes its dialog and ignores late fetches. There is no animation clock. Product hover/focus scale is slight, never hides an action, and is disabled by reduced motion or `data-motion=off`. Native page scrolling remains intact.

The responsive grid has two columns on narrow phones and four on desktop, with normal flow (no extra sticky controls), 44px-or-larger action targets, and at least14px explanatory text. Native rendering and phone screenshots remain a root/browser QA step.

## Verification

`node tests/shop.mjs` passes against actual20product/86variant source data and the real DOM runtime: source-preserved exact option matching, no stale prices/orders/old-checkout forwarding, public-field allowlist, image host safety, search/category/detail actions, no-result reset, incomplete/invalid/ambiguous variants, escaped hostile content, retry/image fallback, focus restoration, abort and late-response cleanup. This is runtime/source verification, not a live Printful or paid-order test.

## Translation import

The following canonical JSON is for root to merge into `docs/i18n/` and compile. Product names/SKUs remain authoritative. English chapter/brand words remain deliberate. `Black` etc. are display-only option translations; native select `value` remains the exact source value.

```json
{
  "version": 1,
  "entries": {
    "Přejít ke kolekci": {
      "cs": "Přejít ke kolekci",
      "en": "Skip to the collection",
      "fr": "Aller à la collection"
    },
    "Navigace obchodu": {
      "cs": "Navigace obchodu",
      "en": "Shop navigation",
      "fr": "Navigation de la boutique"
    },
    "Zpět do Alchemy ↗": {
      "cs": "Zpět do Alchemy ↗",
      "en": "Back to Alchemy ↗",
      "fr": "Retour à Alchemy ↗"
    },
    "TVŮJ ZNAK.": {
      "cs": "TVŮJ ZNAK.",
      "en": "YOUR MARK.",
      "fr": "TON SIGNE."
    },
    "TVŮJ SVĚT.": {
      "cs": "TVŮJ SVĚT.",
      "en": "YOUR WORLD.",
      "fr": "TON MONDE."
    },
    "Myšlenky z města. Původní návrhy, které můžeš nosit.": {
      "cs": "Myšlenky z města. Původní návrhy, které můžeš nosit.",
      "en": "Ideas from the city. Original designs you can wear.",
      "fr": "Des idées venues de la ville. Des créations originales à porter."
    },
    "Kolekce je k prohlédnutí. Prodej zatím není spuštěný.": {
      "cs": "Kolekce je k prohlédnutí. Prodej zatím není spuštěný.",
      "en": "Browse the collection. Sales are not open yet.",
      "fr": "Découvre la collection. Les ventes ne sont pas encore ouvertes."
    },
    "PROHLÉDNOUT KOLEKCI ↓": {
      "cs": "PROHLÉDNOUT KOLEKCI ↓",
      "en": "EXPLORE THE COLLECTION ↓",
      "fr": "DÉCOUVRIR LA COLLECTION ↓"
    },
    "OMERTA WITH EGO — původní produktový mockup Printful, nikoli fotografie fyzického vzorku": {
      "cs": "OMERTA WITH EGO — původní produktový mockup Printful, nikoli fotografie fyzického vzorku",
      "en": "OMERTA WITH EGO — original Printful product mockup, not a photograph of a physical sample",
      "fr": "OMERTA WITH EGO — aperçu produit original Printful, pas une photographie d’un échantillon physique"
    },
    "PŮVODNÍ NÁVRH / PRODUKTOVÝ MOCKUP": {
      "cs": "PŮVODNÍ NÁVRH / PRODUKTOVÝ MOCKUP",
      "en": "ORIGINAL DESIGN / PRODUCT MOCKUP",
      "fr": "CRÉATION ORIGINALE / APERÇU PRODUIT"
    },
    "Vyber si vlastní stopu.": {
      "cs": "Vyber si vlastní stopu.",
      "en": "Choose your own mark.",
      "fr": "Choisis ta propre trace."
    },
    "Načítám kolekci…": {
      "cs": "Načítám kolekci…",
      "en": "Loading the collection…",
      "fr": "Chargement de la collection…"
    },
    "Najít návrh": {
      "cs": "Najít návrh",
      "en": "Find a design",
      "fr": "Trouver un modèle"
    },
    "Název nebo SKU": {
      "cs": "Název nebo SKU",
      "en": "Name or SKU",
      "fr": "Nom ou référence SKU"
    },
    "Druh produktu": {
      "cs": "Druh produktu",
      "en": "Product type",
      "fr": "Type de produit"
    },
    "Načítám skutečné návrhy z kolekce.": {
      "cs": "Načítám skutečné návrhy z kolekce.",
      "en": "Loading the original collection designs.",
      "fr": "Chargement des créations originales de la collection."
    },
    "Pro výběr návrhů zapni JavaScript. Prodej zatím není spuštěný.": {
      "cs": "Pro výběr návrhů zapni JavaScript. Prodej zatím není spuštěný.",
      "en": "Enable JavaScript to browse designs. Sales are not open yet.",
      "fr": "Active JavaScript pour parcourir les modèles. Les ventes ne sont pas encore ouvertes."
    },
    "Obrázky jsou původní produktové mockupy. Barevné a velikostní varianty vycházejí z uložené kolekce; dnešní dostupnost není potvrzená.": {
      "cs": "Obrázky jsou původní produktové mockupy. Barevné a velikostní varianty vycházejí z uložené kolekce; dnešní dostupnost není potvrzená.",
      "en": "Images are original product mockups. Colour and size options come from the saved collection; current availability has not been confirmed.",
      "fr": "Les images sont des aperçus produits originaux. Les couleurs et tailles proviennent de la collection enregistrée ; leur disponibilité actuelle n’est pas confirmée."
    },
    "Původní Blackbook ↗": {
      "cs": "Původní Blackbook ↗",
      "en": "Original Blackbook ↗",
      "fr": "Blackbook original ↗"
    },
    "Zavřít návrh": {
      "cs": "Zavřít návrh",
      "en": "Close design",
      "fr": "Fermer le modèle"
    },
    "Vše": {
      "cs": "Vše",
      "en": "All",
      "fr": "Tout"
    },
    "Trička": {
      "cs": "Trička",
      "en": "T-shirts",
      "fr": "T-shirts"
    },
    "Mikiny": {
      "cs": "Mikiny",
      "en": "Hoodies",
      "fr": "Sweats"
    },
    "Doplňky": {
      "cs": "Doplňky",
      "en": "Accessories",
      "fr": "Accessoires"
    },
    "Náhled se nepodařilo načíst. Název a varianty jsou stále dostupné.": {
      "cs": "Náhled se nepodařilo načíst. Název a varianty jsou stále dostupné.",
      "en": "The preview could not load. The name and variants remain available.",
      "fr": "L’aperçu n’a pas pu se charger. Le nom et les variantes restent disponibles."
    },
    "{0} návrhů": {
      "cs": "{0} návrhů",
      "en": "{0} designs",
      "fr": "{0} modèles"
    },
    "Prohlédnout návrh": {
      "cs": "Prohlédnout návrh",
      "en": "View design",
      "fr": "Voir le modèle"
    },
    "Varianty:": {
      "cs": "Varianty:",
      "en": "Variants:",
      "fr": "Variantes :"
    },
    "Žádný návrh neodpovídá. Zkus kratší dotaz nebo jiný druh produktu.": {
      "cs": "Žádný návrh neodpovídá. Zkus kratší dotaz nebo jiný druh produktu.",
      "en": "No designs match. Try a shorter search or another product type.",
      "fr": "Aucun modèle ne correspond. Essaie une recherche plus courte ou un autre type de produit."
    },
    "Zobrazit celou kolekci": {
      "cs": "Zobrazit celou kolekci",
      "en": "Show the full collection",
      "fr": "Afficher toute la collection"
    },
    "Vybraná varianta:": {
      "cs": "Vybraná varianta:",
      "en": "Selected variant:",
      "fr": "Variante sélectionnée :"
    },
    "SKU:": {
      "cs": "SKU:",
      "en": "SKU:",
      "fr": "SKU :"
    },
    "Tato kombinace v uložené kolekci není. Zkus jinou variantu.": {
      "cs": "Tato kombinace v uložené kolekci není. Zkus jinou variantu.",
      "en": "This combination is not in the saved collection. Try another variant.",
      "fr": "Cette combinaison n’est pas dans la collection enregistrée. Essaie une autre variante."
    },
    "Vyber velikost a barvu pro zobrazení přesné varianty.": {
      "cs": "Vyber velikost a barvu pro zobrazení přesné varianty.",
      "en": "Choose a size and colour to see the exact variant.",
      "fr": "Choisis une taille et une couleur pour voir la variante exacte."
    },
    "Produktové náhledy": {
      "cs": "Produktové náhledy",
      "en": "Product previews",
      "fr": "Aperçus du produit"
    },
    "Pohled": {
      "cs": "Pohled",
      "en": "View",
      "fr": "Vue"
    },
    "Produktový mockup. Nejde o fotografii fyzického vzorku.": {
      "cs": "Produktový mockup. Nejde o fotografii fyzického vzorku.",
      "en": "Product mockup. This is not a photograph of a physical sample.",
      "fr": "Aperçu produit. Il ne s’agit pas d’une photographie d’un échantillon physique."
    },
    "Velikost": {
      "cs": "Velikost",
      "en": "Size",
      "fr": "Taille"
    },
    "Barva": {
      "cs": "Barva",
      "en": "Colour",
      "fr": "Couleur"
    },
    "Vyber variantu": {
      "cs": "Vyber variantu",
      "en": "Choose a variant",
      "fr": "Choisis une variante"
    },
    "Zobrazené varianty pocházejí z uložené kolekce. Dnešní dostupnost není potvrzená.": {
      "cs": "Zobrazené varianty pocházejí z uložené kolekce. Dnešní dostupnost není potvrzená.",
      "en": "The displayed variants come from the saved collection. Current availability has not been confirmed.",
      "fr": "Les variantes affichées proviennent de la collection enregistrée. Leur disponibilité actuelle n’est pas confirmée."
    },
    "Kolekci se nepodařilo načíst. Zkus to znovu.": {
      "cs": "Kolekci se nepodařilo načíst. Zkus to znovu.",
      "en": "The collection could not load. Try again.",
      "fr": "La collection n’a pas pu se charger. Réessaie."
    },
    "Načíst znovu": {
      "cs": "Načíst znovu",
      "en": "Try again",
      "fr": "Réessayer"
    },
    "Black": {
      "cs": "Černá",
      "en": "Black",
      "fr": "Noir"
    },
    "White": {
      "cs": "Bílá",
      "en": "White",
      "fr": "Blanc"
    },
    "Red": {
      "cs": "Červená",
      "en": "Red",
      "fr": "Rouge"
    },
    "Navy": {
      "cs": "Tmavě modrá",
      "en": "Navy",
      "fr": "Bleu marine"
    },
    "Dark Chocolate": {
      "cs": "Tmavě čokoládová",
      "en": "Dark Chocolate",
      "fr": "Chocolat foncé"
    },
    "Default": {
      "cs": "Výchozí",
      "en": "Default",
      "fr": "Standard"
    },
    "Faded Grey": {
      "cs": "Vybledlá šedá",
      "en": "Faded Grey",
      "fr": "Gris délavé"
    },
    "Gold / Black / Black": {
      "cs": "Zlatá / černá / černá",
      "en": "Gold / Black / Black",
      "fr": "Or / Noir / Noir"
    },
    "Light Steel": {
      "cs": "Světle ocelová",
      "en": "Light Steel",
      "fr": "Gris acier clair"
    },
    "Pigment Midnight Navy": {
      "cs": "Pigmentovaná noční modř",
      "en": "Pigment Midnight Navy",
      "fr": "Bleu marine nuit pigmenté"
    },
    "{0} návrh": {
      "cs": "{0} návrh",
      "en": "{0} design",
      "fr": "{0} modèle"
    },
    "{0} návrhy": {
      "cs": "{0} návrhy",
      "en": "{0} designs",
      "fr": "{0} modèles"
    }
  }
}
```

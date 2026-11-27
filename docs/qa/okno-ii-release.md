# Okno II a Terénní vydání Paříže

## Co je součástí vydání

| Část | Ověřitelný výsledek |
| --- | --- |
| Film a Příběh | Dvě původní cesty z filmu ústí do stejné kapitoly. Rozehraný krok má vlastní adresu. Hráčův osmikrokový takt zní v okně II. Tah z TRANSMUTE se vrací na zdi i na obalu desky. |
| Čtyři prostory | Příběh, Atlas Paříže, Dílna a Můj Blackbook mají samostatnou navigaci. Soukromým stránkám zůstává příslušná stopa. Galerie CAISIK a Původní vydání mají vlastní veřejné vstupy. |
| Terénní vydání | Le Grand Jeu, Le M.U.R. Oberkampf a Le Lavo//Matik mají dokumentární snímek, přístupové podmínky, zdroj, místní mapu a stránku pro kresbu i text. Fikční odbočka a Dílna uchovávají přesnou adresu původu. |
| Drop | 20 návrhů a 86 variant z původních mockupů. Konkrétní produkty vedou do veřejné galerie a k principům. Výběr variant nevyžaduje objednávku. |
| QA | Původní DOM filmu, program, styl a závislosti mají kontrolní součty verze 70. Integrační test čte vlastní uložená data hráče a porovnává skutečné výsledky v rozhraní. |

## Jak ověření zopakovat

- `npm test` ověřuje atlas, film a herní průchod. Schválený otisk `dist/alchemy-prologue.js` má SHA-256 `7c270608a6f08d768aa7de02e4a7501efadc2a7ccd61aa435f9074999bdca1e8`.
- `npm run test:commerce` spouští lookbook, košík, rozhraní checkoutu, import Printful, lokální ověření serveru, Stripe/SQL a Worker. Produkční platba ani objednávka nebyly součástí testu.
- `npm run build` a následný `npm run check:commerce-release` kontrolují balení pro Sites, shodu sestaveného klienta a varianty katalogu.
- `npm run test:edition:browser` potřebuje Python Playwright a Chromium. Pro místní instalaci Chromia lze předat proměnnou `CHROMIUM_EXECUTABLE`. Prohlížeč používá pouze soubory z `dist/`. Ve třech rozměrech ověřuje hráčův takt, opravený tah, přímý návrat, skicu, rozepsaný text, dílnu a Drop. Dvanáct odkazů z nálepek kontroluje v mobilním režimu.
- Rozměry prohlížeče byly 390 × 844, 844 × 390 a 1366 × 900. Fyzický telefon, povolení hardwarového mikrofonu a živý přenos GPT-Live zůstávají samostatnou kontrolou.

## Soubory proti záloze před změnou

Výchozí zdroj Sites je `e3268212efa4aab65dae5a66ddcb4a88255f1642`. GitHub záloha stejného stromu je [27a3aca](https://github.com/CJMORE66/underground-alchemy/commit/27a3aca7a64b788141f0939a358f557e8f3f2b33).

Celkem 81 souborů. Upravených 62, nových 19.

| Stav | Soubor |
| --- | --- |
| Upraven | `README.md` |
| Upraven | `dist/alchemist-performance.js` |
| Upraven | `dist/archive/index.html` |
| Upraven | `dist/art/index.html` |
| Nový | `dist/assets/paris-zin/east-paris.svg` |
| Nový | `dist/assets/paris-zin/le-grand-jeu.webp` |
| Nový | `dist/assets/paris-zin/le-lavomatik.webp` |
| Nový | `dist/assets/paris-zin/mur-oberkampf.webp` |
| Upraven | `dist/atlas-frequency.css` |
| Upraven | `dist/atlas-frequency.js` |
| Upraven | `dist/atlas-principles.js` |
| Upraven | `dist/atlas.js` |
| Upraven | `dist/corner-note-store.js` |
| Upraven | `dist/corner-quest.js` |
| Nový | `dist/edition-journal.css` |
| Nový | `dist/edition-journal.js` |
| Nový | `dist/edition-shell.css` |
| Nový | `dist/edition-shell.js` |
| Upraven | `dist/expeditions/breaking/index.html` |
| Upraven | `dist/expeditions/dj/index.html` |
| Upraven | `dist/expeditions/index.html` |
| Upraven | `dist/expeditions/knowledge/index.html` |
| Upraven | `dist/expeditions/mc/index.html` |
| Upraven | `dist/expeditions/writer/index.html` |
| Upraven | `dist/index.html` |
| Upraven | `dist/iris-engine.css` |
| Upraven | `dist/iris-engine.js` |
| Upraven | `dist/iris-story.js` |
| Upraven | `dist/masterworks.js` |
| Upraven | `dist/metro-quest.js` |
| Upraven | `dist/needle-imprint-store.js` |
| Upraven | `dist/needle-street.js` |
| Nový | `dist/paris-zin.css` |
| Nový | `dist/paris-zin.js` |
| Upraven | `dist/play/index.html` |
| Upraven | `dist/q/as-above/index.html` |
| Upraven | `dist/q/cause-effect/index.html` |
| Upraven | `dist/q/correspondence/index.html` |
| Upraven | `dist/q/generation/index.html` |
| Upraven | `dist/q/mentalism/index.html` |
| Upraven | `dist/q/polarity/index.html` |
| Upraven | `dist/q/rhythm/index.html` |
| Upraven | `dist/q/shadow-work/index.html` |
| Upraven | `dist/q/so-below/index.html` |
| Upraven | `dist/q/transmute/index.html` |
| Upraven | `dist/q/underground/index.html` |
| Upraven | `dist/q/vibration/index.html` |
| Upraven | `dist/revizor-quest.js` |
| Upraven | `dist/revizor-store.js` |
| Upraven | `dist/shadow-quest-store.js` |
| Upraven | `dist/shadow-quest.js` |
| Nový | `dist/shop/catalog-model.js` |
| Upraven | `dist/shop/catalog.json` |
| Nový | `dist/shop/drop.js` |
| Upraven | `dist/shop/index.html` |
| Upraven | `dist/shop/shop-stage.css` |
| Upraven | `dist/shop/shop.js` |
| Upraven | `dist/shop/source-commerce.js` |
| Nový | `dist/story-room.css` |
| Nový | `dist/story-room.js` |
| Nový | `dist/story-state.js` |
| Upraven | `dist/street-trails.js` |
| Upraven | `dist/writer-quest.js` |
| Upraven | `dist/writer-repair-store.js` |
| Nový | `docs/qa/okno-ii-release.md` |
| Upraven | `package.json` |
| Upraven | `server/commerce/live-catalog.js` |
| Upraven | `tests/atlas-place-browser.mjs` |
| Upraven | `tests/checkout-ui.mjs` |
| Upraven | `tests/city-atlas-integration.mjs` |
| Nový | `tests/drop.mjs` |
| Nový | `tests/edition-browser.py` |
| Nový | `tests/edition-contract.mjs` |
| Upraven | `tests/iris-engine.mjs` |
| Upraven | `tests/live-catalog.mjs` |
| Upraven | `tests/printful-sync.py` |
| Upraven | `tests/shop.mjs` |
| Upraven | `tools/build-expeditions.py` |
| Upraven | `tools/prepare-shop-catalog.py` |
| Upraven | `tools/sync-printful.py` |
| Upraven | `tools/wire-selfmade.py` |

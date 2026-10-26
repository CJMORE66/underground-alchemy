# CAISIK / Underground Alchemy

Lokální rozšíření na RPG: začni [RPG200 / Hermes](docs/rpg200/START_HERE.md). Obsahuje plán 200 vylepšení, technické předpoklady, trvalou frontu a protokol nativního Hermes loopu. Jde o implementační plán; nenahrazuje níže uvedený současný funkční stav webu.

Projekt už obsahuje pět úplných expedic DJ, MC, Writer, Breaking a Knowledge. Nevytvářej duplicitní stránky ani novou značku. Závazná je schválená podrobná žlutozlatá grafika v `docs/atlas/APPROVED-STYLE.md`.

1. Přečti aktuální `docs/expeditions/QA_REPORT.md` a `docs/expeditions/README.md`.
2. Zdrojový obsah je v `docs/expeditions/source-content/`; ověření míst v obou `verification-*.json`, kulturní kontext v `culture-context.json`. Provozní data mají datum kontroly; návrh času není rezervace.
3. `tools/import-expeditions.py` vytváří kanonické JSON a `tools/build-expeditions.py` šest statických HTML stránek v `dist/expeditions/`. Projekt používá HTML/CSS/ES modules. CMS ani React zde nejsou.
4. Runtime: `app.js`, `store.js`, `schema.js`, `sw.js`. Zápisník patří lokálnímu prohlížeči, exportuje se do JSON a úplného UTF-8 TXT průvodce. Nikdy nepřepisuj původní klíče atlasu ani poškozený zápisník prázdným záznamem.
5. Spusť `node tests/expeditions.mjs` a `npm test`; při zásahu do původního pohybu i testy art-scenes, art-motion, logo-motion a hero-motion. Ověř skutečné zobrazení a export, ne jen datové počty.

Aktuální změny chrání poznámky při více otevřených kartách, zachovají poškozený originál pro obnovu a bezpečně aktualizují offline textový balíček. Výchozí bod pro rollback této úpravy je uložená verze 22. Přesný postup, nedodaná odborná média a meze ověření jsou v uvedených dokumentech.

## SELFMADE / RPG

Nový hratelný vstup je `/play/`. Čti `docs/selfmade/README.md`, `PLAN.md` a `QA_REPORT.md`; `coverage.json` poctivě rozlišuje všech 200 požadavků. Aktuální stav nepovažuj automaticky za dokončení lokální fronty RPG200. Po dalších generátorech spusť `python tools/wire-selfmade.py`; generátor expedic jej volá sám. Nové moduly používají pouze klíč `caisik-selfmade-v1`.

## Živá typografie a prostorový atlas

`dist/text-motion.js/css` přidává vratné vstupy a výstupy textu, reakce písmen na myš a přístupné reakce CTA. `dist/play/panel-motion.js` řídí krátké přerušitelné přechody pracovních prostorů. Čti `docs/selfmade/TEXT_MOTION_QA.md`.

Hidden City používá volitelný `dist/city-map.js/css` nad skutečnými daty OpenFreeMap, s původním Leafletem jako 2D zálohou. Styl a jediný URL zdroje jsou v `dist/map-data/caisik-style.json`; po upgradu rendereru spusť `npm run build:map-vendor`. Čti `docs/atlas/CITY_MAP_DATA.md` a `CITY_MAP_QA.md`. Výšky jsou přibližné, spojnice zastávek není navigace. Pro rollback lze znovu nasadit verzi 24; nemaž uživatelská data.

## Ilustrace a prostorové modely dvanácti lokací

`dist/assets/places-caisik/manifest.json` propojuje jednotlivé autorské WebP ilustrace s trvalými ID původního atlasu. Přesné produkční prompty a hashe jsou v `docs/atlas/PLACE_ILLUSTRATION_PROMPTS.json`. Ilustrace vznikly jednotlivě vestavěným generátorem; nejsou dokumentárními fotografiemi. Původní fotografie a jejich licence zůstávají v rozbalovací části profilu. Neměň kvůli výtvarnému stylu historické zdroje ani údaje o přístupu.

`dist/place-art-motion.js/css` obsahuje dvanáct individuálně komponovaných animací nad původními ilustracemi. Trasy oken, rozet a konstrukcí používají jejich skutečné obrazové souřadnice; při výměně WebP uprav i scénu. `src/city-landmarks/` obsahuje dvanáct zjednodušených vlastních 3D modelů a konečné časové posloupnosti. `node tools/build-city-landmarks.mjs` vytváří lazy bundle `dist/city-landmarks.js`. Stejné modely se zobrazují jako prostorová vrstva mapy a ve volitelném otáčecím prohlížeči s projekcí do SVG.

Ověření: `node tests/city-landmarks.mjs`, `node tests/place-art-motion.mjs`, `node tests/place-visuals-integration.mjs` a původní testy atlasu. Podrobnosti a limity: `docs/atlas/LANDMARK_RELEASE_QA.md`, `LANDMARK_MODELS.md`, `PLACE_ART_MOTION.md`. Rollback této změny: znovu nasadit verzi 26, bez mazání lokálních poznámek či jiných uživatelských dat.

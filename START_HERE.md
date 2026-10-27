# CAISIK / Underground Alchemy

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

## STREET / SOUND / THOUGHT — živá kultura

`dist/culture-data.json` přidává čtrnáct ověřovaných kulturních míst k původním dvanácti. Zdroje výzkumu z 26. října 2026 jsou v `docs/atlas/research-graffiti-shops-2026-10-26.json` a `research-music-thought-2026-10-26.json`. Spravuj kanonické JSON i výzkumný záznam společně; datum kontroly se týká přečtených zdrojů, nikoli osobní inspekce. Nepřebírej staré rozvrhy a ceny bez nové kontroly. Le Grand Jeu používá stejné ID jako ve Writer expedici. Souřadnice `null` zachovej, dokud nemáš konkrétní zdroj mapového bodu; adresa sama o sobě nedokládá přesný vstup.

`dist/culture-data.js` validuje volitelný obsah, zachovává původní identity a připravuje tři nové tematické posloupnosti. `dist/culture-board.js/css` poskytuje kulturní rozcestník, vlastní praxi, terénní režim a animované autorské SVG symboly. Symboly nejsou rekonstrukce nových budov. Blackbook používá stávající `atlas-observations` a existující export; nepřidává účet ani uploady. Aktuální modely nadále patří jen původním dvanácti místům.

U ilustrací jsou výraznější jednotlivé obrysy, světelné tahy a pohyb malovaných detailů. Ovládání pohybu přímo u mapy sdílí původní nastavení `atlas-motion`; vypnutí uživatelem nebo systémové omezení respektuj. Po generování starších stránek spusť `python tools/wire-selfmade.py`.

Ověření: `node tests/culture-board.mjs`, `node tests/culture-integration.mjs`, `node tests/place-art-motion.mjs`, `node tests/place-visuals-integration.mjs`, `npm test`, `node tests/city-map.mjs` a `node tests/expeditions.mjs`. Skutečné výsledky, screenshoty a limity obsahuje `docs/atlas/CULTURE_RELEASE_QA.md`. Rollback: znovu nasadit uloženou verzi 27; nemaž žádná lokální uživatelská data.


## Aktuální rozšíření: jazyky, studia a cesta městem (27. října 2026)

Tato úprava navazuje na uloženou verzi 28; to je její výchozí bod pro rollback. Zachovává schválené ilustrace, všechny původní routy i klíče poznámek. K předchozím 14 kulturním místům přidává šest studií: celkem 32 objevů, 31 doložených mapových bodů. Spot 13 zůstává bez ověřeného pinu. Spravuj `dist/culture-data.json` společně s `docs/atlas/research-studios-2026-10-26.json` a `PLACE_POSITION_REVIEW.json`; studiové ceny, termíny ani rezervace se nevymýšlejí. Třílekční FROM STREET TO SESSION je příprava vlastní session, nikoli sjednaná výuka.

Mapa standardně používá skutečné půdorysy z mapových dat a jen dostupné orientační výšky. Vlastní zjednodušené modely jsou samostatná volba AUTORSKÉ MODELY; nejsou zaměřené rekonstrukce ani přesné vstupy. Údaje o geometrii a pramenech spravuj v `src/city-landmarks/registry.js`; po změně spusť `node tools/build-city-landmarks.mjs`. Čti `CITY_IDENTITY.md`, `LANDMARK_ACCURACY.md` a `JOURNEY_SCROLL.md` v `docs/atlas/`.

`dist/languages.js/css`, `dist/language-lessons.json` a `dist/i18n/{cs,en,fr}.json` přidávají trvalé přepínání CZ/EN/FR, 40 frází, čtenářské porovnání a místní výslovnost na kliknutí. Zdrojové překlady jsou v `docs/i18n/*-translations.json`; výsledné slovníky vytváří `python tools/build-languages.py`. Nový veřejný text přelož ve všech třech jazycích. Vlastní text uživatele označ `data-i18n-user`; nikdy jej nepřidávej do sdíleného slovníku. `python tools/wire-selfmade.py` zachovává jazykové ovládání po starších generátorech. Oba skripty spusť před testy a balením.

Čti `docs/atlas/LANGUAGES.md`, `LANGUAGES_RELEASE_QA.md` a `CITY_LANGUAGES_RELEASE.md`. Lokální jazyková praxe používá pouze dva nové klíče popsané v dokumentaci; při rollbacku nemaž žádná uživatelská data. Úspěšná explicitní volba „Uložit pro cestu bez připojení“ v expedicích zahrnuje také tři slovníky a fráze; celý web tím nezískává offline mapy ani externí stránky. Skutečné snímky jsou v `docs/qa/city-languages/`.


## Mobilní procházení a nativní kolekce (27. října 2026)

Nejnovější změna vychází z uložené verze 29. Čti `docs/commerce/RELEASE_2026-10-27.md`, `docs/atlas/MOBILE_BROWSING.md` a `docs/critique/CAISIK_2026-10-27.md`. Atlas má rychlý výběr, předchozí/další místo v aktuálním filtru a krátký volitelný seznam. Ovládání nemění pozici dokumentu ani zápisníky. WebGL a dostupnost externích mapových podkladů mají samostatně popsané meze ověření.

`/shop/` zpřístupňuje původní kolekci 20 návrhů / 86 variant; starý externí checkout se nenabízí. Jde o prohlížení kolekce s přesnými SKU, nikoli dokončený prodej. Pro přípravu historického veřejného katalogu slouží `tools/prepare-shop-catalog.py`; živý čtecí import připravuje `tools/sync-printful.py` podle `docs/commerce/PRINTFUL_CONNECT.md`. Nikdy nepředstírej autentizaci, aktuální ceny, objednávku nebo produkční Printful napojení bez skutečného ověření. Stávající Printful store je 18912189; nevytvářej náhradní účet nebo nové fiktivní produkty. Tajemství patří pouze do lokálního prostředí či správce tajemství. Připojení účtu, platební brána a objednávkový provoz zůstávají samostatné nedokončené kroky.

Nové testy: `node tests/atlas-place-browser.mjs`, `node tests/shop.mjs`, `python tests/printful-sync.py`. Po generátorech spusť oba jazykové/wiring skripty. Nové screenshoty jsou v `docs/qa/mobile-shop/`. Rollback: znovu nasadit verzi 29, bez mazání lokálních dat.

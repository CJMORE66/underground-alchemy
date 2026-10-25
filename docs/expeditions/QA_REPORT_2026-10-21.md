# CAISIK expedice — kontrola vydání 21. 10. 2026

## Rozsah a výsledek

Implementace přidává šest skutečných statických stránek, pět samostatně použitelných expedic, patnáct úplných lekcí a třicet jedna zařazení dvaceti tří míst. Původní atlas, všech sedm principů, Frequency, Living Wall, animační systémy a galerie sta děl jsou zachované. Nevzniká účet, rezervace, partnerství, placený provoz ani upload médií.

## Automatické kontroly

| Kontrola | Výsledek / co skutečně ověřuje |
|---|---|
| `python tools/import-expeditions.py` | PASS — 5 kapitol, 15 úplných lekcí, 23 míst, 31 zastávek. |
| `python tools/build-expeditions.py` | PASS — všech šest HTML stránek s obsahem dostupným bez JS. |
| `node tests/expeditions.mjs` | PASS — vazby dat, stabilní oddělená ID, null souřadnice, 17 odmítnutých neplatných vstupů, všech 15 úplných lekcí, adresy a zdroje 31 zastávek, 454 syntakticky bezpečných odkazů s ověřením lokálních cílů, hashe schválené grafiky, rozměry obnovených masterů. Nejde o síťový test všech externích URL. |
| `node tests/expeditions-runtime.mjs` | PASS — lokální persistence, selhání/poškození storage, UTF-8 export a úplný Markdown průvodce, vratný scroll, skutečný kód workeru ve VM, omezený offline scope, chybějící obrázek, postup mezi zastávkami a chyby quota/open/read cache. |
| `npm test` | PASS — původních 12 míst, 3 trasy, 7 principů, 8 témat, 100 děl, lokální assety a DOM vazby. |
| `node tests/art-scenes.mjs` | PASS — 14 scén / 15 umístění, původní hashe, masky a routování lekcí. |
| `node tests/art-motion.mjs` | PASS — sémantický pohyb principů, růst světa, celé kyvadlo, pause/replay, lifecycle a fallback. |
| `node tests/logo-motion.mjs` | PASS — podpis, oko, hover, replay, pause a původní fallback. |
| `node tests/hero-motion.mjs` | PASS — hero vrstvy, částice, pohyb a statický fallback. |
| `git diff --check` | PASS — whitespace. |

Testy nepoužívají nově instalované závislosti; HTML čte Python stdlib parser. Existující závislosti projektu se nemění.

## Skutečná kontrola v prohlížeči

Kontrolováno na spravovaném lokálním náhledu v desktopovém Chrome, viewport 1363 × 936. Všech šest stránek bylo opravdu otevřeno. DJ, MC, Writer, Breaking a Knowledge mají po třech lekcích, příslušné počty zastávek 6/7/6/6/6, načtená validovaná data a žádný chybějící aktivní obrázek. Žádná stránka nepřetéká vodorovně.

- Writer: skutečná sticky scéna vedle úplného textu. Postup 0 → 1 a návrat k první lekci vrací diagram i fázi na začátek. Přehled při rychlém přesunu mezi první a poslední kapitolou mění aktivní scénu DJ → Knowledge → DJ.
- Terénní tlačítko skryje stage a ponechá všechny lekce i adresy. První adresa a úkol jsou přístupné přímo, bez animace. Ověřeno skutečné postupné tlačítko 1 → 2 → 3 → 4 → 5 → 6 → Blackbook; poslední akce nezruší aktuální zastávku. Návrat do příběhu synchronizuje URL na #story, aby změna orientace nepřepnula zpět starý terénní hash.
- Klávesa Space na fokusovaném přepínači skutečně aktivuje terénní režim. Formulář má nativní popisky a viditelné fokusy.
- Dvě zkušební české poznámky přežily reload. Skutečný JSON export se stáhl jako 547bajtový soubor a obsahoval vlastní text. Zkušební text byl po kontrole vymazán formulářem.
- Kliknutí na Markdown export bylo provedeno; cloudový prohlížeč následné stažení nedoručil. Obsah a úplnost Markdownu jsou ověřené automatickým testem, nikoli vydávané za úspěšné druhé stažení v browseru.
- Původní globální PAUSE MOTION se promítá do expedic: tlačítko ukáže „Klidný režim“, animovaná stage zmizí. Nastavení bylo po testu obnoveno.
- Záměrné offline uložení na HTTP náhledu viditelně nabídne textový export, protože zde není dostupný secure context. Skutečné offline chování workeru je testované ve VM; instalace na publikované HTTPS doméně a odpojení reálného telefonu nejsou tímto testem nahrazené.
- Původní homepage byla vizuálně zkontrolována: logo, hero i pět odkazů v navigaci se vejdou, stávající sekce existují a nový vstup vede do expedic.

Responzivní kontrola používá skutečně renderované iframe viewporty 390 × 844, 320 × 568 a 768 × 420, nikoli fotografii telefonu nebo zařízení Safari. Šířky dokumentu nepřekračují dostupnou plochu. 390 px zachovává malou sticky stage; 320 × 568 a krátký landscape automaticky použijí lineární klidný režim. V malém telefonu bylo skutečně otevřeno „Adresy a podmínky“ a přečtena první zastávka. Dočasný QA soubor není součástí vydání.

Systémové `prefers-reduced-motion` není v tomto cloudovém prohlížeči přepínatelné. Ověřena je implementovaná media query a shodná větev klidného režimu přes skutečné globální ovládání, ne změna nastavení OS. Skutečné iOS Safari, terénní cesta, odborná taneční demonstrace a reálná reakce lektora zatím nejsou otestované ani dodané.

## Důkazy

- [Desktop — přehled](qa/desktop-overview.jpg)
- [Desktop — úplná Writer lekce a scéna](qa/desktop-writer.jpg)
- [Responzivní Writer, malý telefon a landscape](qa/responsive-writer.jpg)

Jde o skutečné screenshoty renderovaného náhledu, nikoli generované návrhy UI. Byly pořízené před zveřejněním.

## Obsah, licence a zbývající produkce

Provozní kontrola je uchována v obou `verification-*.json`: 14 míst ověřeno, 7 částečně, 2 neověřena. Nejistoty jsou viditelné u míst. Převzaté rozvrhy nejsou živá dostupnost; žádné místo nemá vymyšlený přesný vstupní pin. Kulturní výklad používá šest institucionálních primárních zdrojů a rozlišuje fakta od autorského čtení.

Všech pět vzdálených masterů 2752 × 1536 i dodatečný archiv scén 1920 × 1080 bylo obnoveno; přesný stav a hashe jsou v `ASSET_IMPORT.json`. Produkční stránky používají poslední schválenou podrobnou žlutozlatou grafiku CAISIK. Obnovené plošší reference ji nenahradily.

Nedodané zůstávají licencované komentované DJ/MC nahrávky, rozhovory, videa kvalifikovaného tanečního spoluautora, skutečná zpětná vazba lektora, plný filmový morph/parallax, partnerské smlouvy, komerční povolení, živé rezervace a účty s přílohami. V textu se za hotové nevydávají. Připravený produkt je samostatný vzdělávací průvodce s vlastní tvorbou a lokálním zápisníkem.

Správa obsahu a přesný rollback na verzi 21 jsou popsány v [README.md](README.md).

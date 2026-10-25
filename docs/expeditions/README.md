# Správa expedic CAISIK

Expedice rozšiřují stávající atlas. Projekt používá statické HTML, CSS a JavaScript ES modules; publikuje se adresář `dist`. Nemá React, Next, Vite, CMS, backend ani synchronizaci účtu. Původní Hidden City, Seven Principles, Frequency, Living Wall a Blackbook zůstávají samostatně funkční.

## Zdroje a sestavení

Úpravy dělej v tomto repozitáři, z jeho kořene:

```sh
python tools/import-expeditions.py
python tools/build-expeditions.py
node tests/expeditions.mjs
node tests/expeditions-runtime.mjs
npm test
git diff --check
```

`docs/expeditions/source-content/` uchovává převzaté kapitoly, lekce, trasy a scene contracts. Provozní tvrzení z původního roadbooku nejsou automaticky aktuální. Importér kombinuje tyto soubory s redakčními úpravami v `tools/import-expeditions.py`, ověřením ve `verification-dj-mc-knowledge.json` a `verification-writer-breaking.json` a kontextem v `culture-context.json`.

Výsledkem importu je jediné veřejné datové schéma `dist/expeditions/data/expeditions.json`. Generátor `tools/build-expeditions.py` z něj vytváří šest HTML stránek. Generované JSON a HTML neupravuj samostatně: další sestavení by změnu přepsalo. Runtime tvoří `dist/expeditions/app.js`, `schema.js`, `store.js` a `sw.js`; vzhled je v `expeditions.css`.

Při změně adresy, přístupu či programu otevři uvedený primární zdroj, ověř konkrétní tvrzení a uprav příslušný verification soubor včetně URL a data kontroly. Nejistotu ponech viditelnou. Cena, rozvrh, otevřený mikrofon ani možnost malování nesmí být odvozena z ilustrace nebo starého exportu. Kulturní tvrzení musí mít zdroj; autorský výklad a tvůrčí zadání musí zůstat označené odlišně.

## Datová smlouva

`schemaVersion: 1` obsahuje kolekce `chapters`, `lessons`, `places`, `routes`, `sceneContracts`, `sources` a objekt `mediaStatus`. Validaci provádí `schema.js`; kontrolují ji také testy. Aktuální obsah má pět kapitol, patnáct lekcí, třicet jedna zastávek a dvacet tři míst.

- Kapitola má tři cíle, `lessonIds`, `routeId`, přípravu, domácí alternativu, kontext se `sourceIds` a `art: {poster, layer, alt}`.
- Lekce zachovává otázku, důvod, všímání, vysvětlený příklad, postup, kontrolu, výstup, rozšíření a přenos: `question`, `why`, `notice`, `example`, `steps`, `check`, `artifact`, `advanced`, `transfer`.
- Trvalé `place.id` označuje místo. `stop.id` označuje jeho konkrétní zařazení do trasy; dvě zastávky mohou sdílet stejné místo. Tato ID neměň kvůli přejmenování titulku.
- `coordinates: null` znamená neověřenou polohu, nikoli `0,0`. Navigace podle adresy není ověřený vstup. `access.status` je `verified`, `partial` nebo `unverified`, s `checkedAt`, shrnutím a podmínkami `requiresConfirmation`.
- Čas u zastávky je navržený čas vlastní práce, nikoli otevírací doba. Důkazem učení je vlastní výstup a zdůvodněná revize; nepřidávej procentní AI hodnocení umělecké kvality.

## Grafika a pohyb

Závazný je poslední schválený styl popsaný v `docs/atlas/APPROVED-STYLE.md`. Aktivní expedice používají původní schválené soubory beze změny bajtů: DJ `012.webp`, MC `020.webp`, Writer `044.webp`, Breaking `083.webp`, Knowledge `031.webp` z `/assets/masterworks-v2/`. Jejich SHA-256, rozměry a původ zaznamenává `ASSET_IMPORT.json`; testy ověřují zachování hashů.

Pět masterů 2752 × 1536 i samostatný export pěti scén 1920 × 1080 byly skutečně získány a vizuálně ověřeny. Obnovené mastery v `dist/expeditions/assets/masters/` jsou referenční materiál: jejich plošný komiksový styl nenahrazuje schválenou produkční grafiku. Archiv je uchován v `docs/expeditions/source-media/`. Malé výřezy se nevydávají za finální mastery.

Importované SVG v `assets/layers/` jsou vysvětlující diagramy, nikoli odborná demonstrace tance nebo plně oddělené postavy. Pohyb používá nativní scroll a vratné transformace; musí respektovat reduced motion a terénní režim. Novou animací nezakrývej text, adresu ani ovládání.

## Routy a návaznosti

Nové skutečné stránky jsou `/expeditions/` a `/expeditions/{dj,mc,writer,breaking,knowledge}/`. Každá kapitola má kotvy `#preparation`, `#story`, `#route`, `#blackbook`, `#sources` a stabilní kotvy lekcí a zastávek, například `#lesson-writer-1` a `#stop-writer-1`.

Stávající sekce se propojují přes `/#hidden-city`, `/#principles`, `/#frequency` a `/#living-wall`. Původní galerie Blackbook je `/art/`; existují také `/logo/`, `/archive/`, `/collections/{the-kybalion,shadow-work,as-above-so-below,underground-originals}/` a stránky principů `/q/{vibration,rhythm,cause-effect,transmute,underground,shadow-work,polarity,as-above,mentalism,so-below,correspondence,generation}/`. `/q/transmute/` odkazuje na princip Cause and Effect, nikoli na obraz Living Wall. Původní terénní zápisník je dialog na hlavní stránce, nemá samostatnou routu. Nevytvářej neexistující odkazy na přesné místo v atlasu.

## Blackbook, soukromí a offline

Expedice používají pouze vlastní klíč `localStorage` **`caisik-expeditions-v1`**. Původní klíče `atlas-*` se nepřepisují. Ukládají textové poznámky, volbu režimu a postup mezi zastávkami. JSON export `CAISIK-Expeditions-Blackbook.json` uchová zápisník; UTF-8 TXT export uloží úplný textový průvodce a poznámky. Připravený soubor má také přímý odkaz pro prohlížeče, které odmítnou automatické stažení. Automatický import exportu není součástí rozhraní.

Změny se ukládají jen po skutečně upravených polích a slučují s aktuálním zápisníkem. Dvě otevřené expedice tak nemažou poznámky druhé karty. Stejné pole má poslední skutečně uloženou úpravu; aktivně rozepsané pole se nepřepisuje vzdálenou změnou.

Selhání nebo poškození úložiště se zobrazuje ve stavové zprávě. Poškozený původní záznam se nepřepisuje; JSON export obsahuje také `recovery.rawNotebook` pro obnovu. Opravu původního JSON nejprve proveď v samostatné kopii. Nové poznámky exportuj před jakoukoli ruční obnovou. Při nedostatku místa může tlačítko Uložit znovu zapsat čekající změny po uvolnění úložiště. V tom případě nové poznámky žijí pouze v paměti stránky: pro zachování je nutný export. Vymazání dat webu v prohlížeči odstraní lokální zápisník i cache; exportovaný soubor tím nezmizí.

Offline ukládání spouští výslovně uživatel. Service worker má scope `/expeditions/`; ukládá texty všech pěti kapitol, runtime, diagramy a vybraný obraz. Nový worker musí nejprve uložit všech šest stránek a povinný runtime ve správných verzích; neúplný upgrade zachová předchozí offline balíček. Výsledek ukládání je viditelný. Externí mapy, programy a zdroje vyžadují připojení. Pokud prohlížeč offline cache nepodporuje nebo soubory chybí, použij textový export. Při změně offline balíčku aktualizuj verzi cache v `sw.js` a související URL/verze konzistentně otestuj.

Žádné nahrávky ani fotografie se neuploadují. Expedice neobsahují přílohy, nevyžádanou geolokaci, automatický zvuk ani marketingový tracking.

## Co ještě není dodáno

Nejsou dodané licencované DJ/MC ukázky a rozhovory, odborná taneční videa, reakce skutečného lektora, smlouvy s partnery, živá kapacita, rezervace ani účet se synchronizací. Web nic nezarezervuje a návštěvu nedeklaruje jako zaplacenou či potvrzenou. Vlastní záznam a skutečná zpětná vazba vznikají mimo textový editor. Veřejně přístupná hala nebo zeď sama nepotvrzuje souhlas s komerční lekcí; podmínky musí potvrdit správce. Odkaz na cizí hudbu či fotografii nenahrazuje oprávnění k užití.

## Kontrola vydání a návrat

Před vydáním zkontroluj desktop, telefon, krátkou landscape obrazovku, klávesnici, reduced motion, rychlý i zpětný scroll, chybějící obrázek, selhání storage a skutečné offline načtení. HTML musí zůstat užitečné i bez JavaScriptu. Kromě testů expedic spusť při zásahu do původního pohybu také `node tests/art-scenes.mjs`, `node tests/art-motion.mjs`, `node tests/logo-motion.mjs` a `node tests/hero-motion.mjs`. Vydání proveď až po kontrole skutečných screenshotů a příslušném oprávnění.

Výchozí checkpoint této úpravy je uložená **verze 22**, commit **`05f45362bc530ff8ff948c694fd285ac7c43962b`**, větev **`caisik-expeditions-base-v22`**. Sites project ID je `appgprj_6ad19e715dcc819185592c61456c5182`; uložená verze má ID `appgprj_6ad19e715dcc819185592c61456c5182~appgver_552be4e92aec8191bf1d8101fb266f5e`.

Pro rychlý provozní návrat znovu nasaď tuto uloženou verzi přes Sites. Pro trvalý návrat zdrojů obnov změny v novém commitu a po testech jej nasaď. **Neresetuj checkpoint větev, nemaž historii a nepoužívej force-push.** Rollback webu není záloha lokálních zápisníků návštěvníků; před změnou datového formátu zachovej kompatibilitu klíče nebo připrav migraci a export.

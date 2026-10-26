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

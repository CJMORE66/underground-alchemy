# Co znamená dokončený úkol

`done` vyjadřuje ověřenou lokální implementaci dané položky. Neznamená nasazení, odborné schválení, komerční připravenost nebo potvrzenou rezervaci.

Každý úkol musí mít současně:

1. Splněná všechna přesná kritéria z backlogu a společná kritéria produktu.
2. Funkční vlastní výstup nebo konkrétní technický kontrakt; ne pouze marketingový odstavec nebo tlačítko bez implementace.
3. Skutečně provedené relevantní kontroly, uložený fingerprint a průkazné podklady.
4. Oddělené review z jiného běhu. Reviewer kontroluje soubory a diff; nekopíruje závěr workera.
5. Vizuální změna doložená skutečným desktop/mobil screenshotem, klávesnicí/touchem a klidným režimem. U motion také start, transformaci a konec nebo krátký skutečný recording.
6. Žádnou regresi původních sekcí, rout, schválených assetů, zdrojů, úložišť a exportů.
7. Pravdivý seznam omezení a dodaných/nedodaných podkladů.

Helper vynucuje strojově ověřitelné části: vazby, stavovou frontu, skutečné exit codes, aktuální fingerprint, deklarovaná kritéria, existenci evidence a bezpečnou Git integraci. Samotná existence PNG není důkaz jeho pravdivosti nebo kvality; to musí zkontrolovat reviewer podle původu a skutečně běžící aplikace. Stejně tak JSON licence není sám o sobě licence.

## Existující ověřovací příkazy

Používej příkazy přiřazené konkrétnímu úkolu a doplň smysluplné testy nového chování. Není nutné spouštět všechny staré archivní testy pro každou kosmetickou změnu.

```bash
npm test
node tests/expeditions.mjs
node tests/expeditions-runtime.mjs
node tests/art-scenes.mjs
node tests/art-motion.mjs
node tests/logo-motion.mjs
node tests/hero-motion.mjs
python tests/rpg200_queue.py
python tests/rpg200_catalog.py
```

Statické testy nejsou browser QA. Mřížka pro dotčený UI tok: desktop, 390×844, 320×568, 768×420, dopředný/zpětný scroll, klávesnice, reduced motion/quiet, offline text, chybějící asset a storage failure. Výkon měř na skutečném cílovém zařízení; netvrď univerzálních 60 fps z desktop screenshotu.

## Reporty

Worker report: `schemas/worker.schema.json`. `implementation: existing` připouští skutečnou už existující funkci až po úplném doložení; nikdy pouhé přejmenování checkboxu.

Review report: `schemas/reviewer.schema.json`. `sourceFingerprint` musí odpovídat poslednímu úspěšnému `check` a nesmí se po review změnit zdroj. `run.session` / `reviewer.session` označuje jedinečný doložený samostatný běh; pokud provider session ID není dostupné, použij výslovně vlastní invocation ID a uchovej spouštěcí log. Neoznač ho za skutečné ID session poskytovatele.

Oba reporty mají vlastní soubor. `acceptance[].criterion` je přesný text jednotlivých kritérií a evidence jsou relativní cesty uvnitř přiděleného task worktree. Syntetická/anonymizovaná data; žádné osobní nahrávky nebo tokeny v Git commitu. Worker report i reviewerský text se samy o sobě nepovažují za důkaz hotové funkce.

## Práva, osoby a release

Externí gate musí uvádět konkrétní soubor/smlouvu/ověření, vlastníka, rozsah oprávnění a datum. Kvalifikovaný taneční materiál, lidská reakce, partnerská dohoda a právo komerčně použít hudbu nemohou vzniknout automatickým přejmenováním AI výstupu.

Před zveřejněním udělej samostatný release review: aktuální praktické údaje, licence, média, souhlas se sdílením, browser/telefon, rollback a uživatelské oprávnění publikovat. Lokální fronta nemá automatický deploy ani push.

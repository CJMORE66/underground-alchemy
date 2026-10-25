# Ověření plánovacího balíčku RPG200

Datum: 25. 10. 2026. Rozsah této dodávky je plán a lokální vývojová fronta; **200 produktových vylepšení není tímto balíčkem implementováno**. Kód běžícího webu v `dist/` se nemění.

## Provedené kontroly

| Kontrola | Výsledek |
| --- | --- |
| `python tools/rpg200.py validate` | PASS: přesně 200 RPG položek + 12 technických předpokladů; platné reference a acyklické závislosti |
| `python tests/rpg200_queue.py` | PASS: 25 testů v izolovaných dočasných repozitářích |
| `python tests/rpg200_catalog.py` | PASS: 3 kontroly skutečného katalogu, čitelného plánu, fází a skutečných vstupních souborů |
| `npm test` | PASS: původní atlas, zdroje, routy, principy, 100 artworků a syntaxe |
| `node tests/expeditions.mjs` | PASS: data, šest HTML vstupů, 454 lokálních URL a runtime/storage/offline kontrakty |
| `python -m py_compile tools/rpg200.py` | PASS |
| `git diff --check` | PASS |
| `python tools/rpg200.py doctor` | Provedeno: dostupné Git/Python/Node/npm; Hermes/Codex/OpenCode v tomto testovacím prostředí nejsou nainstalované |

Katalog obsahuje 20 tematických skupin, 9 explicitních externích podmínek a 636 konkrétních akceptačních kritérií pro 212 položek. Všechna ID mají počáteční stav `planned`. První připravený úkol je F01. Fáze nemají obrácené závislosti; Writer předchází MC. Slunce/měsíc a Mentalism jsou časné ukázky v P1.

## Ověřená rizika fronty

Testy dokládají exkluzivní zámek, odmítnutí druhého zapisujícího agenta, zachování fence při timeoutu/pádu integrace, odmítnutí poškozeného stavu, závislosti a externí podklady, checkpoint a navázání stejného worktree, omezené recovery a uchování staré práce. Dále skutečné kontroly, čerstvý fingerprint, odlišné identity review, úplnou mapu kritérií, chybějící screenshot/evidenci, povolené cesty a běžnou fast-forward integraci bez přepsání souběžné změny.

Opravené a regresně testované případy: relativní reporty vůči task worktree; zákaz uvolnit uncertain přes block; změna/smazání externí evidence po claim; traversal `..` v cestě evidence; změna zdrojů při stagingu. Úspěšný pokus archivuje evidenci a běžně odstraní čisté task worktree bez force.

## Co ověřené není

End-to-end běh na uživatelově instalaci Hermes/Codex/OpenCode, jeho autentizaci, modelech, nastavených oprávněních a browser nástrojích nelze z tohoto prostředí potvrdit. Dokumentované CLI příkazy byly ověřeny v aktuální primární dokumentaci; první lokální dávka má začít F01 a malým počtem probuzení.

Queue testy běžely na Linuxu s Python 3.12. Nativní Windows ani WSL konkrétního počítače zde nebyly testované. `.caisik` state a evidence jsou lokální a ignorované Gitem; Git push je nezálohuje.

Žádný nový screenshot webu se nevydává za ověření UI, protože web tato dodávka nemění. Vizuální testy jednotlivých budoucích vylepšení se pořídí při jejich skutečné implementaci. Kontrola existence PNG nebo JSON reportu sama nedokládá správnost obrazu, taneční techniky, licence ani faktů; tyto podklady kontroluje nezávislý reviewer a podle povahy odborník/člověk.

Nebyl spuštěn feature worker, žádná položka RPG se neoznačila done, nebyl změněn Sites deployment a nebyl zaveden automatický push/sync.

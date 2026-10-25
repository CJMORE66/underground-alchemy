# CAISIK RPG200 — lokální předání Hermes

**Hrdina jsi ty. Město je herní svět. Tvoje tvorba mění jeho podobu.**

Tento balíček mění předchozích 200 nápadů na proveditelnou frontu. Neimplementuje zde samotných 200 funkcí. Obsahuje jejich kritéria, závislosti, důkazy dokončení, pravidla práce a otestovatelný lokální queue helper. Aktuální web zůstává zdrojem, na který se navazuje.

## Obsah

| Soubor | Účel |
| --- | --- |
| `ROADMAP.md` | Všech 200 nápadů, fáze a pořadí práce |
| `backlog.json` | Strojový katalog: přesně 200 vylepšení + F01–F12 |
| `HERMES_LOOP.md` | Jedna úplná iterace a pravidla obnovení |
| `ARCHITECTURE.md` | Existující stack, datové a motion kontrakty |
| `ACCEPTANCE.md` | Co dokládá skutečné dokončení |
| `prompts/worker.md`, `prompts/reviewer.md` | Oddělená zadání implementátora a kontroly |
| `schemas/` | JSON reporty pro kontrolu výsledků |
| `../../tools/rpg200.py` | Trvalá fronta, worktrees, testy a lokální integrace |
| `SOURCES.md` | Ověřená CLI dokumentace a omezení |

## První spuštění

Potřebuješ Git, Python 3.10+, Node/npm a již nastavený Hermes. Codex/OpenCode používej pouze z vlastní existující instalace a přihlášení. Balíček neinstaluje nástroje, nezakládá účet a nevybírá model za tebe. Nativní Windows i WSL jsou možné; při WSL pracuj s repozitářem v Linux filesystemu a se stejnou instalací Git/Python/CLI uvnitř WSL.

V již naklonovaném repozitáři:

```bash
git switch main
git pull --ff-only origin main
git switch -c rpg200/local
python tools/rpg200.py validate
python tools/rpg200.py doctor
python tools/rpg200.py init
hermes chat --skills codex,opencode --max-turns 60
```

Pokud větev `rpg200/local` už existuje, použij `git switch rpg200/local`; nevytvářej ji znovu. Nejdřív vyřeš vlastní rozpracované změny — helper je nemaže. V některých prostředích se Python spouští jako `python3`; používej jeden funkční příkaz konzistentně.

**Do otevřeného interaktivního Hermes chatu vlož:**

```text
/loop 1m Proveď právě jednu bezpečnou iteraci podle docs/rpg200/HERMES_LOOP.md. Načti stav z tools/rpg200.py; vyber další připravený úkol, deleguj workerovi Codex/OpenCode, nezávisle ověř výsledek a ulož checkpoint. Zachovej AGENTS.md, schválenou grafiku a stávající funkce. Nic nepushuj ani nepublikuj. Při uncertain nebo vyčerpané připravené frontě skonči s LOOP_COMPLETE. --times 10
```

`--times 10` omezuje počet probuzení, nikoli počet hotových funkcí. Neznamená ani deset minut: jedna práce může trvat déle než interval. Stav fronty zůstává na disku, takže další dávka naváže. Po první úspěšné dávce můžeš obdobně použít `--times 30`; respektuj také vlastní `loops.max_ticks` a rozpočet modelů. Neukládej nekonečný běh jako výchozí nastavení.

Příkazy patří **dovnitř** interaktivního chatu. `hermes chat -q '/loop ...'` není správný způsob spuštění slash příkazu.

```text
/loop status
/loop pause
/loop resume
/loop stop
```

## Co se děje při práci

F01–F12 připraví audit, data, artefakty, questy, motion a ověření. Následuje skutečně použitelný Writer pilot, potom MC a další disciplíny. Číslo nápadu neudává pořadí implementace; rozhodují závislosti a fáze. Jeden dokončený úkol znamená funkční výsledek, uloženou evidenci, nezávislé review a lokální commit. Učení v aplikaci nikdy nepoužívá počet těchto vývojářských úkolů jako XP uživatele.

Přehled:

```bash
python tools/rpg200.py status
python tools/rpg200.py next
python tools/rpg200.py report
```

Pokud není nic připraveného, Hermes vypíše přesné blokace a ukončí loop. Média/licence/lektoři/backend se nepovažují za dodané jen proto, že vzniklo tlačítko. Externí gate otevírá člověk po kontrole skutečné evidence; agent ji sám neodsouhlasuje.

## Přerušení, záloha a návrat

`.caisik/rpg200/` obsahuje lokální stav, worktrees, logy a evidence. Je ignorovaná Gitem; sama se nepushuje. Zálohuj ji spolu s lokálními Git commity. Úplnou kopii rozpracovaných worktrees dělej po pozastavení workerů. `git bundle` neobsahuje necommitované změny ani ignorované evidence.

Zavření CLI nemusí zastavit přijatou práci v Hermes gateway. Při timeoutu nebo nejistém stavu použij pravidla v `HERMES_LOOP.md`; dalšího workera nespouštěj, dokud skutečně neskončil předchozí. Helper zámek automaticky neprolamuje.

Pro vrácení přijaté změny použij lokální `git revert <commit>` po kontrole závislostí, nikoli přepis historie. Pak slaď stav příslušného úkolu s reálným kódem; nikdy neoznač odstraněnou funkci za hotovou jen podle starého reportu.

Automatický push, nasazení do Sites a synchronizace GitHub ↔ Sites nejsou součástí tohoto lokálního loopu.

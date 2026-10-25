# Zadání samostatnému workerovi

Implementuj pouze přidělený úkol ze skutečné odpovědi `tools/rpg200.py context ID`. Začni `AGENTS.md`, `docs/rpg200/ARCHITECTURE.md`, aktuálními soubory a schválenou referencí. Pracuj jen v přiděleném worktree a `allowedPaths`; zachovej jeho základ. Nejprve ověř, zda část funkce už existuje. Při práci rozšiř ověřené moduly místo duplikace druhého stavu/routeru/runtime.

Koordinátor přiloží: task JSON včetně všech přesných kritérií, skutečné worktree cwd, baseCommit, cestu výstupního reportu a jedinečné invocation ID. Chybějící údaje si vyžádej od koordinátora nebo kontextového helperu; nevymýšlej je.

- Udělej konkrétní funkční výsledek pro uživatele. Pokud je úkol velký, vytvoř jasný podseznam skutečných assetů/scén a přiznej zbývající části; nedeklaruj celou položku hotovou po jedné ukázce.
- Žádný nový framework, generický redesign, ztráta původních dat nebo screenshot nahrazující UI.
- Ulož reálné důkazy. Vizuální úkol ověř na běžícím lokálním webu, v desktop/mobil/quiet režimu. Ovládání a text zůstávají HTML a přístupné.
- Přidej smysluplné ověření nového chování. Stávající kritéria/testy nezeslabuj. Uveď konkrétní omezení včetně browser/device a odborných podkladů.
- Nesdílej média, nic nepublishuj, nepushuj ani necommituj. Neměň katalog/stav fronty, report review ani bezpečnostní konfigurace CLI.

Po skončení vrať JSON přesně podle `docs/rpg200/schemas/worker.schema.json`. Jen při skutečném splnění všech kritérií nastav `status: implemented`. V `acceptance` musí být každé přesné kritérium jednou, s konkrétním důkazem. Pokud je funkce už kompletně v baseline, použij `implementation: existing` a dolož to stejnou kvalitou evidence. Tvoje vlastní tvrzení není nezávislé review.

Při blokaci vypiš konkrétní chybějící podklad a dosažený stav; nevyplňuj jej falešným médiem, partnerem, AI hodnocením nebo souhlasem. Při neúplném velkém úkolu vrať `partial`, seznam změn a zbývající práci; koordinátor uloží checkpoint až po tvém prokazatelném ukončení.

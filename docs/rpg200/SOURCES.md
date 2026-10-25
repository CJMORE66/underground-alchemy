# Zdroje a hranice ověření

CLI dokumentace ověřena 25. 10. 2026. Instalovaná verze uživatele má poslední slovo: nejdřív lokální `--help`, bez automatického upgradu nebo zásahu do autentizace.

- [Hermes Recurring Loops](https://hermes-agent.nousresearch.com/docs/user-guide/features/loops): interaktivní `/loop [interval] <prompt> --times N`; ovládání status/pause/resume/stop; ukončení pomocí `LOOP_COMPLETE`. Limit počítá probuzení. Session/backend musí běžet; automatické neomezené výdaje nenastavujeme.
- [Hermes CLI reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands): konečný CLI běh používá `--oneshot`; `-q` na skutečném TTY neznamená totéž. Projekt startuje interaktivně s `--skills codex,opencode`; slash loop se vkládá do chatu.
- [Hermes CLI lifecycle](https://hermes-agent.nousresearch.com/docs/user-guide/cli): přijatá práce běží v gateway a odpojení klienta není záruka zastavení. Proto je v protokolu globální fence pro nejistý výsledek.
- [Hermes context files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files): projektový AGENTS může být překryt silnějšími context soubory; preflight je musí zkontrolovat.
- [Hermes skills catalog](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog): existují bundled skills `codex` a `opencode`; nepředstíráme vlastní `hermes dispatch` API.
- [Hermes Codex skill](https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-codex) a [OpenCode skill](https://hermes-agent.nousresearch.com/docs/user-guide/skills/bundled/autonomous-ai-agents/autonomous-ai-agents-opencode): konkrétní delegaci spusť podle skutečné instalace skillu.
- [Codex non-interactive](https://developers.openai.com/codex/non-interactive-mode): `codex exec`, prompt ze stdin a strukturovaný výstup přes output schema / soubor jsou podklady pro delegované běhy. Použij běžný sandbox.
- [Codex sandbox](https://developers.openai.com/codex/sandboxing): workspace-write pro implementaci a read-only pro kontrolu mají rozdílné oprávnění. Projekt nevyžaduje bypass sandboxu.
- [OpenCode CLI](https://opencode.ai/docs/cli/): noninteraktivní `opencode run`, model/agent/file/dir podle lokální nápovědy.
- [OpenCode agents](https://opencode.ai/docs/agents/): Plan je určený pro analýzu, ale bash a globální permission config je nutné zkontrolovat; automaticky z něj neděláme bezpečnostní sandbox.
- [Hermes Windows/WSL](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/windows-wsl-quickstart.md): nativní Windows i WSL jsou podporované; nemícháme filesystemy a nástroje obou prostředí.

Stávající projekt, routy a grafické kontrakty jsou ověřené ze zdrojového repozitáře, zejména `START_HERE.md`, `package.json`, `docs/atlas/APPROVED-STYLE.md`, `docs/expeditions/README.md` a aktuálních testů. Roadmap je autorský implementační návrh, nikoli tvrzení, že 200 položek již funguje.

V tomto prostředí není nainstalovaný lokální uživatelův Hermes/Codex/OpenCode. Testy queue helperu proto nesmějí být vydávané za end-to-end ověření těchto tří konkrétních instalací. První dávku na počítači začni malým počtem probuzení a ověř skutečné reporty, session logy a výsledky.

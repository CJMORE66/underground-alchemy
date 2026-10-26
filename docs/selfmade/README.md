# CAISIK SELFMADE — správa a obnova

Tato vrstva přidává `/play/` do existujícího statického webu. Původní atlas a expedice zůstávají samostatně použitelné. Úplný požadavek je v [REQUEST.md](REQUEST.md); důkazní přehled všech 200 funkcí v [PLAN.md](PLAN.md) a [coverage.json](coverage.json).

## Kde se spravují data

- Původní lokality a jejich zdroje: `dist/locations-data.json`.
- Původní expedice, místa, lekce a zdroje: `docs/expeditions/source-content/`, `tools/import-expeditions.py`, `tools/build-expeditions.py`; výstup `dist/expeditions/data/expeditions.json`.
- Osobní RPG používá nový klíč `caisik-selfmade-v1`; původní `atlas-*` ani `caisik-expeditions-v1` se nepřepisují. Žádná automatická migrace přes různé domény nebo zařízení.
- Autorské interpretace a vlastní tvůrčí zadání zůstávají označené; skutečné provozní informace si zachovávají datum původního ověření. Úprava UI nepředstavuje nové faktické ověření.
- Schválená grafika: `docs/atlas/APPROVED-STYLE.md`. Originální malby se zachovávají. Nová geometrie je autorská konstrukční vrstva, ne dohledaný historický symbol ani rekonstruované malované vrstvy.

## Pracovní moduly

- `dist/play/app.js`: profil, HUD, questy, navazující skutečné routy a lazy import tvůrčích prostorů.
- `store.js` a `quests.js`: společný verzovaný soukromý stav a postup odvozený z vlastní práce. Nejde o transakční databázi: načítá se poslední stav, nezávislé změny se slučují; pro stejné pole platí poslední uložená změna.
- `workshops.js`: pět různých tvůrčích dílen; vlastní Writer tahy, MC A/B, DJ rozbor, bezpečný Breaking deník, Knowledge tvrzení a revize.
- `field.js`: skutečná zdrojová místa, vlastní pořadí trasy, soukromé postřehy, vlastní ruční časování a TXT roadbook. Čas není odhad přesunů ani důkaz znalostí.
- `journal.js`: vlastní materiál, seřazený stůl, propojení, slovník, revize, soukromá zeď a přenosné vydání.
- `practice.js`: sedm konkrétních vlastních cvičení, uložená sedmidílná kompozice/SVG a užitečné navazující šablony.
- `sound.js`: vlastní procedurální zóny, plynulé prolínání, tap-tempo, 4/8krokový motiv, zvukové gesto a analýza vlastního souboru včetně vlastního tahu ze skutečné křivky přednesu. Zvuk je při načtení vypnutý; globální STOP zůstává dostupný.
- `dist/selfmade-motion.js`: významové studijní vrstvy, vlastní svět, fiktivní průvodce, ovládaná brána, odkrývání geometrie a řízené kapky. Nenahrazuje dodávku všech oddělených malovaných vrstev.

## Soukromí a skutečné ukládání

Profil, texty, skici a metadata jsou soukromá data tohoto prohlížeče. Prohlížeč může blokovat zápis, vyčerpat kvótu nebo data odstranit; aplikace má chybu ukázat, zachovat neuložené změny v paměti a nabídnout export. Soukromé prohlížení není trvalá záloha. `file://` není podporované prostředí nasazeného webu; používej HTTP náhled nebo produkční HTTPS.

Vlastní zvukové a video soubory je nutné odlišit od textových dat. Pokud jsou v konkrétním nástroji označené **jen pro tuto session**, reload je nezachová a JSON je neobsahuje. Uživatel je musí samostatně stáhnout/uchovat. Bez samostatného opt-in mechanismu se soubory nikam neuploadují. Lokální mikrofon vyžaduje dostupné API, vhodný bezpečný origin a výslovný stisk uživatele; zamítnutí oprávnění nesmí zablokovat textovou práci.

Export není veřejné sdílení. Offline HTML sešit uživatel vlastní a může ho otevřít samostatně; nemá obsahovat spouštěný uživatelský HTML/skript. JSON záloha slouží k přenosu podporovaných textových dat a skic. Před importem se zobrazí souhrn; existující díla a jejich verze se mají zachovat.

## Ověřování změn

Spouštěj z kořene repozitáře:

```bash
npm test
node tests/expeditions.mjs
node tests/art-scenes.mjs
node tests/art-motion.mjs
node tests/logo-motion.mjs
node tests/hero-motion.mjs
node tests/play-store.mjs
node tests/play-workshops.mjs
node tests/play-journal.mjs
node tests/play-field.mjs
node tests/play-practice.mjs
node tests/play-sound.mjs
node tests/selfmade-motion.mjs
node tests/play-integration.mjs
git diff --check
```

Výpisy testů a skutečné browser screenshoty patří do QA_REPORT.md. Statický test nedokazuje vizuální kvalitu, mikrofonní oprávnění, reálné iOS Safari, odbornou správnost tance ani úplné WCAG posouzení.

## Publikace a rollback

1. Zachovej `.openai/hosting.json` a jeho přesné `project_id`; nikdy nevytvářej náhradní Site.
2. Použij Sites source workflow: otevření stejného zdroje, kontroly, přesný commit/push a archiv `dist/` z tohoto commitu, uložení verze a nasazení při zachování publika. Krátkodobé přístupové údaje nesmí být v souborech, shell argumentech ani logu.
3. Výchozí rollback této změny je **publikovaná verze 23**, zdroj `65b2f899af9326ec9f5f069288d34d04dac351f5`. Pro produkční návrat použij přesné uložené ID této verze z `list_site_versions`; neskládej ID z čísla verze.
4. Pro zdrojový rollback vytvoř nový revert commit změnového commitu. Nepoužívej force push ani reset sdílené historie. Před návratem vyexportuj soukromá uživatelská data; rollback HTML není obnova prohlížečového storage.
5. Zdroj Sites a GitHub `CJMORE66/underground-alchemy` se automaticky nesynchronizují. Požadavek na změnu webu není důkaz, že je stejný commit už na GitHubu.

## Technické zdroje

Otevřené primární zdroje při implementaci 26. 10. 2026:

- [MDN — localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage): lokální úložiště a jeho prostředí; nevydávat za účet nebo cloudovou zálohu.
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion): systémová preference omezeného pohybu.
- [MDN — Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API): procedurální vlastní nástroj a skutečná analýza audia, oddělená od nahrávání mikrofonu.
- [MDN — linearRampToValueAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime): plynulé změny parametrů při prolínání zón.
- [MDN — MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder): skutečné nahrávací API; dostupnost a oprávnění se řeší za běhu.

Faktické zdroje lokalit se spravují ve stávajících datech. Tento technický průzkum neznamená, že byly znovu ověřeny ceny, rozvrhy nebo přístup jednotlivých míst.

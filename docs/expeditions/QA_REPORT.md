# CAISIK expedice — kontrola 25. 10. 2026

## Rozsah

Navázáno na skutečně publikovanou verzi 22, commit `05f45362bc530ff8ff948c694fd285ac7c43962b`. Pět samostatných expedic, patnáct úplných lekcí, třicet jedna zastávek a dvacet tři míst již existovalo. Tato úprava opravuje spolehlivost zápisníku, exportu a aktualizace offline balíčku. Zachovává poslední schválenou grafiku, všechny původní sekce a 100 děl.

Původní report je uchován v [QA_REPORT_2026-10-21.md](QA_REPORT_2026-10-21.md). Obnovený dodaný ZIP byl znovu přečten v požadovaném pořadí: všech 15 autorských lekcí, archivované routes/lessons/scene-contracts a všech 5 SVG odpovídají zdrojům; kapitoly mají pouze již provedené změny cest obrázků a příznaku importu. Mastery skutečně existují jako 2752 × 1536 WebP, dodatečný archiv scén je zachovaný. Nová generace není potřebná.

## Opravené chyby

1. Dvě otevřené expedice dříve přepisovaly celý starší snapshot. Ukládají se pouze skutečně změněná pole sloučená s aktuálním stavem. Nedotčená pole se aktualizují také v jiných kartách; aktivně rozepsané pole se nepřepisuje. Pro stejné pole platí poslední uložená úprava. Nejde o synchronizaci mezi zařízeními.
2. Poškozený zápisník mohl být přepsán pouhou změnou režimu. Originál nyní zůstává beze změny. Čitelné části se zachrání do paměti; JSON export obsahuje i `recovery.rawNotebook`. Selhání zůstává viditelné. Čekající změny lze znovu uložit po obnově dostupnosti úložiště.
3. Testovací prohlížeč nedoručoval Markdown stažení. Úplný průvodce nyní používá přenosný UTF-8 TXT a byl skutečně stažen i s vlastními poznámkami. JSON zůstává samostatnou zálohou všech expedic. Připravený soubor má také přímý odkaz a srozumitelný stav; nehlásí se neověřené „staženo“.
4. Neúplný upgrade service workeru mohl smazat starší offline stránky. Instalace nyní vyžaduje všech šest stránek a povinný runtime se správnými verzemi. Při selhání nebo chybějícím souboru se předchozí balíček zachová; nesouvisející cache se nemažou. Volitelné ilustrace neblokují úplný text.

## Provedené testy

| Kontrola | Výsledek |
|---|---|
| `node tests/expeditions.mjs` | PASS: 5/15/31/23; 17 neplatných vstupů odmítnuto; 454 bezpečných odkazů a skutečné lokální cíle; úplnost všech lekcí a zastávek; hashe schválené grafiky a masterů. Zahrnuje runtime suite. |
| `node tests/expeditions-runtime.mjs` | PASS: různé expedice ve více kartách; různá pole stejné kapitoly; úmyslné vyprázdnění; zachování stop/režimu; poškození a obnova; quota retry; úplný průvodce; vratný scroll; scope workeru a chyby cache. |
| Skutečný kód workeru ve VM | PASS: neúplná Knowledge stránka, výpadek sítě, starý `?v=1` soubor místo v2, úplná instalace, ztráta souboru před aktivací, zachování původní i cizí cache. |
| `npm test` | PASS: původní atlas, 12 míst, 3 trasy, 7 principů, 8 témat a 100 děl. |
| `node tests/art-scenes.mjs`, `art-motion.mjs`, `logo-motion.mjs`, `hero-motion.mjs` | PASS: původní grafika, sémantické animace principů, logo a hero. Jejich zdroje se nemění. |
| Syntaxe JS a `git diff --check` | PASS. |

Nové závislosti se neinstalovaly. Validace externích URL je syntaktická; není to síťový test každého externího webu. Provozní obsah má nadále pravdivé datum kontroly 21. 10. 2026, nikoli neprovedené nové ověření k dnešku.

## Skutečný prohlížeč

V desktopovém Chrome byly znovu otevřeny všechny šestice stránek. Dedicated stránky obsahují po třech lekcích a 6/7/6/6/6 zastávkách, data jsou načtená, aktivní obrázky nechybí a dokument nepřetéká vodorovně. Writer scéna při přesunu do třetí lekce dosáhla postupu 0,6470 a návrat do první ji vrátil na 0; text je stále dostupný. Nativní přepínač a další zastávka jsou ovladatelné klávesnicí.

Dvě skutečně otevřené karty uložily MC text a různá Writer pole. Oba Writer záznamy i MC zůstaly po reloadu zachované. Skutečně stažený TXT o velikosti 14 235 bajtů obsahoval všechny tři lekce, adresy i obě vlastní poznámky. Skutečně stažený JSON obsahoval Writer i MC. Zkušební poznámky byly následně vráceny formuláři do původního stavu.

Responzivní kontrola používá skutečné iframe viewporty 390 × 844, 320 × 568 a 768 × 420. Dokumenty nepřetékají. Velký telefon má malou sticky stage; malý telefon a landscape lineární klidný režim. V malém viewportu byla přímo otevřena konkrétní adresa Rue Dénoyez. Nejde o skutečné iOS Safari ani fyzický telefon.

- [Desktop Writer](qa/2026-10-25/desktop-writer.jpg)
- [Mobil, terén a landscape](qa/2026-10-25/responsive.jpg)

Snímky zachycují skutečný render a byly uživateli ukázány před publikací. Dočasný QA HTML soubor se nepublikuje.

## Meze a nedodané materiály

HTTP náhled neumožňuje skutečnou instalaci service workeru; její chybová větev je viditelná a worker je testovaný ve VM. HTTPS instalace na fyzickém telefonu a terénní pilot zůstávají k provedení. OS reduced-motion nelze zde přepnout; jeho implementace i automatický klidný režim krátké obrazovky jsou zachované. Nej­de o úplný WCAG audit.

Licencované DJ/MC nahrávky a rozhovory, odborná taneční videa a skutečná reakce lektora nejsou dodané. Totéž platí pro redakční posouzení specialistou, reálný procesní pilot, filmový morph, partnerské smlouvy, komerční oprávnění, živé rezervace, účty a přílohy. Nejsou prezentované jako hotové. Hudební ani historické dokumentární materiály bez oprávnění se nepřidávaly.

Správa obsahu, změněné moduly a rollback na verzi 22: [README.md](README.md). Vstup do projektu: [START_HERE.md](../../START_HERE.md).

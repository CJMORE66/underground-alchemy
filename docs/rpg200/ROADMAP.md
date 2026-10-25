# CAISIK: 200 vylepšení pro osobní RPG

> Hrdinou jsi ty. Město je herní svět. Tvoje tvorba mění jeho podobu.

**Stav: implementační plán. Žádná z níže uvedených položek není tímto dokumentem prohlášena za dokončenou.**

Pracovní smyčka produktu: **OBJEV → POCHOP → VYTVOŘ → UPRAV → PROMĚŇ SVŮJ SVĚT.** Vývojová smyčka převezme jednu způsobilou položku, vytvoří konkrétní výsledek, ověří jej, nechá nezávisle posoudit a uloží checkpoint. Čtení stránky ani animace samo neprokazuje znalost.

Autoritativní strojový plán je `backlog.json`: přesně **200** stabilních položek `RPG-001` až `RPG-200`, **12** samostatných technických předpokladů `F01` až `F12` a explicitní externí podmínky. Závislosti jsou pořadí vývoje funkcí, nikoli povinnost návštěvníka projít všechny disciplíny.

## Zachovat existující projekt

- Stack z repozitáře: statické HTML/CSS/JavaScript ES modules. Python importuje zdrojový obsah a generuje šest HTML stránek expedic. Nevytvářet nový React/Next/Vite projekt ani druhý atlas.
- Existují Hidden City, Seven Principles, Frequency, Living Wall, /art/, /logo/ a všech pět expedic. Dále existuje 14 unikátních SVG scén pro 15 umístění principů/Living Wall, samostatné hero a logo a 100 archivních děl. Úkoly rozšiřují tento základ.
- Závazná grafika: `docs/atlas/APPROVED-STYLE.md` a `dist/assets/style-reference/approved-caisik-graphic-novel.png`. Sytá žlutá #FFD600/#FFCC00, #080808, ostré světlé hrany, střídmá karmínová #E71932, propracovaný wildstyle a dospělá graphic-novel kresba. Schválený dokument výslovně odmítá chrome/metallic look, acid green/purple, šum a vybledlost.
- Původní aktivní obrazy a jejich hash zůstanou dostupným fallbackem. Ploché výřezy nejsou plně rekonstruované 3D ani důkaz existence skrytých tahů. Každá aktivní autorská ilustrace má vlastní checkpoint pokrytí; u 100 archivních děl se velká položka rozpadá na interní checklist, nikoli na 100 falešně dokončených slibů.
- Dokumentární fotografie zůstávají věrné. Mohou mít popisky, symbol lens nebo nástroj pro pozorování; nevytvářet na nich falešné historické události.
- Zachovat skutečné routy `/#hidden-city`, `/#principles`, `/#frequency`, `/#living-wall`, `/art/`, `/logo/`, `/archive/`, `/expeditions/` a `/expeditions/{dj,mc,writer,breaking,knowledge}/`. `/q/transmute/` je původní vstup k principu Cause and Effect, nikoli obraz Living Wall TRANSMUTE.
- Generované expedice měnit přes jejich kanonické zdroje a generátory. Původní `atlas-*` ani `caisik-expeditions-v1` nepřepsat novým prázdným RPG stavem.

## Vývojové fáze

Pořadí ID zachovává tematický seznam nápadů. **Neprovádět slepě 001 → 200.** Scheduler rozhoduje podle skutečných závislostí, fáze, priority a uzavřených externích podmínek. Velké úkoly používají interní dílčí checkpoint; původní ID se nepřejmenovává.

| Fáze | Rozsah | Položek RPG | Výsledek |
| --- | --- | ---: | --- |
| P0 — Základy a smlouvy | 12 základů F01–F12; audit, datové smlouvy, motion lifecycle, obnova, média a protokol agenta. | 0 | Technické předpoklady, nikoli další nápady. |
| P1 — Úplný Writer pilot | Úplný Writer pilot od vstupu a úlohy přes skicu, paletu a právní plán po procesní Blackbook a export. Přístupnost, klidný režim a storage se ověřují už zde. | 55 | Doložený vlastní výstup a ověřená funkce. |
| P2 — MC a vlastní hlas | MC ověří vlastní text, hlas, dvě verze přednesu a vysvětlenou úpravu. Bez mikrofonu funguje textová cesta. | 11 | Doložený vlastní výstup a ověřená funkce. |
| P3 — DJ a vlastní mix | DJ ověří krátký vlastní mix, tracklist a tři rozhodnutí. Licencované stems jsou volitelná oddělená větev. | 11 | Doložený vlastní výstup a ověřená funkce. |
| P4 — Breaking s odbornými hranicemi | Breaking zachová bezpečnou přiměřenou vlastní frázi a další krok. Odborná videa a reakce skutečného lektora zůstávají explicitní podmínky. | 10 | Doložený vlastní výstup a ověřená funkce. |
| P5 — Knowledge a zdůvodněná myšlenka | Knowledge dokončí krátký text, vlastní znak a konkrétně zpřesněnou myšlenku s rozlišením faktu a výkladu. | 10 | Doložený vlastní výstup a ověřená funkce. |
| P6 — Živý osobní svět a propojování | Na fungující tvorbu navazuje celý osobní svět, hlubší pohyb grafiky, principy, reálná mapa, zvuk, přenosy a rozšířený Blackbook. | 92 | Doložený vlastní výstup a ověřená funkce. |
| P7 — Skutečná spolupráce a komunita | Skuteční lidé, sdílení a kolektivní práce. Nedodané osoby, souhlasy a backendy se neimprovizují. | 10 | Doložený vlastní výstup a ověřená funkce. |
| P8 — Vlastní expedice a uzavření systému | Uživatel z validovaných stavebních prvků vytvoří a exportuje vlastní expedici. | 1 | Doložený vlastní výstup a ověřená funkce. |

Kontrolní součet: **200 RPG položek + 12 technických předpokladů**. Writer `RPG-121`–`130` předchází MC `RPG-111`–`120`; následné DJ/Breaking/Knowledge stojí na ověřeném společném systému. Otevřená volitelná externí větev nesmí blokovat nesouvisející další práci. Slunce/měsíc RPG-034 a Mentalism RPG-051 se ověřují a rozvíjejí už v P1 jako časná vizuální ukázka; hromadné pokrytí veškeré grafiky RPG-031 zůstává samostatnou produkční prací v P6.

### Samostatné technické předpoklady

- **F01 — Ověřený výchozí stav a mapa projektu:** Inventarizovat skutečné routy, zdrojové generátory, storage, grafiku, scénické runtime a testy před změnami.
- **F02 — Verzovaný lokální stav hrdiny:** Přidat samostatný runtime-validovaný datový kontrakt lokální identity a preferencí.
- **F03 — Důkazy tvorby a verzování artefaktů:** Definovat vlastní výstup, jeho revize, rozhodnutí a vazby na lekci nebo quest.
- **F04 — Graf questů a pravidla postupu:** Zavést datový quest graph s ověřenými předpoklady a skutečnými výstupy.
- **F05 — Manifest veškeré grafiky a vrstev:** Zapsat aktuální obrazy, vrstvy, fallbacky, zdrojové hashe a omezení plochých předloh.
- **F06 — Společný životní cyklus pohybu:** Napojit nový RPG pohyb na existující preference a runtime bez druhé konkurenční animace.
- **F07 — Přenosná záloha a bezpečná obnova:** Zajistit export/import RPG dat s náhledem a slučováním podle stabilních ID.
- **F08 — Soukromá lokální média:** Navrhnout a implementovat opt-in lokální audio/foto přílohy s limity a mazáním.
- **F09 — Prameny, práva a fakta jako kontrakt:** Rozšířit obsahové smlouvy pro zdroje, interpretace, zákonný přístup a oprávnění médií.
- **F10 — Přístupnost a výkon jako průběžná brána:** Zapsat a automatizovat opakovatelné QA scénáře s dostupnými reálnými prostředky.
- **F11 — Opakovatelný agentní protokol:** Definovat malou iteraci implementace, kontroly, opravy a bezpečného lokálního commitu.
- **F12 — Matice 200 položek a grafického pokrytí:** Zajistit ověřitelnou frontu a checklisty velkých produkčních položek.

## Pravidla hotového výsledku

Všech 200 položek přebírá `policy.sharedAcceptance` z JSON. Vedle tří konkrétních kritérií dané položky platí:

- Myš, dotyk a klávesnice vedou ke stejnému cíli; adresa a vlastní práce nejsou za hoverem či animací.
- Nativní a vratný scroll, smysluplný statický konec, `prefers-reduced-motion`, Pause Motion, klidný/terénní režim. Bez blikání, autoplay zvuku a zbytečného offscreen pohybu.
- Žádné AI procentní hodnocení umělecké kvality. Uzel dovednosti odkazuje na vlastní pokus, revizi či skutečnou reakci; odškrtnutí návštěvy není důkaz učení.
- Soukromá práce zůstává výchozí. Žádné tajné uploady, nevyžádaná poloha ani marketingový tracking; média mají souhlas, limity, export a smazání.
- Rozlišit fakt, autorský výklad a zadání. U provozních podmínek zachovat datum ověření a nejistotu; null nikdy nepřevést na 0,0.
- Existující testy jsou regresní základ, nikoli samy důkaz hotové nové funkce. Nová funkce potřebuje konkrétní odpovídající scénář, nezávislé review a skutečný screenshot nebo jinou relevantní evidenci.
- Evidence v `.caisik/rpg200/evidence/<ID>/` používá syntetická nebo anonymizovaná testovací data. Osobní nahrávky, přesné soukromé polohy a skutečný deník se necommitují.
- Lokální smyčka může implementovat a vytvářet lokální commity. Publikace, placené služby, účty, partnerství a veřejné uploady mají samostatnou výslovnou hranici.

## Externí podmínky a poctivé blokace

Podmínka se uzavře skutečným souborem, souhlasem nebo fungující integrací. Samotný výrok agenta nestačí. Základní lokální formulář nepotřebuje účet jen proto, že později zachytí skutečnou lidskou reakci. Veřejné online sdílení jej naopak potřebuje.

- **E01_LAYER_EXPORTS — Schválené oddělené vrstvy a clean plates:** Úplné vrstvy a skryté plochy musí skutečně existovat pro konkrétní artwork. Ploché mastery ani malé výřezy je nedokazují. Dotčené položky: RPG-042, RPG-045.
- **E02_MUSIC_RIGHTS — Oprávnění pro cizí hudbu a stems:** Dodat skutečné použitelné soubory a oprávnění pro konkrétní způsob užití. Odkaz na poslech ani název skladby není licence. Dotčené položky: RPG-106, RPG-177.
- **E03_BREAKING_DEMOS — Odborné taneční demonstrace:** Dodat skutečná demonstrační média od kvalifikovaného spoluautora včetně popisu a práv. SVG a generovaný tanečník nejsou odborná ukázka. Dotčené položky: RPG-133.
- **E04_REAL_MENTOR — Skutečný lektor a jeho souhlas:** Zpětná vazba a dostupnost mentora musí být skutečné, se souhlasem pro dané zveřejnění a komunikaci. Dotčené položky: RPG-096, RPG-137, RPG-181.
- **E05_REAL_INTERVIEWS — Skutečné rozhovory a práva:** Dodat autentický záznam, souhlas účastníků, přepis a oprávnění. Nevytvářet falešné svědectví nebo klon hlasu. Dotčené položky: RPG-189.
- **E06_AUTH_BACKEND — Identita, oprávnění a úložiště pro sdílení:** Před cloudovým sdílením dodat skutečný backend, autentizaci, autorizaci, export a mazání. Nevytvářet účet ani placenou službu bez zadání. Dotčené položky: RPG-184, RPG-188, RPG-190.
- **E07_COMMUNITY_CONSENT — Souhlas, pravidla a moderace komunity:** Před veřejným sdílením stanovit souhlas, pseudonymitu, odvolání zveřejnění, práva a reálnou moderaci. Dotčené položky: RPG-184, RPG-188, RPG-190.
- **E08_COLLAB_BACKEND — Víceuživatelská spolupráce:** Dodat fungující návrh konfliktů verzí, oprávnění, synchronizace a obnovy. Lokální sdílený formulář není online spolupráce. Dotčené položky: RPG-190.
- **E09_REMIX_PERMISSION — Skutečný zdroj pro remix se souhlasem:** Dodat nejméně jeden skutečný příspěvek s doloženým autorem a oprávněním pro danou úpravu a další použití. Soukromý lokální import nemusí vyžadovat backend; veřejné sdílení nadále podléhá E06/E07. Dotčené položky: RPG-185.

## Všech 200 vylepšení

Každý řádek níže má úplný strojový záznam v `backlog.json`: tři konkrétní akceptace, závislosti, povolené cesty, očekávanou evidenci a ověřovací příkazy. **Všechny položky mají stav `planned`.**

### 1–10: Hrdina a vlastní směr

1. **RPG-001 — Ty jsi hlavní postava.** Úvod nastaví uživatele jako tvůrce, který buduje vlastní cestu a artefakty. (P1)
2. **RPG-002 — Vlastní alias.** Uživatel si zvolí jméno pro soukromý svět a podpis práce. (P1)
3. **RPG-003 — Osobní tvůrčí záměr.** Hrdina popíše, co chce vlastní tvorbou zkusit nebo změnit. (P1)
4. **RPG-004 — Volba první disciplíny.** Zvolit DJ, MC, Writer, Breaking nebo Knowledge bez uzamčení dalších cest. (P1)
5. **RPG-005 — Vlastní cíle místo levelu.** Zapsat konkrétní výsledek a čas, který chce uživatel praxi dát. (P1)
6. **RPG-006 — Avatar z vlastní tvorby.** Osobní znak nebo kresba tvoří podobu hrdiny. (P6)
7. **RPG-007 — Osobní tvůrčí kodex.** Krátká pravidla vlastní práce doprovázejí zásadní rozhodnutí. (P1)
8. **RPG-008 — Dopis budoucímu sobě.** Zachytit výchozí otázku a později na ni odpovědět vlastní zkušeností. (P6)
9. **RPG-009 — Vlastní osobní quest.** Uživatel vloží vlastní otázku, postup a očekávaný výstup. (P6)
10. **RPG-010 — Původní verze sebe v tvorbě.** Zachovat první malý výstup jako srovnávací bod celé cesty. (P1)

### 11–20: Osobní herní svět

11. **RPG-011 — Město jako souvislý osobní svět.** Sekce působí jako navazující čtvrti jednoho města. (P6)
12. **RPG-012 — Svět se mění tvojí prací.** Skutečně vytvořený a revidovaný artefakt promění osobní scénu. (P6)
13. **RPG-013 — Den a noc na přání.** Uživatel zvolí světelnou náladu pro prohlížení světa. (P6)
14. **RPG-014 — Čtvrti jednotlivých disciplín.** DJ, MC, Writer, Breaking a Knowledge mají vlastní vizuální prostředí. (P6)
15. **RPG-015 — Vlastní díla ve městě.** Soukromý svět vystaví uživatelem zvolené práce. (P6)
16. **RPG-016 — Vrstvy města od fyzické po osobní.** Přepínání vrstev ukazuje různé způsoby čtení stejného místa. (P6)
17. **RPG-017 — Tempo osobního světa.** Tempo prostředí vychází z uživatelovy volby klidu a energie. (P6)
18. **RPG-018 — Paměť proměn světa.** Časová osa propojí změny scény s vlastní tvorbou. (P6)
19. **RPG-019 — Návrat do rozehrané scény.** Pokračovat v místě a úkolu, kde uživatel skutečně skončil. (P6)
20. **RPG-020 — Osobní přehled města.** Jedno místo propojí rozpracovanou tvorbu, trasu a další otázku. (P6)

### 21–30: RPG rozhraní a pracoviště

21. **RPG-021 — RPG HUD s jasnou funkcí.** Omezené herní rozhraní ukáže právě důležitou práci a cestu. (P1)
22. **RPG-022 — Quest log.** Zápisník rozpracovaných a dokončených tvůrčích úloh. (P1)
23. **RPG-023 — Minimapa souvislostí.** Malý orientační pohled ukáže sousední sekce a aktuální kontext. (P6)
24. **RPG-024 — Inventář vlastních podnětů.** Uložit použitelné zvuky, slova, skici a symboly s původem. (P1)
25. **RPG-025 — Tvůrčí workbench.** Pracovní plocha spojí zadání, vlastní pokus, revizi a kontrolu. (P1)
26. **RPG-026 — Osobní základna.** Klidné místo pro přípravu a návrat k vlastní práci. (P6)
27. **RPG-027 — Funkční předměty scény.** Ilustrované objekty otevírají konkrétní nástroj nebo obsah. (P1)
28. **RPG-028 — Průvodce pokračováním.** Po návratu stručně popsat, co už vzniklo a co lze dělat dál. (P1)
29. **RPG-029 — Přiznaně fiktivní průvodce.** Autorská postava klade otázky a vysvětluje ovládání. (P6)
30. **RPG-030 — Rychlé přesuny a přímé vstupy.** Každá významná funkce má použitelný přímý odkaz. (P1)

### 31–40: Každá ilustrace žije

31. **RPG-031 — Vrstvy pro každou autorskou ilustraci.** Rozšířit inventuru na skutečně animované části veškeré aktivní grafiky. (P6)
32. **RPG-032 — Vlastní idle každého obrazu.** Každý motiv má klidný pohyb vycházející z jeho obsahu. (P6)
33. **RPG-033 — Oči reagují s významem.** Samostatné víčko, iris a pohled reagují na prozkoumání. (P6)
34. **RPG-034 — Skutečná dráha slunce a měsíce.** Oddělené nebeské prvky obíhají se správným překrytím scény. (P1 — časný showcase existující scény)
35. **RPG-035 — Písmena se skládají do wildstyle.** Viditelně ukázat konstrukci originálního letteringového motivu. (P6)
36. **RPG-036 — Předměty se hýbou z příčiny.** Vinyl, páka, kyvadlo a další objekty reagují na odpovídající zásah. (P6)
37. **RPG-037 — Řízené kapky a tah barvy.** Barva teče po navržených cestách bez rozbití písmen. (P6)
38. **RPG-038 — Geometrie se opravdu konstruuje.** Kružnice, osy a spojnice se kreslí v návazném pořadí. (P6)
39. **RPG-039 — Odhalení smysluplného detailu.** Prozkoumání zvýrazní konkrétní skrytý detail s vysvětlením. (P6)
40. **RPG-040 — Přístupné anotace všech živých obrazů.** Obraz lze číst pomocí popisků i bez pohybu a zraku. (P6)

### 41–50: Filmové návaznosti scén

41. **RPG-041 — Filmový nástup každé disciplíny.** Každá expedice dostane krátký obsahový příchod do vlastní scény. (P6)
42. **RPG-042 — Kabel se mění v obrys.** Skutečně připravit návazný kabelový tvar pro přechod mezi scénami. (P6) Externí podmínka: E01_LAYER_EXPORTS.
43. **RPG-043 — Písmena přecházejí v architekturu.** Propojit strukturu letteringových tahů s městskou scénou. (P6)
44. **RPG-044 — Match cut stejného symbolu.** Přechod zachová oko, kruh nebo jiný společný motiv. (P6)
45. **RPG-045 — Hloubka z oddělených vrstev.** Použít skutečné přední, střední a zadní plány pro omezený parallax. (P6) Externí podmínka: E01_LAYER_EXPORTS.
46. **RPG-046 — Rozhodnutí promění scénu.** Uživatelská tvůrčí volba ovlivní relevantní část prostředí. (P6)
47. **RPG-047 — Vlastní výstup jako konec kapitoly.** Závěrečná scéna použije skutečně vytvořený artefakt. (P6)
48. **RPG-048 — Reakce na hover a focus.** Krátká odezva ukáže aktivní významové části bez přetížení. (P6)
49. **RPG-049 — Scéna reagující na vlastní zvuk.** Vybrané prvky reagují na výslovně spuštěný lokální zvuk. (P6)
50. **RPG-050 — Reverzibilní pohyb při scrollu.** Každý příběhový přechod dává smysl i při návratu. (P6)

### 51–60: Sedm principů jako zkušenost

51. **RPG-051 — Mentalism: svět vyrůstá z prázdna.** Od prázdného černého pole přes myšlenku vznikne propracovaný svět. (P1 — časný showcase existující scény)
52. **RPG-052 — Correspondence: vztah dvou měřítek.** Mikro a makro obraz ukážou odůvodněnou autorskou analogii. (P6)
53. **RPG-053 — Vibration: viditelný rytmus změny.** Nastavitelné tempo a fáze ukážou vlnění bez povinného zvuku. (P6)
54. **RPG-054 — Polarity: práce s protiklady.** Přechod mezi dvěma výtvarnými póly ukáže konkrétní volbu. (P6)
55. **RPG-055 — Rhythm: celé kyvadlo.** Tyč, závaží a ozdoba se pohybují jako jeden zavěšený celek. (P6)
56. **RPG-056 — Cause and Effect: řetěz příčin.** Konkrétní zásah spustí čitelný sled reakcí. (P6)
57. **RPG-057 — Gender: doplňující se tvůrčí funkce.** Příjem a formování podnětu vysvětlit v historickém kontextu moderního textu. (P6)
58. **RPG-058 — Vlastní pokus ke každému principu.** Ke každému výkladu připojit malé konkrétní tvůrčí zadání. (P6)
59. **RPG-059 — Studijní ovládání principů.** Zpřístupnit fáze, pauzu a porovnání vysvětlení s obrazem. (P6)
60. **RPG-060 — Sedmidílná vlastní kompozice.** Spojit sedm vlastních zkušeností do volitelného díla. (P6)

### 61–70: Skutečná herní mapa

61. **RPG-061 — Skutečná RPG mapa města.** Questy propojit s existující geografickou mapou a ověřenými místy. (P6)
62. **RPG-062 — Filtry podle tvůrčího cíle.** Najít místo pro konkrétní vlastní pokus místo turistické kategorie. (P6)
63. **RPG-063 — Mapa faktů a interpretací.** Zobrazit zdrojovou a autorskou vrstvu odlišně. (P6)
64. **RPG-064 — Vlastní pořadí trasy.** Sestavit trasu ze skutečných míst a odpovídajících úloh. (P6)
65. **RPG-065 — Viditelné datum ověření.** Provozní údaje nezobrazovat automaticky jako aktuální. (P6)
66. **RPG-066 — Quest přímo z místa.** Na profilu zvolit vlastní výstup inspirovaný daným místem. (P6)
67. **RPG-067 — Historie vlastní průzkumné trasy.** Uchovat vlastní pozorování a jejich kontext. (P6)
68. **RPG-068 — Praktické podmínky na mapě.** Před cestou ukázat podmínky vstupu a právní omezení. (P6)
69. **RPG-069 — Soukromé body a pět tvůrčích pohledů.** Vlastní místo může mít úkol pro každou z pěti disciplín. (P6)
70. **RPG-070 — Osobní roadbook.** Exportovat trasu, úlohy a vlastní poznámky pro cestu. (P6)

### 71–80: Terénní výprava

71. **RPG-071 — Terénní obrazovka na jeden úkol.** Mobil ukáže další místo, adresu, podmínky a vlastní práci. (P1)
72. **RPG-072 — Quest podle dostupného času.** Krátká, střední a delší varianta mají reálný rozsah práce. (P1)
73. **RPG-073 — Úkol cestou mezi místy.** Přenos nebo čekání využít pro bezpečné všímání a zápis. (P6)
74. **RPG-074 — Volitelný hlasový průvodce.** Přehrát přiznaně dostupné vedení na přímý pokyn. (P6)
75. **RPG-075 — Náhradní úkol při uzavřeném místě.** Uzavření neukončí možnost smysluplné práce. (P1)
76. **RPG-076 — Tři konkrétní pozorování.** Na místě sbírat detail, vztah a vlastní otázku. (P1)
77. **RPG-077 — Vlastní tempo a odpočinek.** Uživatel upraví rozsah výpravy podle vlastní situace. (P1)
78. **RPG-078 — Přístupnost trasy v terénu.** Oddělit doložené podmínky místa od osobních preferencí. (P1)
79. **RPG-079 — Soukromá stopa výpravy.** Průzkum nevyžaduje automatické zaznamenávání pohybu. (P1)
80. **RPG-080 — Závěrečná reflexe po cestě.** Spojit pozorování s tím, co uživatel skutečně vytvořil. (P1)

### 81–90: Questy s vlastním výsledkem

81. **RPG-081 — Quest se sedmi kroky učení.** Každá hlavní výzva vede od otázky po přenos do nové situace. (P1)
82. **RPG-082 — Hlavní quest končí artefaktem.** Jasně pojmenovat konkrétní výstup každé hlavní výzvy. (P1)
83. **RPG-083 — Vedlejší quest rozvíjí detail.** Volitelná odbočka má vlastní malý cíl a návaznost. (P6)
84. **RPG-084 — Větvení podle rozhodnutí.** Cesta se větví podle skutečného tvůrčího zájmu a práce. (P6)
85. **RPG-085 — Boss: tvoje první verze.** Velkou výzvou je promyšleně překonat vlastní původní pokus. (P1)
86. **RPG-086 — Omezení jako tvůrčí výzva.** Malý počet barev, slov nebo zvuků vede k soustředěné práci. (P1)
87. **RPG-087 — Zpětná vazba jako další krok.** Zachytit skutečnou reakci a rozhodnutí, jak s ní naložit. (P1)
88. **RPG-088 — Nápověda po částech.** Podpora od otázky k vysvětlenému příkladu bez vyplnění vlastní práce. (P1)
89. **RPG-089 — Návrat k rozhodnutí.** Vrátit předchozí volbu a vytvořit alternativní verzi. (P1)
90. **RPG-090 — Quest podle dostupného vybavení.** Telefon, papír a plné studio nabídnou odpovídající variantu. (P1)

### 91–100: Dovednosti doložené prací

91. **RPG-091 — Strom dovedností z důkazů.** Vazby dovedností odkazují na vytvořené a revidované práce. (P6)
92. **RPG-092 — Průniky disciplín.** Ukázat přenos jedné konkrétní dovednosti do druhé tvorby. (P6)
93. **RPG-093 — Vizuální proměny z vlastní práce.** Odměnou je použitelná podoba vlastního světa nebo nástroje. (P6)
94. **RPG-094 — Historie osvojování.** Vidět posloupnost pokusů a rozhodnutí u jedné dovednosti. (P6)
95. **RPG-095 — Vlastní měřítka práce.** Uživatel zvolí konkrétní podmínky, které chce na vlastní tvorbě sledovat. (P6)
96. **RPG-096 — Skutečné odborné review.** Připojit autentickou reakci dohodnutého odborníka. (P6) Externí podmínka: E04_REAL_MENTOR.
97. **RPG-097 — Návrat k dřívější dovednosti.** Znovu projít krátkou úlohu a porovnat vlastní postup. (P6)
98. **RPG-098 — Nový nástroj jako přirozený další krok.** Zpřístupnit složitější ovládání až s vysvětlenou potřebou. (P6)
99. **RPG-099 — Vlastní otázky ve stromu.** Osobní nejasnost se může stát dalším uzlem praxe. (P6)
100. **RPG-100 — Reflexe celé kapitoly.** Uzavřít zkušenost vlastními výstupy, rozhodnutími a dalším krokem. (P1)

### 101–110: DJ

101. **RPG-101 — Digging s konkrétním záměrem.** Vybrat zvuky a skladby podle vlastního zadaného cíle. (P3)
102. **RPG-102 — Energetická mapa setu.** Zobrazit uživatelův záměr vývoje krátkého mixu. (P3)
103. **RPG-103 — Stejné skladby, dva odlišné sety.** Prozkoumat dopad pořadí a návazností na vyznění. (P3)
104. **RPG-104 — Vlastní cue body.** Zapsat konkrétní vstupní a výstupní rozhodnutí. (P3)
105. **RPG-105 — A/B přechodu.** Porovnat dvě vlastní řešení stejného přechodu. (P3)
106. **RPG-106 — Laboratoř oprávněných stems.** Skládat přechod z dodaných stop s jasným oprávněním. (P3) Externí podmínka: E02_MUSIC_RIGHTS.
107. **RPG-107 — Tři skladby, jeden důvod.** Malý set se soustředí na konkrétní rozhodnutí místo množství. (P3)
108. **RPG-108 — Karty vlastního výběru.** Inventář tracků propojí původ, poznámku a použití v setu. (P3)
109. **RPG-109 — Komentovaný poslech.** Zachytit rozhodnutí při vlastním opakovaném poslechu. (P3)
110. **RPG-110 — Vlastní mini mixtape.** Uzavřít DJ expedici krátkým mixem, tracklistem a třemi rozhodnutími. (P3)

### 111–120: MC

111. **RPG-111 — Sloka z konkrétního obrazu.** Začít vlastním pozorováním namísto obecného sloganu. (P2)
112. **RPG-112 — Přesný řádek.** Přepracovat jednu vágní větu do vlastní konkrétní výpovědi. (P2)
113. **RPG-113 — Řetěz asociací.** Převést vlastní podnět do několika odlišných souvislostí. (P2)
114. **RPG-114 — Dech a záměrná pauza.** Označit místa nadechnutí a promyšleného přerušení v přednesu. (P2)
115. **RPG-115 — Důraz mění význam.** Porovnat stejnou větu s odlišným zdůrazněním. (P2)
116. **RPG-116 — Dvě skutečné verze přednesu A/B.** Nahrát a porovnat dvě vlastní interpretace stejné sloky. (P2)
117. **RPG-117 — Inventář slov pro freestyle.** Vlastní slova, obrazy a témata tvoří materiál improvizace. (P2)
118. **RPG-118 — Metafora s vysvětleným vztahem.** Budovat přirovnání z konkrétního pozorování a zamýšleného významu. (P2)
119. **RPG-119 — Revize jednoho baru.** Změnit konkrétní řádek podle zamýšleného účinku. (P2)
120. **RPG-120 — Scéna z vlastních lyrics.** Uzavřít MC kapitolu vlastní slokou a její interpretací. (P2)

### 121–130: Writer

121. **RPG-121 — Vlastní abeceda Writeru.** Začít čitelnou konstrukcí vlastních písmen. (P1)
122. **RPG-122 — Stavba konkrétního písmene.** Rozdělit vlastní písmeno na základ, propojení a rozšíření. (P1)
123. **RPG-123 — Negativní prostor.** Zkoumat mezery a vztahy mezi vlastními tahy. (P1)
124. **RPG-124 — Vlastní paleta.** Omezená paleta má rozlišené role ploch, obrysů a světel. (P1)
125. **RPG-125 — Mockup zvoleného formátu.** Přenést vlastní skicu na konkrétní přiznaný návrhový formát. (P1)
126. **RPG-126 — Čitelnost ve třech měřítkách.** Porovnat vlastní lettering z blízka, středně a v malém náhledu. (P1)
127. **RPG-127 — Replay vlastních tahů.** Přehrát skutečně zaznamenaný proces kresby. (P1)
128. **RPG-128 — Plán legální realizace.** Připravit skutečné místo, souhlas a čas vlastní práce. (P1)
129. **RPG-129 — Malý test nástroje a materiálu.** Před velkou realizací zaznamenat vlastní bezpečnou zkoušku. (P1)
130. **RPG-130 — Procesní replay Writer díla.** Ukázat cestu od první skici přes paletu k legálnímu plánu a vlastní realizaci. (P1)

### 131–140: B-boy / B-girl

131. **RPG-131 — Vlastní přiměřená vstupní úroveň.** Zvolit rozsah práce podle vlastní zkušenosti a dostupné podpory. (P4)
132. **RPG-132 — Hudební signály pro pohyb.** Vnímat změny a akcenty ve vlastním nebo oprávněném hudebním podkladu. (P4)
133. **RPG-133 — Fráze z odborně vysvětlené ukázky.** Pracovat se skutečným materiálem kvalifikovaného spoluautora. (P4) Externí podmínka: E03_BREAKING_DEMOS.
134. **RPG-134 — Dvě vlastní pohybové verze.** Porovnat dvě dobrovolné nahrávky vlastní bezpečně zvolené fráze. (P4)
135. **RPG-135 — Záměr vlastní fráze.** Pojmenovat rytmickou nebo výrazovou volbu před praxí. (P4)
136. **RPG-136 — Pozorování skutečného cypheru.** Učit se z doloženého nebo osobně zaznamenaného kulturního kontextu. (P4)
137. **RPG-137 — Skutečná reakce lektora.** Připojit skutečnou odbornou reakci k vlastní frázi. (P4) Externí podmínka: E04_REAL_MENTOR.
138. **RPG-138 — Příprava skutečného tréninku.** Sestavit vlastní seznam prostoru, času, hudby a podpory. (P4)
139. **RPG-139 — Stejná fráze ve dvou hudebních kontextech.** Popsat změnu vlastní interpretace při odlišném podkladu. (P4)
140. **RPG-140 — Další vlastní tréninkový krok.** Uzavřít kapitolu přiměřenou frází a poctivým plánem pokračování. (P4)

### 141–150: Knowledge of Self

141. **RPG-141 — Tři přihrádky poznání.** Odlišit doložený fakt, autorský výklad a vlastní otázku. (P5)
142. **RPG-142 — Osobní archiv důkazů.** Uchovat konkrétní pramen a poznámku, co podporuje. (P5)
143. **RPG-143 — Dvě interpretace téhož motivu.** Porovnat dvě smysluplná autorská čtení stejného detailu. (P5)
144. **RPG-144 — Vlastní znak s vysvětlením.** Vytvořit osobní symbol z konkrétního záměru. (P5)
145. **RPG-145 — Protiotázka k vlastnímu závěru.** Zkusit zpochybnit konkrétní vlastní tvrzení. (P5)
146. **RPG-146 — Manifest z deseti vět na tři.** Zpřesnit vlastní postoj redukcí a vysvětlením volby. (P5)
147. **RPG-147 — Záznam změněného názoru.** Zachytit důvod revize konkrétní vlastní myšlenky. (P5)
148. **RPG-148 — Vlastní hranice sdílení.** Uživatel rozhodne, které reflexe zůstanou jen pro něj. (P5)
149. **RPG-149 — Zapsaný skutečný dialog.** Zachytit vlastní otázku a skutečnou cizí odpověď s patřičným souhlasem. (P5)
150. **RPG-150 — Zpřesněná myšlenka jako výstup.** Uzavřít Knowledge krátkým textem, vlastním znakem a změněným tvrzením. (P5)

### 151–160: Propojování disciplín

151. **RPG-151 — Vlastní městský zvuk jako rytmus.** Vlastní lokální field recording může inspirovat novou rytmickou práci. (P6)
152. **RPG-152 — Skica se mění v bary.** Vlastní obraz použít jako konkrétní zadání pro text. (P6)
153. **RPG-153 — Hlas jako návrh tvaru písmene.** Vlastní přednes inspiruje autorskou konstrukci letteringového prvku. (P6)
154. **RPG-154 — Mix jako zadání pohybu.** Vlastní hudební struktura vede k bezpečně zvolené výrazové reakci. (P6)
155. **RPG-155 — Handstyle jako zvukový motiv.** Rytmus vlastních tahů inspiruje krátkou zvukovou volbu. (P6)
156. **RPG-156 — Architektura jako tvůrčí omezení.** Konkrétní pozorovaný tvar stanoví pravidlo vlastní práce. (P6)
157. **RPG-157 — Jeden princip ve třech médiích.** Zkoumat stejnou autorskou otázku v různých formách tvorby. (P6)
158. **RPG-158 — Jedno pozorování, pět forem.** Nabídnout pět přenosů stejného podnětu bez povinného dokončení všech. (P6)
159. **RPG-159 — Znovupoužití inventáře.** Vlastní podnět lze přenést do dalšího projektu bez ztráty původu. (P6)
160. **RPG-160 — Dobrovolný osobní release.** Uživatel sestaví vlastní soukromou sadu výstupů a jejich kontext. (P6)

### 161–170: Procesní Blackbook

161. **RPG-161 — Časová osa Blackbooku.** Zobrazit skutečný proces napříč disciplínami. (P1)
162. **RPG-162 — Volná pracovní plocha.** Skládat vlastní poznámky a náhledy na přehlednou plochu. (P6)
163. **RPG-163 — Graf vazeb Blackbooku.** Ukázat vztahy mezi místem, otázkou, podnětem a výstupem. (P6)
164. **RPG-164 — Moodboard se zdroji.** Uspořádat inspiraci se skutečným původem a oprávněním. (P6)
165. **RPG-165 — Zvýraznění vlastních revizí.** Přehledně ukázat, co se změnilo a proč. (P1)
166. **RPG-166 — Přenosná osobní kniha.** Vlastní práce má export i bezpečný návrat do aplikace. (P1)
167. **RPG-167 — Vlastní slovník pojmů.** Zapsat osobní významy, zdroje a příklady použití. (P6)
168. **RPG-168 — Uložený stav scény u práce.** Vrátit se ke konkrétnímu studijnímu pohledu a kontextu. (P6)
169. **RPG-169 — Kurátorované vlastní portfolio.** Vybrat několik prací a vysvětlit jejich pořadí. (P6)
170. **RPG-170 — Další vlastní otázka.** Každý uzavřený projekt může otevřít další konkrétní zkoumání. (P1)

### 171–180: Zvukový svět

171. **RPG-171 — Volitelná zvuková atmosféra.** Zvuková vrstva vstoupí jen na přímý pokyn uživatele. (P6)
172. **RPG-172 — Zvukové zóny disciplín.** Každá tvůrčí oblast má přiznaný vlastní zvukový kontext. (P6)
173. **RPG-173 — Zvukové přechody na přání.** Přechody doprovodí jen uživatelem spuštěný hudební kontext. (P6)
174. **RPG-174 — Soukromý audio deník.** Krátká vlastní hlasová reflexe patří k práci a zůstává lokální. (P2)
175. **RPG-175 — Vlastní zvuk konkrétního místa.** Field recording propojit s místem a vlastním pozorováním. (P6)
176. **RPG-176 — Tap tempo.** Ruční odklepání rytmu vede k přiznanému odhadu tempa. (P3)
177. **RPG-177 — Licencované stems pro tvůrčí pokus.** Prakticky použít skutečně dodané stopy s vyjasněnými právy. (P6) Externí podmínka: E02_MUSIC_RIGHTS.
178. **RPG-178 — Quest ticha.** Pozorování a vlastní tvorba mohou vědomě vznikat bez zvuku. (P6)
179. **RPG-179 — Vlastní zvukový motiv hrdiny.** Malý vlastní motiv může označovat osobní práci nebo scénu. (P6)
180. **RPG-180 — Vlastní soundtrack výpravy.** Sestavit soukromý zvukový průvod vlastní cestou. (P6)

### 181–190: Skuteční lidé a spolupráce

181. **RPG-181 — Skutečný volitelný mentor.** Připojit reálně dohodnutého člověka s konkrétní rolí a dostupností. (P7) Externí podmínka: E04_REAL_MENTOR.
182. **RPG-182 — Duo quest.** Dva lidé mohou na místě nebo přes přenosný soubor vytvořit navazující práci. (P7)
183. **RPG-183 — Tři užitečné otázky pro feedback.** Strukturovat lidskou reakci kolem konkrétní práce. (P7)
184. **RPG-184 — Sdílení vlastního procesu.** Zveřejnit zvolenou část procesu pouze po vědomé volbě autora. (P7) Externí podmínka: E06_AUTH_BACKEND, E07_COMMUNITY_CONSENT.
185. **RPG-185 — Remix se souhlasem.** Použít cizí příspěvek až po doloženém oprávnění pro danou úpravu. (P7) Externí podmínka: E09_REMIX_PERMISSION.
186. **RPG-186 — Vlastní sada nástrojů a zadání.** Uživatel sestaví přenosný toolkit svých postupů. (P7)
187. **RPG-187 — Ověřená komunitní mapa.** Ukázat skutečné veřejně doložené prostory a možnosti kultury. (P7)
188. **RPG-188 — Dobrovolná pseudonymní výstava.** Zobrazit vlastní díla veřejně až po výslovné volbě autora. (P7) Externí podmínka: E06_AUTH_BACKEND, E07_COMMUNITY_CONSENT.
189. **RPG-189 — Skutečné rozhovory s tvůrci.** Kulturní kontext doplní autentické výpovědi skutečných lidí. (P7) Externí podmínka: E05_REAL_INTERVIEWS.
190. **RPG-190 — Společné kolektivní dílo.** Více autorů vytvoří skutečně sdílený výsledek s dohledatelnými verzemi. (P7) Externí podmínka: E06_AUTH_BACKEND, E07_COMMUNITY_CONSENT, E08_COLLAB_BACKEND.

### 191–200: Ovládání, odolnost a vlastní expedice

191. **RPG-191 — Stejný cíl myší, dotykem a klávesnicí.** Veškeré zásadní ovládání má rovnocenné vstupy. (P1)
192. **RPG-192 — Smysluplný statický svět.** Vypnutý pohyb ponechá obsah, význam a výsledek celé zkušenosti. (P1)
193. **RPG-193 — Intenzita pohybu podle uživatele.** Klidný, omezený a plný pohyb respektují společné preference. (P1)
194. **RPG-194 — Výkon podle skutečného zařízení.** Zvolit přiměřenou kvalitu na základě ověřeného profilu a uživatelské volby. (P1)
195. **RPG-195 — Postupné načítání živé grafiky.** Nenačítat celou knihovnu médií při vstupu na web. (P1)
196. **RPG-196 — Soukromí vlastních souborů.** Uživatel vidí, co je uložené, kde, kolik zabírá a jak to smazat. (P1)
197. **RPG-197 — Vlastní offline balík.** Vybrat potřebné texty a dovolené lokální podklady pro vlastní trasu. (P6)
198. **RPG-198 — Import a obnovení vlastní cesty.** Bezpečně pokračovat z exportu po změně profilu nebo zařízení. (P1)
199. **RPG-199 — Přístupnost celého průchodu.** Průběžná QA pokryje i čtení, kontrast, focus a klidný terénní režim. (P1)
200. **RPG-200 — Uživatel tvoří vlastní expedici.** Sestavit vlastní otázku, lekce, skutečná místa a vlastní výstup do přenosného celku. (P8)

## Regresní základ a konkrétní QA

Z kořene původního repozitáře:

```sh
node tests/expeditions.mjs
npm test
git diff --check
```

Při zásahu do dosavadního pohybu navíc:

```sh
node tests/art-scenes.mjs
node tests/art-motion.mjs
node tests/logo-motion.mjs
node tests/hero-motion.mjs
```

Při zásahu do zdrojových dat nebo generátoru expedic provést odpovídající import/generování a ověřit výsledek. Samotný číselný počet lekcí nebo PNG není vizuální kontrola. Ve skutečném prohlížeči zkoušet desktop, telefon, krátkou landscape, focus, rychlý/zpětný scroll, reduced motion, chybu assetu, selhání storage a skutečný export/import. Offline instalace vyžaduje odpovídající bezpečný kontext; nelze ji prohlásit za ověřenou jen z textu service workeru.

## Řízení lokální smyčky

1. Načíst závaznou referenci, aktuální checkpoint a pouze způsobilé ID. Repozitář si stále drží původní stack a routy.
2. Přečíst konkrétní akceptaci a naplánovat nejmenší použitelný výsledek. Potřebný dílčí checklist zůstává uvnitř stejného ID.
3. Implementovat v povoleném rozsahu; neměnit frontu, základní omezení nebo tvrzení o externích materiálech jen pro získání zelené kontroly.
4. Spustit vhodné regresní a nové cílené scénáře; pořídit skutečnou evidenci. Samotný exit 0 agentního nástroje není hotová funkce.
5. Nezávisle posoudit splnění akceptace, skutečný diff a evidenci. Opravit konkrétní nedostatek v omezeném počtu pokusů.
6. Uložit checkpoint, důvod rozhodnutí a případný lokální commit. Otevřenou blokaci popsat; pokračovat jiným nezávislým úkolem.
7. Po limitu běhu skončit s přehledem hotových ID, blokací a příštího doporučeného ID. Nespouštět neomezenou smyčku bez limitu času či iterací a bez možnosti zastavení.

Plán nezavádí automatickou synchronizaci GitHub ↔ Sites. Před budoucím nasazením ověřit skutečný cílový hosting, oprávnění a aktuální větev; neodvozovat nasazení z existence repozitáře.

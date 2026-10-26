# CAISIK SELFMADE — plán a stav 200 funkcí

Hrdinou je uživatel. Základem je cyklus **objev → pochop → vytvoř → uprav → proměň svůj svět**. Tento plán rozšiřuje existující kulturní atlas o `/play/`; nepřepisuje Hidden City, Seven Principles, Frequency, Living Wall ani původní Blackbook. Přesné zadání je archivováno v [REQUEST.md](REQUEST.md).

## Výchozí projekt a pravidla

- Skutečný stack: statické HTML/CSS, ES modules, Node testy a Python generátory expedic. Žádný React/Next/CMS/backend není ve výchozím projektu.
- Zdrojový bod: commit `65b2f899af9326ec9f5f069288d34d04dac351f5`, publikovaná verze 23. Identita a veřejné publikum se zachovají.
- Schválená grafika: [APPROVED-STYLE.md](../atlas/APPROVED-STYLE.md). Sytá žlutá, černá, komiksové obrysy, původní graffiti; existující schválené rastrové originály se nebarví ani nevydávají za kompletně rozvrstvené 3D.
- Nativní scroll a klávesnice zůstávají funkční. Pohyb má pauzu, statický význam, reduced-motion a respektuje viditelnost dokumentu.
- Žádná automatická hudba, geolokace, upload, marketingový tracking, rezervace ani falešný mentor.

## Pracovní pořadí a kontrolní body

1. **Audit a záloha.** Potvrdit zdroj, router, assety, storage, manifest, testy a aktuální veřejnou verzi. Zachovat původní soubory a data.
2. **Společný základ.** Verzovaný soukromý stav profilu, artefaktů, inventáře a questů; obnovitelná poškozená data, viditelné chyby zápisu, export a slučovací import.
3. **Kompletní Writer pilot.** Skutečná skica, konstrukce, paleta, replay vlastních tahů, uložená první verze a revize s vysvětlením.
4. **MC a další disciplíny.** Vlastní text, dvě verze přednesu; DJ dramaturgie/tracklist/cue; bezpečný Breaking deník bez vymyšlené odborné demonstrace; Knowledge třídění tvrzení a zpřesňování.
5. **Město a Blackbook.** Reálná místa ze stávajících dat, vlastní pořadí trasy, terénní adresa bez nucené animace, soukromé postřehy a přenosný sešit.
6. **Živá scéna.** Osobní svět, slunce/měsíc, oči, kreslená geometrie a smysluplné study fáze. Původní specializované animace mají přednost před obecnou vrstvou.
7. **Integrace a QA.** Otestovat browser, desktop/telefon/krátký landscape, zpětný scroll, klávesnici, klidný režim, chybný asset, export/import a selhání úložiště. Výsledky a limity uvést v QA_REPORT.md.
8. **Publikace stejného projektu.** Zabalit přesný otestovaný commit, uložit verzi, nasadit, potvrdit skutečný výsledek. GitHub a Sites nejsou automaticky synchronizované.

## Externí produkční podmínky

- **Oddělené malované vrstvy a čisté podklady:** úplné rozložení všech 100 archivních obrazů, velké parallax posuny postav a skutečný morph vyžadují vyrobené soubory. Geometrická autorská vrstva není náhradou ani důkazem jejich existence.
- **Hudební a obrazová práva:** připravené nahrávky a jejich vrstvy musí mít ověřené svolení/licence; odkaz sám licenci nepředstavuje. Vlastní soubor se přehrává jen na pokyn uživatele.
- **Breaking:** odborné demonstrace, správnost techniky a lektorskou reakci dodá kvalifikovaný spoluautor. Ilustrace nebo formulář to nenahrazují.
- **Lidé a partnerství:** rozhovory, mentoring a partnerské označení jen po skutečné dohodě a souhlasu.
- **Veřejná komunita:** účty, autorizace, moderace, souhlasy, ukládání a mazání před veřejným sdílením nebo spoluprací. Lokální export není veřejná cloudová služba.
- **Offline:** původní textový expedition balíček má vlastní service worker. Nové RPG není automaticky plně offline jen proto, že poznámky jsou lokální.

## Význam stavů

- `implemented`: kód splňuje konkrétní popsanou funkci v uvedeném rozsahu; důkaz je ve zdrojovém souboru/testu. Neznamená odborné posouzení nebo test na fyzickém telefonu.
- `partial`: funkce má skutečný použitelný základ, část původního rozsahu chybí; poznámka přesně určuje rozdíl.
- `external`: požadovaný výsledek potřebuje skutečná média, práva, lidskou spolupráci nebo službu, které nejsou dodané.
- `planned`: zatím nemá prokázanou implementaci.

Strojový přehled všech funkcí včetně důkazů je [coverage.json](coverage.json). Stav se aktualizuje až po kontrole skutečného kódu; seznam není tvrzení o 200 dokončených funkcích.

## Auditovaný rozsah této verze

**95 partial**, **94 implemented**, **10 external**, **1 planned**. Tento počet zahrnuje nové i zachované existující funkce splňující zadání; není počtem nových samostatných modulů. Žádný nehotový bod se nepočítá jako plně dokončený. Stavy `partial` nejsou jen externí závislosti: obsahují i dosud neimplementované lokální funkce.

## Všech 200 funkcí — přesný přenos zadání a skutečný stav

### RPG-001 · ★ Vlastní alias probudí svět.

Napíšeš svůj tag a jeho tahy otevřou vstupní scénu města.

**Stav:** `partial` — Alias pojmenuje živý svět; kreslené tahy vlastního tagu jako vstup zatím chybí.

**Kód:** `dist/play/app.js`, `dist/selfmade-motion.js`.

### RPG-002 · Osobní začátek příběhu.

Vybereš, co chceš vytvořit: první mix, vlastní sloku, piece, pohybovou frázi nebo manifest.

**Stav:** `implemented` — Profil volí vlastní výstup a pět samostatných cest.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-003 · První pokus jako výchozí bod.

Na začátku zachytíš svou současnou práci, ke které se budeš později vracet a porovnávat změny.

**Stav:** `implemented` — První skutečná uložená verze zůstává při revizích zachovaná.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-004 · Volné kombinování disciplín.

Můžeš být zároveň MC a Writer; jednotlivé cesty se propojí podle tvých zájmů.

**Stav:** `implemented` — Více disciplín lze zvolit současně a používat bez povinného pořadí.

**Kód:** `dist/play/app.js`, `dist/play/workshops.js`.

### RPG-005 · Vlastní způsob hraní.

Zvolíš si pozorování, experiment, studium nebo intenzivní tvorbu a podle toho dostaneš jinak sestavené úkoly.

**Stav:** `partial` — Režim se uloží; automaticky odlišné sestavení celé výpravy zatím není.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-006 · Dobrodružství podle času.

Zadáš dostupný čas a web nabídne smysluplnou krátkou výpravu nebo delší tvůrčí session.

**Stav:** `partial` — Časový rozpočet lze nastavit; nevypočítává ani automaticky nenabízí kompletní vhodnou trasu.

**Kód:** `dist/play/app.js`, `dist/play/field.js`.

### RPG-007 · Avatar z vlastního symbolu.

Tvoji postavu bude reprezentovat znak, který sám nakreslíš nebo sestavíš.

**Stav:** `partial` — Vlastní znak se uloží do profilu; plně kreslený sestavitelný avatar není.

**Kód:** `dist/play/workshops.js`, `dist/play/app.js`.

### RPG-008 · Osobní kodex.

Sepíšeš tři zásady své tvorby; budou se vracet při důležitých rozhodnutích.

**Stav:** `partial` — Tři zásady se ukládají; kontextové připomínání při všech rozhodnutích chybí.

**Kód:** `dist/play/app.js`.

### RPG-009 · Zpráva budoucímu já.

Na začátku uložíš očekávání a po dokončení projektu se ti otevře jejich porovnání se skutečností.

**Stav:** `partial` — Zpráva budoucímu já je v profilu/záloze; zvláštní dokončovací porovnání chybí.

**Kód:** `dist/play/app.js`, `dist/play/journal.js`.

### RPG-010 · Vlastní zadání.

Vedle připravených questů si založíš vlastní cíl, výstup a podmínky dokončení.

**Stav:** `implemented` — Vlastní quest má otázku, výstup, kritérium a vazbu na konkrétní dílo.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-011 · Město jako souvislé prostředí.

Jednotlivé sekce spojí ulice, průchody, stanice, dílny a veřejná prostranství.

**Stav:** `partial` — Základna propojuje skutečné sekce; souvislý prostor ulic a průchodů není vyrobený.

**Kód:** `dist/play/app.js`, `dist/selfmade-motion.js`.

### RPG-012 · ★ Osobní verze Paříže.

Tvoje objevy a vlastní práce postupně vytvoří soukromou autorskou vrstvu nad skutečným městem.

**Stav:** `partial` — Soukromá trasa a vlastní postřehy existují; vlastní geografická vrstva nad mapou Paříže chybí.

**Kód:** `dist/play/field.js`, `dist/play/journal.js`.

### RPG-013 · Cesta mezi kapitolami.

Scroll bude působit jako průchod prostředím: od ulice přes schodiště až do pracovny nebo studia.

**Stav:** `partial` — Nativní scroll a navazující prostory fungují; filmová cesta ulicí a schodištěm chybí.

**Kód:** `dist/play/app.js`, `dist/selfmade-motion.js`.

### RPG-014 · Volitelný den a noc.

Stejná scéna dostane dvě atmosféry, které změní světlo, zvuk a způsob pozorování.

**Stav:** `partial` — Den/noc mění osobní scénu; zvukové a pozorovací varianty nejsou kompletní.

**Kód:** `dist/play/app.js`, `dist/selfmade-motion.js`.

### RPG-015 · Atmosféra podle tvého záměru.

Zvolíš například soustředění, napětí nebo klid a upraví se výtvarné zpracování prostředí.

**Stav:** `partial` — Záměr atmosféry mění vizuální akcent; nejde o kompletní alternativní scénu.

**Kód:** `dist/play/app.js`.

### RPG-016 · Město získává tvoje stopy.

Po dokončení práce se objeví tvůj znak, úryvek textu nebo část kompozice.

**Stav:** `implemented` — Soukromá zeď ukazuje skutečné texty a skici; živý svět reaguje na vlastní uloženou práci.

**Kód:** `dist/play/journal.js`, `dist/selfmade-motion.js`.

### RPG-017 · Vlastní výstupy jako součást prostředí.

Mix může žít v osobním studiu, skica na stěně a manifest v knihovně.

**Stav:** `implemented` — Studio, dílna nebo knihovna zobrazí vlastní uložené výstupy.

**Kód:** `dist/play/journal.js`.

### RPG-018 · Soukromá virtuální zeď.

Dostaneš vlastní plochu, na kterou skládáš pouze svoje návrhy a povolené materiály.

**Stav:** `implemented` — Soukromá virtuální zeď se skládá z vlastních verzovaných děl.

**Kód:** `dist/play/journal.js`.

### RPG-019 · Historie osobního světa.

Přepneš si, jak tvoje prostředí vypadalo před prvním projektem a po dalších revizích.

**Stav:** `partial` — Posuvník ukáže prostor s různým počtem vlastních děl; nejde o historické snímky celé scény po každé revizi.

**Kód:** `dist/play/journal.js`.

### RPG-020 · Rozpracovaná místa.

Nedokončené projekty zůstanou viditelné jako konkrétní dílny, do kterých se můžeš vrátit.

**Stav:** `implemented` — Rozpracované dílny a jejich aktivní obsah se obnoví z lokálního stavu.

**Kód:** `dist/play/app.js`, `dist/play/workshops.js`.

### RPG-021 · Osobní herní panel.

Vždy uvidíš aktuální záměr, rozpracovaný výstup a jeden další smysluplný krok.

**Stav:** `implemented` — HUD ukáže alias, vlastní pokusy, revize a další smysluplný krok.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-022 · Deník questů.

Přehledně oddělí hlavní výpravu, vedlejší experimenty a vlastní zadání.

**Stav:** `partial` — Hlavní a vlastní questy jsou oddělené; adaptivní vedlejší experimenty nejsou samostatný systém.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-023 · Malá orientační mapa.

Ukáže tvoji pozici v příběhu webu a dostupné návaznosti mezi disciplínami.

**Stav:** `partial` — Pět prostorů má stálou navigaci; prostorová minimapa vazeb chybí.

**Kód:** `dist/play/app.js`.

### RPG-024 · Inventář materiálu.

Slova, vlastní zvuky, barevné kombinace, skici a poznámky dostanou společné místo.

**Stav:** `partial` — Inventář ukládá slova, palety, reference a poznámky; zvukové binární přílohy nejsou trvale v inventáři.

**Kód:** `dist/play/journal.js`.

### RPG-025 · ★ Pracovní stůl.

Přetáhneš materiál z inventáře do zadání a rovnou z něj začneš sestavovat vlastní výstup.

**Stav:** `partial` — Pracovní stůl řadí materiál tlačítky a sestaví vlastní dílo; přímé drag-and-drop chybí.

**Kód:** `dist/play/journal.js`.

### RPG-026 · Vlastní základna.

Domovskou scénu si poskládáš jako studio, dílnu, knihovnu nebo jejich kombinaci.

**Stav:** `partial` — Lze zvolit soukromé studio/dílnu/knihovnu; volné skládání jejich objektů chybí.

**Kód:** `dist/play/journal.js`.

### RPG-027 · Předměty s funkcí.

Gramofon otevře mix, sprej návrh, zápisník reflexi; každá interakce povede ke konkrétní činnosti.

**Stav:** `partial` — Funkční odkazy vedou do tvůrčích prostorů; všechny prostorové předměty zatím nejsou ovladatelné.

**Kód:** `dist/play/app.js`.

### RPG-028 · Pokračování přesně tam, kde jsi skončil.

Obnoví se otevřená lekce, rozepsaný text i stav pracovního nástroje.

**Stav:** `implemented` — Obnoví se panel, aktivní disciplína, odpovědi a rozpracované nástroje.

**Kód:** `dist/play/app.js`, `dist/play/workshops.js`, `dist/play/store.js`.

### RPG-029 · Autorský průvodce světem.

Jasně fiktivní postava nabídne otázku, nápovědu nebo kontext podle toho, co právě děláš.

**Stav:** `implemented` — Jasně fiktivní průvodce nabízí otázku podle disciplíny a fáze osobní scény.

**Kód:** `dist/selfmade-motion.js`.

### RPG-030 · Rychlé přesuny po webu.

Z kterékoliv scény se okamžitě dostaneš ke své trase, práci, zdrojům nebo Blackbooku.

**Stav:** `implemented` — Stálé rychlé přesuny vedou k trase, tvorbě, Blackbooku a původním zdrojovým expedicím.

**Kód:** `dist/play/app.js`.

### RPG-031 · ★ Rozebrat všechny obrazy na prvky.

Písmena, oči, ornamenty, předměty a pozadí dostanou vlastní připravené vrstvy.

**Stav:** `partial` — 100 archivních obrazů má autorskou geometrickou vrstvu; úplné oddělené malované prvky všech obrazů nejsou dodané.

**Kód:** `dist/selfmade-motion.js`, `dist/art-motion.js`.

### RPG-032 · Každé dílo má vlastní pohybový charakter.

Některé dýchá, jiné se skládá, otáčí nebo postupně odhaluje konstrukci.

**Stav:** `partial` — Existují významové pohybové režimy a specializované původní scény; všech 100 děl nemá unikátně vyrobený pohyb každého prvku.

**Kód:** `dist/selfmade-motion.js`, `dist/art-motion.js`.

### RPG-033 · Oči reagují na hráče.

Sledují vybraný detail, otevřou se při objevu a zavřou při přechodu do soustředěné práce.

**Stav:** `partial` — Oči původního hero a nové scény reagují; sledování vybraného detailu všech maleb není.

**Kód:** `dist/selfmade-motion.js`, `dist/alchemy-hero.js`.

### RPG-034 · ★ Skutečný oběh slunce a měsíce.

Pohybují se kolem kompozice a mění osvětlení jednotlivých symbolů.

**Stav:** `implemented` — Původní skutečně oddělené slunce/měsíc a nová nativní scéna mají nezávislý oběh.

**Kód:** `dist/alchemy-hero.js`, `dist/selfmade-motion.js`.

### RPG-035 · Písmena vznikají před očima.

Nejdřív osa, potom objem, obrys, výplň a světelný akcent.

**Stav:** `partial` — Vlastní tahy lze přehrát a studovat konstrukci; malovaná písmena všech originálů nejsou rekonstruovaná po vrstvách.

**Kód:** `dist/play/workshops.js`, `dist/selfmade-motion.js`.

### RPG-036 · Předměty ovlivňují ostatní části obrazu.

Otočení klíče otevře ornament, posunutí faderu promění okolní strukturu.

**Stav:** `implemented` — Ovládaný klíč otevře dvě křídla brány a změní navazující konstrukční geometrii.

**Kód:** `dist/selfmade-motion.js`.

### RPG-037 · Řízené kapky barvy.

Objeví se při konkrétním tahu nebo změně kompozice a stanou se součástí výsledného obrazu.

**Stav:** `partial` — Vlastní gesto vytvoří řízené omezené kapky v živé scéně; jejich trvalý export do výsledného vlastního díla chybí.

**Kód:** `dist/selfmade-motion.js`.

### RPG-038 · Geometrie ukazuje konstrukci.

Kruhy, osy a proporce se kreslí při rozboru toho, jak obraz drží pohromadě.

**Stav:** `implemented` — Ovládané fáze kreslí osy, kruhy a vztahy s výslovným autorským označením.

**Kód:** `dist/selfmade-motion.js`.

### RPG-039 · Odhalování vlastním tahem.

Pohybem prstu nebo kurzoru odkryješ skrytou vrstvu a souvislost, kterou můžeš pojmenovat.

**Stav:** `implemented` — Vlastní pohyb štětce nebo klávesnicový posuvník odkrývá autorskou konstrukční vrstvu.

**Kód:** `dist/selfmade-motion.js`.

### RPG-040 · Obraz má přístupný rozbor.

Každý animovaný detail lze zastavit, označit a přečíst si, proč je v kompozici.

**Stav:** `implemented` — Studijní dialog má pauzu, scrubber, tlačítka fází a textový výklad.

**Kód:** `dist/selfmade-motion.js`.

### RPG-041 · Vlastní vstup do každé disciplíny.

DJ otevře prostor zvukem, Writer konstrukcí písmene a Knowledge změnou pohledu.

**Stav:** `partial` — Každá disciplína má vlastní zadání a dílnu; všech pět filmových vstupů není vyrobených.

**Kód:** `dist/play/app.js`, `dist/play/workshops.js`.

### RPG-042 · Kabel se promění v obrys.

Připravený vektorový přechod propojí studio s graffiti kompozicí.

**Stav:** `external` — Skutečný vektorový morph kabelu do obrysu potřebuje připravené produkční vrstvy.

### RPG-043 · Písmena vytvoří architekturu.

Tahy wildstylu přejdou do schodišť, ulic a staveb další scény.

**Stav:** `partial` — Architektura vlastní scény se skládá; skutečný morph wildstyle tahů do staveb chybí.

**Kód:** `dist/selfmade-motion.js`.

### RPG-044 · Předmět propojí dvě kapitoly.

Stejný mikrofon nebo symbol přejde přes celý obraz a objeví se v novém prostředí.

**Stav:** `planned` — Kontinuální přenos stejného předmětu přes dvě scény chybí.

### RPG-045 · Oddělená hloubka scén.

Postava, písmena a pozadí se pohybují různou rychlostí podle skutečně připravených vrstev.

**Stav:** `partial` — Původní hero má skutečné oddělené vrstvy; všechny postavy a obrazy takto připravené nejsou.

**Kód:** `dist/alchemy-hero.js`, `dist/art-motion.js`.

### RPG-046 · Proměna podle vlastního rozhodnutí.

Výběr jiného záměru změní uspořádání obrazu, světlo i dominantní objekt.

**Stav:** `partial` — Svět reaguje na světlo, atmosféru a vlastní práci; úplná kompozice podle všech záměrů není.

**Kód:** `dist/play/app.js`, `dist/selfmade-motion.js`.

### RPG-047 · Závěr scény reaguje na výstup.

Po uložení práce se krátce představí to, co jsi právě vytvořil.

**Stav:** `partial` — Uložení promění počty/stopy a práci lze prohlédnout; speciální filmové představení konkrétního výstupu chybí.

**Kód:** `dist/play/app.js`, `dist/play/journal.js`, `dist/selfmade-motion.js`.

### RPG-048 · Hover odhalí význam detailu.

Najetí, dotyk nebo fokus spustí krátkou lokální reakci konkrétního prvku.

**Stav:** `implemented` — Hover, fokus a samostatná dotyková study akce odhalí význam a fáze.

**Kód:** `dist/selfmade-motion.js`.

### RPG-049 · Obraz reaguje na vlastní přehrávaný zvuk.

Vybrané vrstvy dostanou pohyb navázaný na rytmus nebo intenzitu nahrávky.

**Stav:** `implemented` — Skutečný analyzér vlastního přehrávaného souboru řídí samostatnou vrstvu živého světa.

**Kód:** `dist/play/sound.js`, `dist/selfmade-motion.js`.

### RPG-050 · Vratná proměna.

Zpětným scrollem rozebereš hotovou scénu zpět na rozhodnutí, ze kterých vznikla.

**Stav:** `partial` — Původní expedice mají vratný scroll a study vrstvy seek; úplná filmová rekonstrukce rozhodnutí chybí.

**Kód:** `dist/expeditions/app.js`, `dist/selfmade-motion.js`.

### RPG-051 · ★ Mentalismus: svět z prázdna.

Z černé plochy začne podle tvých slov a rozhodnutí vyrůstat vlastní městská kompozice.

**Stav:** `partial` — Původní Mentalism roste z černého prázdna; zatím jej negenerují vlastní slova a rozhodnutí uživatele.

**Kód:** `dist/art-motion.js`, `dist/play/app.js`.

### RPG-052 · Korespondence: detail a celek.

Přecházíš od konstrukce písmene k půdorysu čtvrti a hledáš podobnosti různých měřítek.

**Stav:** `partial` — Existuje ovládané srovnání měřítek vzoru a městské sítě; vlastní písmeno do skutečného půdorysu zatím ne.

**Kód:** `dist/atlas-principles.js`.

### RPG-053 · Vibrace: stejný tvar, jiné tempo.

Ručně měníš puls a pozoruješ, jak promění dojem ze stejné kompozice.

**Stav:** `implemented` — Vlastní frekvence mění nativní vlnu a volitelný tón; bez automatického audia.

**Kód:** `dist/atlas-principles.js`.

### RPG-054 · Polarita: dvě čtení jednoho motivu.

Posuvníkem přecházíš mezi dvěma výtvarnými řešeními a vysvětluješ změnu významu.

**Stav:** `implemented` — Posuvník ovládá vizuální kontrast stejného motivu s výslovným označením analogie.

**Kód:** `dist/atlas-principles.js`.

### RPG-055 · Rytmus: celé kyvadlo.

Do jeho návratů rozmisťuješ vlastní slabiky, údery nebo vizuální akcenty.

**Stav:** `partial` — Celé původní kyvadlo se kýve a rytmické kroky lze měnit; vlastní slabiky nejsou svázané s jeho návraty.

**Kód:** `dist/art-motion.js`, `dist/atlas-principles.js`.

### RPG-056 · Příčina a následek: řetěz rozhodnutí.

Změníš jeden prvek a sleduješ, které další části práce tím ovlivníš.

**Stav:** `partial` — Ovládaný model ukazuje změnu následku vstupu; není to graf vlastních tvůrčích rozhodnutí.

**Kód:** `dist/atlas-principles.js`.

### RPG-057 · Gender: souhra tvůrčích funkcí.

Dvě doplňující se konstrukce vytvoří společný znak; jejich funkce se nebudou přiřazovat pohlavím.

**Stav:** `implemented` — Dvě ovládané tvůrčí funkce vytvoří společný tvar bez přiřazování pohlavím.

**Kód:** `dist/atlas-principles.js`.

### RPG-058 · Princip jako pracovní nástroj.

Z každého rozboru přejdeš rovnou do konkrétního úkolu pro text, zvuk nebo obraz.

**Stav:** `implemented` — Principy mají konkrétní cvičení, freestyle a návaznost na tvůrčí prostory.

**Kód:** `dist/atlas-principles.js`, `dist/play/app.js`.

### RPG-059 · Vlastní výklad principu.

Uložíš příklad ze své práce a označíš, kde jde o metaforu nebo osobní interpretaci.

**Stav:** `partial` — Vlastní pozorování se ukládá; vyhrazené typování vlastní metafory a vazba na dílo chybí.

**Kód:** `dist/atlas-principles.js`.

### RPG-060 · Osobní sedmidílná kompozice.

Ze sedmi vlastních cvičení sestavíš jeden obraz s dohledatelným postupem jeho vzniku.

**Stav:** `implemented` — Sedm skutečných vlastních odpovědí vytvoří uloženou verzovanou kompozici a samostatný SVG export.

**Kód:** `dist/play/practice.js`.

### RPG-061 · ★ Mapa podle toho, co chceš vytvořit.

Nabídne místa vhodná pro poslech, konstrukci písmen, pozorování nebo psaní.

**Stav:** `partial` — Místa lze filtrovat podle tvůrčího záměru; stejný filtr není přímo novou mapovou vrstvou.

**Kód:** `dist/play/field.js`.

### RPG-062 · Dvě vrstvy stejného místa.

Přepneš mezi doloženými informacemi a jasně označeným autorským čtením.

**Stav:** `implemented` — Doložený kontext, dokumentované prvky a autorská interpretace jsou odděleně označené.

**Kód:** `dist/play/field.js`.

### RPG-063 · Vlastní sestavení výpravy.

Poskládáš si zastávky podle času, dopravy, dostupnosti a pracovního záměru.

**Stav:** `implemented` — Vlastní pořadí zastávek, dopravní záměr a časový rozpočet mají ukládání a obnovu.

**Kód:** `dist/play/field.js`.

### RPG-064 · Podmínky přímo v mapě.

U místa uvidíš datum kontroly, omezení a to, co je potřeba znovu potvrdit.

**Stav:** `implemented` — Místa ukazují podmínky, datum původní kontroly a skutečné zdroje.

**Kód:** `dist/play/field.js`.

### RPG-065 · Místo otevře tvůrčí scénu.

Skutečná lokalita nabídne odpovídající autorský artwork a konkrétní úkol.

**Stav:** `partial` — Místo otevře konkrétní tvůrčí úkol; samostatná autorská malba každé lokality chybí.

**Kód:** `dist/play/field.js`.

### RPG-066 · Historická paměť čtvrti.

Otevřeš doložené události, zdroje a kulturní souvislosti bez vymyšlených příběhů.

**Stav:** `implemented` — Převzatý doložený kontext a zdroje zůstávají dohledatelné.

**Kód:** `dist/play/field.js`.

### RPG-067 · Rozlišení činností na místě.

Mapa jasně ukáže, kde jde o pozorování, veřejnou návštěvu nebo samostatně povolenou tvorbu.

**Stav:** `partial` — Pravidla návštěvy a tvorby jsou uvedená; plná strukturovaná mapa oprávnění činností chybí.

**Kód:** `dist/play/field.js`.

### RPG-068 · Vlastní pozorovací body.

Soukromě si uložíš místo, které tě inspirovalo, včetně poznámky, co na něm chceš studovat.

**Stav:** `implemented` — Vlastní soukromý bod ukládá jméno, adresní popis a záměr bez vymyšleného pinu.

**Kód:** `dist/play/field.js`.

### RPG-069 · Jedno místo, pět rozdílných úkolů.

Stejný prostor otevře jinou činnost pro DJ, MC, Writera, Breaking a Knowledge.

**Stav:** `implemented` — Každé místo nabídne pět odlišných disciplinárních tvůrčích zadání.

**Kód:** `dist/play/field.js`.

### RPG-070 · Osobní roadbook.

Vybraná trasa bude obsahovat tvoji přípravu, pracovní materiál a zamýšlené výstupy.

**Stav:** `implemented` — TXT roadbook obsahuje vlastní trasu, podmínky, zdroje, zadání a vlastní postřehy.

**Kód:** `dist/play/field.js`.

### RPG-071 · Terénní obrazovka přes celý telefon.

Ukáže aktuální místo, adresu, jeden úkol a velké ovládání dalšího kroku.

**Stav:** `implemented` — Terénní část zobrazí adresu, navigaci, jeden úkol a předchozí/další místo bez čekání na animaci.

**Kód:** `dist/play/field.js`.

### RPG-072 · Krátké výpravy.

Dostaneš sestavu úkolů na krátkou pauzu, volné odpoledne nebo celý tvůrčí den.

**Stav:** `partial` — Vlastní krátký časový rozpočet lze zadat; automaticky sestavené krátké expedice chybí.

**Kód:** `dist/play/field.js`, `dist/play/app.js`.

### RPG-073 · Úkoly pro přesun.

Během čekání si připravíš otázku, rytmickou strukturu nebo pozorovací zadání další zastávky.

**Stav:** `partial` — Pozorovací podněty lze využít při přesunu; vyhrazené adaptivní úkoly během čekání chybí.

**Kód:** `dist/play/quests.js`, `dist/play/field.js`.

### RPG-074 · Namluvené zadání.

Po vlastním spuštění si poslechneš stručný úkol a podmínky návštěvy.

**Stav:** `implemented` — Výslovný stisk přečte úkol místním českým hlasem; chybějící hlas má textový fallback.

**Kód:** `dist/play/field.js`.

### RPG-075 · Náhradní větev výpravy.

Zavřené místo nabídne jinou činnost se stejným vzdělávacím cílem.

**Stav:** `implemented` — Zavřené místo má domácí alternativu se stejným tvůrčím záměrem.

**Kód:** `dist/play/field.js`.

### RPG-076 · Tři konkrétní postřehy.

Na místě zachytíš například tvar, zvuk a gesto, které později použiješ ve vlastní práci.

**Stav:** `implemented` — Tvar, zvuk, gesto a poznámka se ukládají soukromě po jednotlivých místech.

**Kód:** `dist/play/field.js`.

### RPG-077 · Vlastní tempo výpravy.

Zaznamenáš, kolik času jsi skutečně potřeboval, a další plán tomu přizpůsobíš.

**Stav:** `implemented` — Ruční start/pauza/ukončení zaznamená vlastní skutečný čas; srovnání s rozpočtem dovolí příští plán upravit podle zkušenosti.

**Kód:** `dist/play/field.js`.

### RPG-078 · Trasa podle potřeb.

Vybereš vhodné přesuny, požadované přestávky a dostupnost míst podle ověřených podmínek.

**Stav:** `partial` — Doprava a podmínky jsou vidět; automatické plánování přestávek a ověřené bezbariérové optimalizace není.

**Kód:** `dist/play/field.js`.

### RPG-079 · Tvorba bez veřejného odhalení polohy.

Můžeš sdílet výstup bez přesného místa a času jeho vzniku.

**Stav:** `implemented` — Veřejné odhalení polohy není vyžadované; vlastní díla lze exportovat bez přesných postřehových bodů.

**Kód:** `dist/play/field.js`, `dist/play/journal.js`.

### RPG-080 · Návratová session.

Po cestě tě čeká krátký rozbor nasbíraného materiálu a volba toho, co opravdu dokončíš.

**Stav:** `implemented` — Návratová session ukládá vybraný materiál a konkrétní další krok.

**Kód:** `dist/play/field.js`.

### RPG-081 · ★ Sedm kroků jedné lekce.

Otázka, kontext, všímání, ukázka, pokus, zpětná vazba a přenos dostanou vlastní interaktivní průchod.

**Stav:** `implemented` — Všech pět cest má sedm pedagogických kroků a vlastní uložené odpovědi.

**Kód:** `dist/play/quests.js`, `dist/play/app.js`.

### RPG-082 · Hlavní příběh směřuje k dílu.

Každá expedice končí konkrétním vlastním výstupem a jeho vysvětlením.

**Stav:** `partial` — Cesty vedou k dílu a revizi; textový podklad sám nepotvrzuje hotový zvukový mix nebo odbornou taneční session.

**Kód:** `dist/play/quests.js`, `dist/play/workshops.js`.

### RPG-083 · Vedlejší úkol podle zjištěného problému.

Zvolíš, co potřebuješ zlepšit, a otevře se odpovídající experiment.

**Stav:** `partial` — Vlastní navazující quest lze založit; automatická nabídka podle zjištěného problému není.

**Kód:** `dist/play/app.js`.

### RPG-084 · Rozhodování mění pokračování.

Jiný tvůrčí záměr povede k jiné variantě dalšího úkolu.

**Stav:** `partial` — Lze měnit vybavení a omezení; adaptivní větvení celé další lekce není.

**Kód:** `dist/play/quests.js`, `dist/play/app.js`.

### RPG-085 · ★ Boss je vlastní první verze.

Vrátíš se ke svému původnímu pokusu, přepracuješ ho a ukážeš konkrétní změnu.

**Stav:** `implemented` — První a aktuální skutečnou verzi lze porovnat s vysvětleným rozhodnutím.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-086 · Quest s omezením.

Tvoříš například ze tří zvuků, dvou barev nebo čtyř pozorovaných detailů.

**Stav:** `implemented` — Quest uchová vlastní tvůrčí omezení vedle pracovního zadání.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-087 · Quest ze skutečné připomínky.

Poznámku posluchače nebo lektora proměníš v jeden navazující pokus.

**Stav:** `partial` — Skutečnou připomínku a další quest lze zapsat; automatické propojení připomínky do nové úlohy chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/app.js`.

### RPG-088 · Nápověda po vrstvách.

Nejdřív otázka, potom návod k pozorování a nakonec vysvětlený příklad.

**Stav:** `implemented` — Tři postupně otevírané podněty podporují pozorování, otázku a vysvětlení.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-089 · Návrat k rozhodnutí.

Můžeš se vrátit do bodu, kde práce začala ztrácet zamýšlený směr, a vyzkoušet jinou větev.

**Stav:** `partial` — Verze lze prohlížet a porovnat; samostatná editovatelná větev libovolného starého stavu chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-090 · Varianty podle vybavení a zkušenosti.

Stejný princip půjde prozkoumat s telefonem, skicákem i plně vybaveným studiem.

**Stav:** `implemented` — Telefon, papír a studio mají odlišné konkrétní pracovní varianty.

**Kód:** `dist/play/app.js`, `dist/play/quests.js`.

### RPG-091 · ★ Strom schopností s důkazy.

U každé větve bude tvoje konkrétní práce, revize a poznámka k tomu, co ses naučil.

**Stav:** `partial` — Postup se opírá o vlastní artefakty a revize; specifický důkaz jednotlivých dovedností není plný strom.

**Kód:** `dist/play/quests.js`, `dist/play/journal.js`.

### RPG-092 · Schopnosti propojují disciplíny.

Práce s pauzou se propojí s negativním prostorem; rytmus s pohybem a kompozicí.

**Stav:** `partial` — Vlastní díla lze propojit; předem připravený strom souvislostí všech schopností chybí.

**Kód:** `dist/play/journal.js`, `dist/play/quests.js`.

### RPG-093 · Vizuální odměny z vlastních výstupů.

Ornament nebo část základny vznikne z materiálu, který jsi skutečně vytvořil.

**Stav:** `implemented` — Vlastní práce skutečně naplní soukromou zeď a promění osobní scénu.

**Kód:** `dist/play/journal.js`, `dist/selfmade-motion.js`.

### RPG-094 · Historie použití schopnosti.

Otevřeš si, kde jsi daný princip naposledy zkusil a s jakým výsledkem.

**Stav:** `partial` — Historie verzí a rozhodnutí existuje; dovednosti nemají vlastní přesné časové použití.

**Kód:** `dist/play/journal.js`.

### RPG-095 · Vlastní kritérium pokroku.

Před pokusem pojmenuješ jednu věc, kterou chceš změnit, a později ji porovnáš.

**Stav:** `partial` — Vlastní kritérium questu a rozhodnutí se ukládá; zvláštní strukturované porovnání kritéria před/po chybí.

**Kód:** `dist/play/app.js`, `dist/play/workshops.js`.

### RPG-096 · Skutečná odborná reakce.

Pokud ji získáš, připojíš ji ke konkrétní verzi práce včetně svého dalšího kroku.

**Stav:** `external` — Pole přijme vlastní skutečně získanou reakci; skutečného odborníka ani jeho vyjádření projekt nedodává.

**Kód:** `dist/play/workshops.js`.

### RPG-097 · Opakování s odstupem.

Ke staršímu zadání se vrátíš později a porovnáš nový pokus s původním.

**Stav:** `implemented` — Staré vlastní dílo zůstává přístupné pro nový pokus a porovnání.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-098 · Odměny jako užitečné nástroje.

Otevře se pracovní šablona, konstrukční pomůcka nebo další vysvětlený rozbor.

**Stav:** `implemented` — Skutečný vlastní pokus otevře použitelné šablony revize a omezení, které se vloží do vlastního inventáře.

**Kód:** `dist/play/practice.js`.

### RPG-099 · Výzvy z vlastního Blackbooku.

Z dříve zapsaných otázek si vybereš téma příštího projektu.

**Stav:** `partial` — Otevřený další krok zůstane u díla a vlastní quest lze vytvořit; přímý převod jedním tlačítkem chybí.

**Kód:** `dist/play/journal.js`, `dist/play/app.js`.

### RPG-100 · Závěr kapitoly vlastními slovy.

Pojmenuješ, co se změnilo v práci, a tato změna se projeví v osobním světě.

**Stav:** `partial` — Vysvětlená změna se uloží a svět reaguje; speciální závěrečný rituál se souhrnem chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`, `dist/selfmade-motion.js`.

### RPG-101 · Digging podle hudební funkce.

Hledáš skladbu kvůli konkrétnímu rytmu, náladě nebo místu v zamýšleném setu.

**Stav:** `implemented` — DJ záměr a tracklist zaznamenávají vlastní výběr podle hudební funkce.

**Kód:** `dist/play/workshops.js`.

### RPG-102 · Ručně kreslená mapa energie.

Před mixem navrhneš průběh a po poslechu zaznamenáš, co se skutečně podařilo.

**Stav:** `partial` — Pětibodová mapa zamýšlené energie je ovladatelná; druhá skutečně dosažená křivka chybí.

**Kód:** `dist/play/workshops.js`.

### RPG-103 · Dva příběhy ze stejných skladeb.

Ze stejného výběru vytvoříš dva odlišné sety a vysvětlíš rozhodnutí.

**Stav:** `implemented` — Stejný tracklist lze přepracovat do druhé verzované dramaturgie a vysvětlit změnu.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-104 · Cue body jako herní značky.

Do vlastního nebo oprávněně použitého audia umístíš plánované nástupy a výstupy.

**Stav:** `implemented` — Vlastní soubor má přehrávání, zápis aktuálního času a vlastní cue poznámku.

**Kód:** `dist/play/workshops.js`.

### RPG-105 · Dílna jednoho přechodu.

Přepínáš mezi první a upravenou verzí stejného místa v mixu.

**Stav:** `partial` — A/B časové body dovolí opakovaný poslech; dvě oddělené nahrávky přechodu nejsou současný editor.

**Kód:** `dist/play/workshops.js`.

### RPG-106 · Rozbor vrstev při poslechu.

Na připravených oprávněných ukázkách sleduješ vztah rytmu, basy a melodie.

**Stav:** `external` — Licencované připravené oddělené hudební vrstvy nejsou dodané.

### RPG-107 · Set pouze ze tří skladeb.

Omezený výběr tě vede k promyšlení začátku, návaznosti a zakončení.

**Stav:** `implemented` — Nástroj vyžaduje nejméně tři vlastní položky a podporuje kompaktní třískladbový set.

**Kód:** `dist/play/workshops.js`.

### RPG-108 · Osobní karta nalezené desky.

Uložíš, co tě zaujalo, kde ji chceš použít a co si potřebuješ ověřit.

**Stav:** `partial` — Inventář umí vlastní poznámku s původem; specializovaná karta desky s budoucím použitím chybí.

**Kód:** `dist/play/journal.js`, `dist/play/workshops.js`.

### RPG-109 · Mix s autorskými poznámkami.

Ke konkrétním časům připojíš důvod výběru nebo změny.

**Stav:** `implemented` — Časové body a důvody rozhodnutí patří k vlastnímu mixu a ukládané revizi.

**Kód:** `dist/play/workshops.js`.

### RPG-110 · Vlastní mixtape jako artefakt.

Obal, tracklist a komentované rozhodnutí vytvoří dokončený osobní předmět ve světě CAISIK.

**Stav:** `partial` — Tracklist a rozhodnutí vytvoří artefakt; kompletní obal a trvale přiložený zvukový mixtape chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-111 · Lov konkrétního detailu.

Z vlastních pozorování sestavíš obraz, který lze vidět nebo slyšet.

**Stav:** `implemented` — MC má pozorovaný detail, asociaci a vlastní význam jako samostatná pracovní pole.

**Kód:** `dist/play/workshops.js`.

### RPG-112 · Dílna přesného vyjádření.

Vybereš obecnou formulaci a nahradíš ji konkrétnějším vlastním řádkem.

**Stav:** `implemented` — Přesný původní řádek lze nahradit konkrétnější vlastní variantou.

**Kód:** `dist/play/workshops.js`.

### RPG-113 · Asociační větvení.

Ze slova otevřeš několik významových cest a sám vybereš, která slouží textu.

**Stav:** `partial` — Tři metaforické kroky existují; volný větvený graf asociací chybí.

**Kód:** `dist/play/workshops.js`.

### RPG-114 · Mapa nádechů a pauz.

Do vlastního textu ručně označíš místa přednesu a vyzkoušíš jejich změnu.

**Stav:** `implemented` — Vlastní nádechy a důrazy lze označit v textu a zkusit v soukromém přednesu.

**Kód:** `dist/play/workshops.js`.

### RPG-115 · Důraz mění obraz.

Zvýrazněná slabika nebo slovo vystoupí v animaci přesně podle tvého označení.

**Stav:** `implemented` — Označené vlastní slovo dostává výrazný vizuální důraz.

**Kód:** `dist/play/workshops.js`.

### RPG-116 · ★ Dvě verze přednesu vedle sebe.

Stejný text propojíš se dvěma vlastními nahrávkami a konkrétním popisem rozdílu.

**Stav:** `implemented` — Dva skutečné vlastní přednesy A/B lze nahrát nebo načíst, lokálně přehrát, stáhnout a smazat.

**Kód:** `dist/play/workshops.js`.

### RPG-117 · Freestyle z vlastního inventáře.

Náhodně si vybereš tři dříve zachycená slova nebo obrazy a použiješ je ve čtyřech barech.

**Stav:** `implemented` — Tři náhodné podněty se losují z uživatelova skutečného inventáře.

**Kód:** `dist/play/workshops.js`.

### RPG-118 · Metafora ve třech krocích.

Spojíš pozorovaný detail, vzdálenou asociaci a vlastní význam.

**Stav:** `implemented` — Pozorovaný detail, vzdálená asociace a vlastní význam mají vysvětlený tříkrokový postup.

**Kód:** `dist/play/workshops.js`.

### RPG-119 · Oprava jednoho řádku.

Uchováš původní i novou podobu a připíšeš, co změna udělala s významem nebo rytmem.

**Stav:** `implemented` — První i nový řádek a vysvětlení změny zůstávají v uložených verzích.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-120 · Vlastní textová scéna.

Sloka, ověřené časování a zvolené symboly vytvoří osobní pohyblivou prezentaci přednesu.

**Stav:** `partial` — Text má vlastní akcenty a symboly; synchronizované ověřené časování celého přednesu chybí.

**Kód:** `dist/play/workshops.js`.

### RPG-121 · Vlastní abeceda.

Konstrukční řešení písmen si ukládáš a znovu používáš při dalších návrzích.

**Stav:** `partial` — Vlastní konstrukce se ukládají do abecedy; jejich plné opětovné skládání do dalších návrhů není.

**Kód:** `dist/play/workshops.js`.

### RPG-122 · Stavba písmene.

Samostatně ovládáš osu, hmotu, obrys a výplň a sleduješ jejich návaznost.

**Stav:** `implemented` — Vlastní tahy mají ovládanou osu, obrys, výplň a zobrazení celku.

**Kód:** `dist/play/workshops.js`.

### RPG-123 · Přepnutí negativního prostoru.

Průhledy mezi písmeny se zvýrazní, abys mohl porovnat čitelnost variant.

**Stav:** `implemented` — Přepnutí negativního prostoru zvýrazní vztah vlastní stopy a jejího okolí.

**Kód:** `dist/play/workshops.js`.

### RPG-124 · Paleta jako pracovní recept.

Barvy propojíš s jejich funkcí v návrhu a později s konkrétním materiálem.

**Stav:** `partial` — Barvy mají vlastní funkci; katalog konkrétních sprejů nebo materiálový nákupní recept není.

**Kód:** `dist/play/workshops.js`.

### RPG-125 · Návrh v kontextu plochy.

Vlastní skicu zkusíš v ilustrativním měřítku konkrétního formátu.

**Stav:** `partial` — Skica má jasný digitální formát; zasazení do kontextu skutečné zdi chybí.

**Kód:** `dist/play/workshops.js`.

### RPG-126 · Tři měřítka stejného slova.

Porovnáš detail, celek a vzdálený pohled a rozhodneš, co zjednodušit.

**Stav:** `implemented` — Detail, celek a pohled z dálky jsou ovládané při stejné vlastní skice.

**Kód:** `dist/play/workshops.js`.

### RPG-127 · Přehrání vlastních tahů.

U digitální skici uvidíš skutečné pořadí, ve kterém vznikala.

**Stav:** `implemented` — Replay používá skutečně zaznamenané pořadí vlastních tahů.

**Kód:** `dist/play/workshops.js`.

### RPG-128 · Plán povolené realizace.

K návrhu připojíš konkrétní plochu, podmínky, přípravu a pracovní postup.

**Stav:** `implemented` — Vlastní plán zaznamená plochu, souhlas/podmínky, přípravu a pracovní čas bez předstírání povolení.

**Kód:** `dist/play/workshops.js`.

### RPG-129 · Zkušební plocha pro nástroj.

V digitálním cvičení prozkoumáš vztah šířky tahu, tempa a překrývání.

**Stav:** `partial` — Šířka, tempo vlastního kreslení a překryv jdou zkoušet; nejde o simulaci konkrétního reálného spreje.

**Kód:** `dist/play/workshops.js`.

### RPG-130 · ★ Zeď si pamatuje proces.

Vlastní uložené fáze návrhu přehraješ od kostry po dokončení, včetně slepých cest.

**Stav:** `partial` — Uložené fáze skic a první/poslední verze jsou zachované; automatické přehrání celé historie fází chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-131 · Výchozí úkol podle skutečné úrovně.

Zadání naváže na zkušenost uživatele a dostupné odborné vedení.

**Stav:** `partial` — Úroveň a přiměřený záměr lze zvolit; odborně přizpůsobená instruktáž není dodaná.

**Kód:** `dist/play/workshops.js`.

### RPG-132 · Označení hudebního podnětu.

V připravené ukázce vybereš moment, na který chceš pohybem reagovat.

**Stav:** `partial` — Vlastní hudební podnět lze zapsat časem; připravená odborná ukázka není.

**Kód:** `dist/play/workshops.js`.

### RPG-133 · Sestavení vlastní fráze.

Z odborně připraveného materiálu si zvolíš přiměřené části a vysvětlíš jejich návaznost.

**Stav:** `external` — Odborně připravený materiál a schválení vhodnosti fráze vyžadují kvalifikovaného spoluautora.

### RPG-134 · Dvě vlastní provedení.

Lokálně porovnáš první a upravenou frázi se stejným hudebním zadáním.

**Stav:** `implemented` — Dvě vlastní videa A/B mají soukromé lokální přehrání a odstranění.

**Kód:** `dist/play/workshops.js`.

### RPG-135 · Záměr před pokusem.

Předem zaznamenáš, na který hudební moment a jakou změnu soustředíš pozornost.

**Stav:** `implemented` — Záměr a konkrétní hudební moment se zapisují před vlastní session.

**Kód:** `dist/play/workshops.js`.

### RPG-136 · Pozorování sdíleného prostoru.

Quest se zaměří na role, střídání a komunikaci při skutečném setkání.

**Stav:** `partial` — Pozorovací zadání a vlastní reflexe prostoru jsou dostupné; zvláštní cypher průchod chybí.

**Kód:** `dist/play/quests.js`, `dist/play/workshops.js`.

### RPG-137 · Reakce lektora u konkrétního momentu.

Získanou připomínku připojíš k příslušné části vlastního záznamu.

**Stav:** `partial` — Skutečně získanou reakci lze zapsat s momentem; nejde o dodanou reakci lektora ani časovou video anotaci.

**Kód:** `dist/play/workshops.js`.

### RPG-138 · Příprava konkrétní session.

Zapíšeš potřebný prostor, hudbu, vybavení a domluvené podmínky.

**Stav:** `implemented` — Příprava session má vlastní podmínky prostoru, vybavení, vedení a pauz.

**Kód:** `dist/play/workshops.js`.

### RPG-139 · Stejná fráze na dva hudební podněty.

Porovnáš, co jsi musel změnit v načasování a záměru.

**Stav:** `implemented` — Dvě vlastní provedení a textové vysvětlení rozdílu podporují porovnání různých podnětů.

**Kód:** `dist/play/workshops.js`.

### RPG-140 · Další krok z pozorování.

Z výsledku session vybereš jeden konkrétní úkol pro příští trénink.

**Stav:** `implemented` — Každá uložená práce vyžaduje jeden konkrétní další pokus.

**Kód:** `dist/play/workshops.js`.

### RPG-141 · Tři přihrádky tvrzení.

Interaktivně třídíš vlastní zápisky na pozorování, doloženou informaci a interpretaci.

**Stav:** `implemented` — Pozorování, doložená informace se zdrojem a vlastní interpretace mají tři samostatná pole.

**Kód:** `dist/play/workshops.js`.

### RPG-142 · Osobní archiv důkazů.

Ke svým tvrzením ukládáš zdroje, citace a otázky, které zůstávají otevřené.

**Stav:** `implemented` — Zdroje a vlastní tvrzení zůstávají s verzemi v osobním archivu a exportu.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-143 · Dvě interpretace jednoho místa.

Sestavíš rozdílná čtení a ukážeš, z čeho každé vychází.

**Stav:** `partial` — Interpretaci lze postavit proti protiotázce; dvě úplná paralelní doložená čtení nemají samostatný editor.

**Kód:** `dist/play/workshops.js`.

### RPG-144 · Vlastní symbol s vysvětlením.

Každý prvek znaku dostane význam, který sám dokážeš popsat.

**Stav:** `partial` — Vlastní znak a význam jsou uložené; samostatný geometrický sestavovač částí znaku chybí.

**Kód:** `dist/play/workshops.js`.

### RPG-145 · Symbol projde protiotázkou.

Zkusíš, jak ho může číst někdo jiný, a podle toho ho upravíš.

**Stav:** `implemented` — Protiotázka jiného čtení je součástí uložené vlastní práce a revize.

**Kód:** `dist/play/workshops.js`.

### RPG-146 · Manifest z deseti řádků na tři.

Postupně zpřesňuješ, co skutečně chceš říct.

**Stav:** `implemented` — První a zpřesněný manifest mají oddělená pole a počítadla řádků.

**Kód:** `dist/play/workshops.js`.

### RPG-147 · Deník změněných názorů.

Zachytíš původní myšlenku, nový podnět a důvod změny.

**Stav:** `implemented` — První tvrzení, nová verze a vysvětlená změna zůstávají v kronice.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-148 · Vlastní tvůrčí hranice.

Pojmenuješ, co chceš ve své práci sdílet, chránit nebo ponechat nedokončené.

**Stav:** `implemented` — Vlastní hranice sdílení a otevřená protiotázka se zapisují a ukládají soukromě.

**Kód:** `dist/play/workshops.js`.

### RPG-149 · Dialog se skutečným člověkem.

Se souhlasem zaznamenáš otázku a odpověď, která tvoji práci posunula.

**Stav:** `partial` — Vlastní dialog lze zaznamenat textem; skutečná osoba ani správa jejího souhlasu nejsou součástí dodávky.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-150 · Porovnání původního a zpřesněného tvrzení.

Výsledná scéna ukáže konkrétní změnu v myšlence i symbolu.

**Stav:** `partial` — Textové verze a metadata znaku lze porovnat; kompletní proměna symbolické scény podle tvrzení chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-151 · Rytmus z vlastního okolí.

Z oprávněně pořízených zvuků nebo ručně zapsaného rytmu vytvoříš podklad pro další úkol.

**Stav:** `partial` — Vlastní rytmický postřeh a soubor lze použít; připravený field-recording sampler není.

**Kód:** `dist/play/field.js`, `dist/play/workshops.js`.

### RPG-152 · Čtyři bary z vlastní skici.

Popíšeš svůj návrh tak, aby text přenesl jeho záměr do jiné disciplíny.

**Stav:** `partial` — Vlastní skica a MC text mohou patřit do propojených děl; přímý specializovaný převodový quest chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-153 · Písmeno z kadence hlasu.

Rytmus vlastního přednesu použiješ jako autorský podnět pro konstrukci tahu.

**Stav:** `implemented` — Výslovně spuštěný vlastní přednes poskytne nejvýše 12 sekund skutečné zvukové křivky; uživatel jí přiřadí vlastní písmeno a význam a uloží vlastní Writer tah. Jde o energii zvuku jako autorský podnět, nikoli rozpoznání řeči či automatickou tvorbu čitelného písmene.

**Kód:** `dist/play/sound.js`, `tests/play-sound.mjs`.

### RPG-154 · Pohyb podle dramaturgie setu.

Propojíš zamýšlenou změnu energie mixu s pohybovou reakcí.

**Stav:** `partial` — DJ dramaturgii a vlastní Breaking reflexi lze propojit; synchronizovaný nástroj není.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-155 · Handstyle jako zvukové gesto.

Vlastní tah ovládne připravený zvukový nástroj a vytvoří krátkou kompozici.

**Stav:** `implemented` — Vlastní tah ovládá výšku skutečně syntetizovaného tónu; vlastní časy a souřadnice lze uložit do inventáře.

**Kód:** `dist/play/sound.js`.

### RPG-156 · Architektura jako tvůrčí omezení.

Tvar nebo rytmus pozorované stavby použiješ při návrhu obrazu, textu nebo setu.

**Stav:** `implemented` — Pozorovaný tvar/negativní prostor stavby je konkrétní pracovní podnět pro vlastní písmeno nebo text.

**Kód:** `dist/play/field.js`, `dist/play/quests.js`.

### RPG-157 · Jeden princip ve třech médiích.

Stejné autorské zadání zpracuješ zvukem, písmem a krátkým textem.

**Stav:** `partial` — Stejný princip lze ručně použít v dílnách; společný třímédiový projektový průchod chybí.

**Kód:** `dist/play/workshops.js`, `dist/play/app.js`.

### RPG-158 · Jeden postřeh, pět odpovědí.

Vybereš pozorovaný detail a zkusíš ho převést do všech pěti disciplín.

**Stav:** `implemented` — Stejná reálná lokalita má pět odlišných zadání; soukromý postřeh lze použít ve všech dílnách.

**Kód:** `dist/play/field.js`.

### RPG-159 · Materiál cestuje mezi dílnami.

Slovo z MC úkolu použiješ ve Writer návrhu a jeho kompozici zase v obalu mixu.

**Stav:** `partial` — Inventář a pracovní stůl materiál propojí; plně přenosné nástrojové vrstvy mezi médii nejsou.

**Kód:** `dist/play/journal.js`, `dist/play/workshops.js`.

### RPG-160 · ★ Dobrovolné velké finále.

Mix, sloka, návrh, pohybová reflexe a manifest vytvoří tvoje vlastní vydání CAISIK.

**Stav:** `partial` — Vlastní vydání kurátoruje více disciplín; nezabaluje zvuk/video ani nevytváří celé multimediální finále.

**Kód:** `dist/play/journal.js`.

### RPG-161 · Časová osa projektu.

Uvidíš skutečné verze, rozhodnutí a návraty k rozpracované práci.

**Stav:** `implemented` — Kronika ukáže skutečné verze, časy a rozhodnutí konkrétní práce.

**Kód:** `dist/play/journal.js`.

### RPG-162 · Volná pracovní plocha.

Poskládáš texty, skici, odkazy a vlastní materiál podle svého způsobu přemýšlení.

**Stav:** `partial` — Pracovní stůl řadí vlastní materiál; libovolné rozmístění na volném plátně chybí.

**Kód:** `dist/play/journal.js`.

### RPG-163 · Mapa souvislostí mezi díly.

Propojíš projekty, které sdílejí motiv, otázku nebo konkrétní tvůrčí rozhodnutí.

**Stav:** `implemented` — Autor vytváří pojmenovaná propojení mezi konkrétními vlastními díly.

**Kód:** `dist/play/journal.js`.

### RPG-164 · Moodboard s původem materiálu.

Každá reference bude mít zdroj a poznámku, k čemu ji používáš.

**Stav:** `partial` — Reference s původem a použitím jsou v inventáři; obrazový prostorový moodboard není.

**Kód:** `dist/play/journal.js`.

### RPG-165 · Zvýraznění skutečné revize.

Označíš přesně ten řádek, tah nebo okamžik, který se mezi verzemi změnil.

**Stav:** `implemented` — Rozdílné řádky skutečných verzí se zvýrazní a zůstane textové vysvětlení změny.

**Kód:** `dist/play/journal.js`.

### RPG-166 · ★ Přenosný osobní sešit.

Vyexportuješ vlastní projekty jako samostatně prohlížitelný balíček s texty a zvolenými přílohami.

**Stav:** `partial` — Samostatné bezpečné HTML obsahuje texty, palety a SVG skici; session audio/video do balíčku nepatří.

**Kód:** `dist/play/journal.js`.

### RPG-167 · Vlastní slovník.

Odborné pojmy doplníš vlastními příklady a odkazy na práci, kde jsi je použil.

**Stav:** `implemented` — Vlastní slovník propojí vlastní vysvětlení s konkrétním dílem.

**Kód:** `dist/play/journal.js`.

### RPG-168 · Uložená podoba scény.

K projektu zůstane paleta, rozmístění symbolů a stav autorské kompozice.

**Stav:** `partial` — Paleta, skica a pracovní metadata se uchovají; volně rozmístěná kompozice všech symbolů světa není.

**Kód:** `dist/play/store.js`, `dist/play/workshops.js`.

### RPG-169 · Kurátorované vlastní portfolio.

Vybereš, které verze chceš představit a co k jejich procesu vysvětlit.

**Stav:** `implemented` — Autor vybírá díla do vlastního kurátorovaného přenosného vydání.

**Kód:** `dist/play/journal.js`.

### RPG-170 · Jeden otevřený další krok.

Každý projekt může končit konkrétní otázkou nebo pokusem pro budoucí pokračování.

**Stav:** `implemented` — Každá uložená verze obsahuje vlastní konkrétní další krok.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-171 · Osobní zvuková atmosféra.

Uživatel si zapne a sestaví zvuk prostředí podle vlastního pracovního záměru.

**Stav:** `implemented` — Uživatel výslovně spouští vlastní procedurální atmosféru a ovládá její zónu, hlasitost i společný STOP.

**Kód:** `dist/play/sound.js`.

### RPG-172 · Zvukové zóny.

Studio, ulice a knihovna dostanou odlišnou, ovladatelnou zvukovou podobu.

**Stav:** `implemented` — Studio, ulice a knihovna mají odlišné autorské syntetické zóny bez předstírání terénních záznamů.

**Kód:** `dist/play/sound.js`.

### RPG-173 · Plynulé zvukové přechody.

Při změně scény navážou připravené vrstvy prostředí na sebe.

**Stav:** `implemented` — Po výslovném zapnutí se zóny plynule prolínají podle pracovního prostoru pomocí skutečných gain ramp.

**Kód:** `dist/play/sound.js`.

### RPG-174 · Vlastní zvukový deník.

Krátký osobní záznam propojíš s projektem, poznámkou a zvoleným způsobem ukládání.

**Stav:** `partial` — Vlastní audio A/B lze nahrát a samostatně stáhnout; trvalý zvukový deník s přílohami chybí.

**Kód:** `dist/play/workshops.js`.

### RPG-175 · Zvuk jako paměť místa.

K vlastnímu záznamu doplníš, co je slyšitelné a co už je tvoje interpretace.

**Stav:** `partial` — Zvukový postřeh se oddělí od interpretace textem; trvalá zvuková příloha u místa není.

**Kód:** `dist/play/field.js`.

### RPG-176 · Rytmická odezva rozhraní.

Vlastním poklepem nastavíš tempo vybraných pracovních nástrojů.

**Stav:** `implemented` — Tempo se vypočte ze skutečných časů vlastních poklepů a řídí pracovní motiv.

**Kód:** `dist/play/sound.js`.

### RPG-177 · Knihovna oprávněných zvukových vrstev.

Připravené stopy budou mít jasný původ a podmínky dalšího použití.

**Stav:** `external` — Připravená zvuková knihovna s doloženými právy není dodaná.

### RPG-178 · Quest ticha.

Krátká zkušenost zaměří pozornost na pauzy, dozvuk a zvuky, kterých si běžně nevšimneš.

**Stav:** `partial` — Vlastní pozorovací zadání může pracovat s tichem; samostatná vedená tichá zkušenost chybí.

**Kód:** `dist/play/quests.js`, `dist/play/field.js`.

### RPG-179 · Vlastní hudební motiv.

Z připravených oprávněných částí nebo vlastního materiálu vytvoříš zvukový podpis.

**Stav:** `implemented` — Vlastní 4/8kroková posloupnost not a pauz vytvoří přehratelný osobní motiv se záznamem do inventáře.

**Kód:** `dist/play/sound.js`.

### RPG-180 · Zvuk závěrečné prezentace.

Pro dokončený projekt sám vybereš, kde má hudba podpořit obraz a kde má ustoupit.

**Stav:** `partial` — Vlastní mix lze poslouchat; zvuková dramaturgie exportovaného závěrečného vydání není.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-181 · Volitelné setkání s odborným spoluautorem.

Skutečný mentor může komentovat konkrétní práci v rámci jasně domluvené služby.

**Stav:** `external` — Skutečný mentor, dohoda o službě a jeho účast nejsou dodané.

### RPG-182 · Výprava ve dvojici.

Dva lidé zpracují stejné místo rozdílně a pak si porovnají rozhodnutí.

**Stav:** `partial` — Trasu a vlastní vydání lze soukromě předat druhému člověku; párový pracovní režim chybí.

**Kód:** `dist/play/field.js`, `dist/play/journal.js`.

### RPG-183 · Zpětná vazba pomocí tří otázek.

Co je čitelné, co vyvolává otázku a co by autor chtěl dál ověřit.

**Stav:** `partial` — Vlastní zpětná vazba a otázky mají prostor; samostatný řízený tříotázkový peer-review nástroj chybí.

**Kód:** `dist/play/quests.js`, `dist/play/workshops.js`.

### RPG-184 · Prezentace procesu.

Sdílený projekt ukáže také první pokus a vysvětlenou změnu.

**Stav:** `partial` — Přenosné vydání ukáže skutečný proces; veřejné publikování s účty a souhlasy není.

**Kód:** `dist/play/journal.js`.

### RPG-185 · Remix se svolením autora.

Uživatel může nabídnout vlastní materiál k přesně vymezenému dalšímu zpracování.

**Stav:** `external` — Licenční svolení k remixu, jeho evidence a veřejný bezpečný sdílecí proces nejsou dodané.

### RPG-186 · Vlastní sada pracovních pomůcek.

Vytvoříš šablonu, paletu nebo cvičení a rozhodneš o jeho sdílení.

**Stav:** `partial` — Vlastní palety a skici lze exportovat; kompletní přenosný autorovaný balíček cvičení chybí.

**Kód:** `dist/play/journal.js`, `dist/play/workshops.js`.

### RPG-187 · Komunitní doplnění mapy.

Návrhy míst projdou ověřením zdrojů a podmínek před veřejným zařazením.

**Stav:** `external` — Komunitní příjem, redakční ověřování a veřejné schválení nových míst nejsou provozované.

### RPG-188 · Dobrovolná výstava pod aliasem.

Sám vybereš díla, doprovodné informace a rozsah zveřejnění.

**Stav:** `partial` — Alias a kurátorský výběr fungují v lokálním vydání; veřejná výstava není služba tohoto webu.

**Kód:** `dist/play/journal.js`.

### RPG-189 · Skutečné příběhy autorů.

Schválené rozhovory ukážou konkrétní postupy, chyby a rozhodnutí lidí z kultury.

**Stav:** `external` — Skutečné autorizované rozhovory a jejich souhlasy nejsou dodané.

### RPG-190 · Společná kompozice z jednotlivých příspěvků.

Každý autor pozná vlastní stopu a uvidí, jak zapadá do celku.

**Stav:** `external` — Víceuživatelská kompozice potřebuje skutečný backend, autorizaci, souhlasy a řešení souběhu.

### RPG-191 · Stejná hra různými způsoby.

Důležité interakce půjdou ovládat dotykem, myší i klávesnicí.

**Stav:** `partial` — Klávesnice má vlastní kreslení, nativní ovládání a navigaci; úplný audit všech zařízení není provedený.

**Kód:** `dist/play/workshops.js`, `dist/play/field.js`, `dist/play/app.js`.

### RPG-192 · Klidný režim zachová význam animací.

Proměnu si prohlédneš po jednotlivých komponovaných fázích s vysvětlením.

**Stav:** `implemented` — Klidný režim nabídne významové statické fáze s vysvětlením.

**Kód:** `dist/selfmade-motion.js`.

### RPG-193 · Intenzita pohybu podle uživatele.

Samostatně omezíš parallax, automatické smyčky nebo reakce na kurzor.

**Stav:** `partial` — Plný/klidný/vypnutý režim funguje; samostatné přepínače parallax/kurzor/smyčky chybí.

**Kód:** `dist/play/app.js`, `dist/selfmade-motion.js`.

### RPG-194 · Pohyb podle možností zařízení.

Množství efektů se přizpůsobí výkonu a neviditelné scény se pozastaví.

**Stav:** `partial` — Neviditelné scény a dokument se pozastavují; adaptivní GPU/performance kvalita není.

**Kód:** `dist/selfmade-motion.js`, `dist/alchemy-hero.js`.

### RPG-195 · Postupné načítání živých obrazů.

Nejprve se zobrazí kvalitní statická kompozice, potřebné pohyblivé vrstvy se doplní při vstupu.

**Stav:** `partial` — Kvalitní originály zůstávají fallback a dílny se importují podle potřeby; všechny SVG překryvy nemají samostatný mediální loading budget.

**Kód:** `dist/selfmade-motion.js`, `dist/play/app.js`.

### RPG-196 · Jasná kontrola každé přílohy.

U vlastního zvuku nebo fotografie uvidíš, kde je uložená, kdo k ní má přístup a jak ji smazat.

**Stav:** `implemented` — Vlastní session média výslovně ukazují místní uložení, stažení a smazání bez uploadu.

**Kód:** `dist/play/workshops.js`, `dist/play/journal.js`.

### RPG-197 · Offline výprava na míru.

Vybereš konkrétní trasu, lekce a potřebná média a před cestou ověříš úplnost balíčku.

**Stav:** `partial` — Původní opt-in textové expedice zůstávají; nový vlastní výběrový offline RPG balíček chybí.

**Kód:** `dist/expeditions/sw.js`, `dist/play/field.js`.

### RPG-198 · Obnova vlastní práce.

Zálohu si nejprve prohlédneš, vybereš projekty k obnovení a zachováš existující verze.

**Stav:** `implemented` — Import má náhled a výběr projektů; sloučení zachová existující díla a rozdílné verze.

**Kód:** `dist/play/store.js`, `dist/play/journal.js`.

### RPG-199 · Každá animace má sdělení.

Její podstatná informace zůstane dostupná jako text, statický rozbor nebo ovladatelné kroky.

**Stav:** `implemented` — Studijní pohyb má textové vysvětlení, statické fáze a ovladatelný průběh.

**Kód:** `dist/selfmade-motion.js`, `dist/art-motion.js`.

### RPG-200 · ★ Uživatel vytvoří vlastní expedici.

Ze svých úkolů, materiálu a ověřených míst sestaví další hratelnou cestu s vlastními pravidly a výstupem.

**Stav:** `partial` — Vlastní quest, trasa a materiál existují; jediná exportovatelná kompletní vlastní expedice s pravidly a lekcemi zatím není.

**Kód:** `dist/play/app.js`, `dist/play/field.js`, `dist/play/journal.js`.

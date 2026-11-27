## 2026-11-18 · Jehla přeskočila
Po intru a hero panelu následuje #needle-street. Hráč spustí vizuální takt, pozná opožděné okno II a najde znak bedny. Použitá ilustrace je existující hero-v2.webp. Stopa je lokální, klíč caisik-needle-street-v1, jediná hodnota diamond. Opakování nepřidává odměnu. Texty používají cs/en/fr. V náhledu ověřen Enter, chybný výběr, správné okno a návrat stopy po reloadu. Poslech ani mobilní hardware se netestovaly.
Další krok: umožnit vrácení obrazu a zvukového úseku na desce, aby hráč při pohybu zpět viděl, kdo bednu nese. Současná scéna používá vizuální takt nezávislý na přehrávači.

## 2026-11-18 · Přetočení desky
Po zjištění opožděného okna se odemkne deska. Posun časové osy vrací výjev v okně II a s volitelným zvukem přehrává střih z prvních 1,36 s skladby Boom Bap Cypher v příslušném směru. Šipky, kolečko na zaměřeném ovladači a tlačítko pro vrácení celého úseku poskytují stejný výsledek. Obsah pozná i hráč bez zvuku. Původní stopa diamond odemkne novou interakci po načtení bez přepisu výsledku. Nová stopa silver-gloves zůstává v tomto prohlížeči.
Další krok: od kurýra odvoď dvě rozpoznatelné cesty, zvuk po schodech a dvojitý kosočtverec v průjezdu. První z nich zapoj do stávajícího výjevu jako hratelnou akci.
Ověření: atlasové kontroly a alchymistický prolog prošly. V Chrome prošel chybný výběr, okno II, klávesa Home na desce a tlačítko pro vrácení úseku. Samostatná simulace ověřila směr a hranice zvukových výřezů, tichý chod, obnovení a francouzštinu. Fyzický dotykový displej a poslech na zařízení zůstávají samostatnou kontrolou.

## 2026-11-18 · Dvě cesty na dvůr
Po odhalení kurýra tlačítko Po stopě kurýra otevře rozcestí. Na schodech hráč zopakuje tři údery na dvou padech pomocí výřezů z Boom Bap Cypher. V průjezdu podle krajních hrotů existujícího artworku TRANSMUTE doplní značku na cihle. Cesty mají vlastní dialog a výsledek ve společném dvoře. Rozcestí zapisuje poslední zvolenou cestu a množinu dokončených cest do caisik-needle-fork-v1. Původní klíče okna a kurýra jsou kompatibilní.
Ověření: prošly atlas, zkouška prologu a sestavení Workeru. V náhledu Chrome prošly oba tiché průchody, chybný výběr a opakování pokusu, Escape s návratem fokusu, obnovení zvolené cesty a průjezd v rámci o šířce 390 px. Poslech na zařízení nebyl součástí zkoušky.
Další krok: na dvoře umožni uložit vlastní rytmus nebo znak do existujícího Blackbooku a ukaž ho hráči po návratu v okně II.

## 2026-11-18 · Přehledný obsah a listování
Společné menu nyní nabízí vyhledávatelný rejstřík 22 kapitol a témat. Kategorie Příběh, Místa, Učení, Tvorba, Archiv a Obchod poskytují krátké názvy a popisy. Nad obsahem je další úkol odvozený z dosavadního místního postupu a přímý návrat do příběhu. Nabídka se otevírá kliknutím, Escape a Zavřít vracejí fokus. Atlasová lišta ukazuje celý název aktuální části, Obsah a nativní Předchozí/Další. Všechny nové texty používají cs/en/fr.
Ověření: šest testů společného menu, test scrollové lišty, atlasové kontroly a build Workeru prošly. V Chrome byly ověřeny diakritické i bezdiakritické hledání, prázdný výsledek a reset, kategorie, přepnutí jazyků, Escape, návrat z Blackbooku a listování atlasem. Rám o šířce 390 px ověřil menu i lištu bez vodorovného přetékání. Fyzický telefon nebyl testován. Posun příběhu dál nadále naváže vlastním otiskem na dvoře.

## 2026-11-18 · Od intra přes rozcestí až za dveře

Hrát první kapitolu vede z úvodní ilustrace přímo na ulici. Hlasový průvodce má vlastní tlačítko. Enter ve vyhledávání obsahu otevře první zobrazený výsledek. Při listování mezi kapitolami krátce přejede přes horní okraj přehyb stránky. Předchozí a Další ponechávají dohledatelnou adresu kapitoly a při ovládání Enterem ověří místo dopadu i v nízkém okně.

Po stopě kurýra otevře rozcestí. Schody a průjezd mají vlastní kreslenou nápovědu. Po správném řešení se otevřou dveře na původní ilustraci alchemy-passage.webp a bedna se dvěma kosočtverci dosedne na zem. Escape vrací na zvolenou stopu a potom na ulici. Starší dokončená cesta se obnoví ve dvoře. Klidný režim zobrazí otevřené dveře bez animace.

V náhledu Chromium prošel vstup do hry s uzavřeným hlasovým panelem, cesta po schodech pomocí Enteru, návrat do uloženého dvora a v rámu o šířce 390 px chybná i správná odpověď na graffiti. V okně 760 × 500 px prošlo hledání „skryte mesto“, listování do Sedmi principů a Frekvence i návrat na předchozí kapitolu. Načtený prohlížeč zachytil animaci přehybu. Kontroly kódu pokrývají také starší postup, opakování, ztlumení pohybu a obě cesty. Fyzický telefon a poslech nebyly součástí tohoto ověření.
Další příběhový krok: vlastní rytmus nebo znak ze dvora uložit do Blackbooku a vrátit do okna II.

## 2026-11-19 · Rytmus na parapetu

Základ změny je nasazená verze 63 s českým hlasovým doprovodem. Na dvoře po kterékoli z obou cest hráč rozloží údery a pauzy do osmi políček. Kurýr přenese rytmus z bedny na parapet. Po uložení do terénního Blackbooku ho tlačítko Vrátit se k oknu II přehraje v ulici a ukáže tuto skladbu světel i bez zvuku. Pozdější kliknutí na okno II přehraje tutéž frázi. Původní Boom Bap Cypher dodává úder, zvuková volba platí pro dvůr i ulici. Texty mají českou, anglickou a francouzskou verzi.

Jeden místní záznam `caisik-needle-imprint-v1` uchovává osm hodnot a dokončený návrat. Zápisník obnovuje počet i zobrazení při změně v jiné kartě a zahrne rytmus do svého exportu JSON. Starší dokončená cesta otevře dvůr s editorem. Při omezeném pohybu zůstává v okně a v zápisníku čitelná celá fráze.

Ověřeno v Chromium od vstupu přes takt, okno II, návrat desky a graffiti až po uložení a návrat do ulice v rámci širokém 390 px. Kontrola potvrdila polohu fokusu, viditelnost pointy a stejný vzor po obnovení. Ve skutečně dekódovaném klipu byly tři údery naplánované 1,02 s od sebe pro kroky 1, 4 a 7. První vzorek nad prahem ±0,04 byl po odstranění výplně zhruba 4 ms od začátku výřezu, před zesílením a výstupem zařízení. Poslech na fyzickém zařízení a měření akustické latence nebyly součástí testu. Kontroly kódu pokrývají také poškozený záznam, starší postup, ztlumení a další jazyky.

Další krok: první vedlejší quest DJ, Poslední metro má swing, v němž se uložený rytmický vzor může vrátit jako součást přechodu pouličního DJ.

## 2026-11-20 · Poslední metro má swing

Po návratu vlastního rytmu do okna II se pod ulicí objeví volitelná stopa. Pouliční DJ potřebuje čtyři údery dveří. Hráč si vzor předvede a zopakuje ho na dvou padech v libovolném tempu. Špatný úder vrátí pokus na začátek. Úspěch otevře dveře a po návratu nahoře DJ přehraje motiv dveří navázaný na osmipolohový rytmus z Blackbooku. Pařížské nástupiště je označené jako herní fikce a jeho pozadí využívá stávající ilustraci průjezdu CAISIK.

Dva odlišné údery pocházejí z výřezu Boom Bap Cypher. Zvuková volba je společná s první kapitolou. Vizuální vzor zůstává čitelný bez zvuku i bez pohybu. Jediný místní záznam `caisik-metro-dj-v1` obsahuje uloženou podobu hráčova rytmu v okamžiku vyřešení. Návrat, opětovné otevření ani přehrání ho nepřičítají podruhé. Rozhraní a dialog jsou česky, anglicky a francouzsky.

Ověřeno v Chromium v rámu 390 px s uloženou kapitolou: chybná odpověď, tiché vyřešení klávesnicí, otevření obou dveří, přehrání uloženého vzoru a zachování přechodu po zavření a opětovném otevření. V prohlížeči sedělo sedm naplánovaných úderů včetně mezer. Digitální nástup měřený z dekódovaného vzorku vyšel přibližně 4 ms po začátku každého výřezu. Poslech a akustická latence na fyzickém telefonu nebyly měřeny.

Další krok: revizor na stejném fiktivním nástupišti může chtít dvě zakončení sloky přes DJův uložený přechod. Jedno zakončení se později vrátí v dialogu jiné postavy.

## 2026-11-21 · Revizor chce šestnáctku

Po vyřešení DJova úkolu se na fiktivním nástupišti otevře Revizor chce šestnáctku. Do dvou řádků lze dopsat vlastní zakončení nebo upravit připravené rýmy. Během psaní si hráč může pustit uložený DJův přechod z Boom Bap Cypher, který také ukazuje údery obrazem. Po odevzdání dopadne razítko a při návratu na ulici DJ použije přesné druhé zakončení v komiksovém dialogu. Escape zavře rozepsaný Blackbook a vrátí fokus na otevírací tlačítko.

Jeden místní záznam `caisik-metro-mc-v1` obsahuje dvojici zakončení a jazyk sloky. Zápis se objeví v terénním Blackbooku a jeho exportu JSON. Přepnutí češtiny, angličtiny a francouzštiny přeloží okolní text, sloka si zachová původní jazyk. Potvrzení téže dvojice nepřidá další položku. V režimu omezeného pohybu je razítko čitelné ihned.

V Chromium v rámu 390 px prošel vstup z uloženého nástupiště, prázdný pokus, doplnění rýmů, úprava obou řádků, odevzdání a návrat k DJovi klávesnicí i bez zvuku. Obě zakončení byla vidět v zápisníku a druhé zůstalo v ulici po obnovení. Sedm úderů doprovodu mělo v dekódovaných datech nástup zhruba 4 ms od okraje výřezu. Fyzický telefon a akustický výstup zůstávají mimo toto ověření.

Další krok: Writer quest Šipka, co zdrhla z piece. Vyber konkrétní tah z existujícího graffiti a propoj zapsanou hráčovu opravu s obalem DJova mixu.

## 2026-11-22 · Šipka, co zdrhla z piece

Po návratu rytmu z dvora pokračuje ulice volitelnou stopou kurýra. Tři panely dovedou hráče od detailu TRANSMUTE přes ústřižek na bedně k opravě hrotu druhého T nad posledním E. Výřez vychází z původního `/assets/atlas/transmute-approved.webp` a dohledatelné vrstvy `letter-t-2`. Přechody zvýrazní nové stopy a respektují místní i systémové omezení pohybu.

Hráč zapne kreslení, táhne od zlatého bodu doprava, nebo tlačítkem zvolí rovný či zahnutý tah. Vypnutí kreslení či Escape vrátí běžné posouvání. Lokální záznam `caisik-transmute-repair-v1` ukládá souřadnice a typ tahu. Stejný tah se vykreslí na Living Wall, v zápisníku a na obalu již získaného DJova přechodu. Opakované uložení zachová jedinou položku. Texty a ovládání mají českou, anglickou a francouzskou verzi.

V náhledu Chromium v rámu 390 px prošel i stávající DJ a revizor. Writer byl ověřen klávesnicí, myší, bez zvuku, s vypnutými animacemi, s návratem fokusu a obnovou stejného tahu. CSS přepíná zachycení dotyku pouze na kreslicím poli. Fyzický dotykový telefon nebyl součástí ověření.

Další krok: Souboj se stínem. Navázat na existující Alchymistovu dílnu pohybu a vrátit hráčovu uloženou sestavu při další návštěvě stejné scény.

## 2026-11-23 · Souboj se stínem

Po vrácení rytmu do okna II se pod Alchymistovou dílnou pohybu objeví výzva. Hráč vybírá krok, otočku a freeze v libovolném pořadí. Druhý stisk pohyb vyřadí, aby ho mohl vložit na jiné místo. V komiksové výměně stín postupně provede zvolenou sekvenci, zatímco tanečník zůstane u tkaničky. Scéna přebírá původní postavu a ukázky pohybu z prologu. Titulky a zvýrazněné pořadí fungují bez zvuku. Omezený pohyb zobrazuje jednotlivé statické pózy.

Tlačítko Nechat sestavu stínu zapíše přesné pořadí do jednoho lokálního záznamu `caisik-shadow-routine-v1` a přidá jedinou položku do Blackbooku a stávajícího exportu. Při další návštěvě Nechat stín zatančit přehraje uloženou sestavu. Přehrávání se zastaví po zavření scény, skrytí stránky nebo odscrollování mimo výjev. České, anglické a francouzské texty používají stávající přepínač jazyků.

V Chromium v rámu 390 px prošla předchozí oprava TRANSMUTE, otevření souboje, přeskupení tlačítky, tři odlišné pózy, přehrání v obou režimech pohybu, uložení do Blackbooku, Escape s obnovením fokusu a přehrání po načtení stránky. Ověření vycházelo z uloženého návratu z dvora.

Další krok: Stejný roh, tři verze. Vrátit do příběhu nesourodé vzpomínky kurýra, DJ a revizora na okno II a hráčův závěr zachovat v mapě.

## 2026-11-24 · Stejný roh, tři verze

Po vrácení rytmu do okna II se pod Soubojem se stínem odemkne porovnání výpovědí. Souboj zůstává volitelný. Kurýr ukáže dvojitý kosočtverec na bedně, DJ zpoždění okna II a revizor stříbrné rukavice. Výjev používá existující CAISIK ilustraci `hero-v2.webp` a navazuje na obrazové stopy z prvního průchodu. Detail lze prozkoumat přímo v obraze nebo tlačítkem. Šipky mění svědka a Escape vrací fokus.

Klíč `caisik-corner-note-v1` ukládá prohlédnuté detaily i vybraný výklad. Po třetím detailu hráč zvolí, co zapíše. Dokončený výklad zůstává pod mapou Hidden City s označením herní fikce, v Blackbooku a jeho exportu. Alchymista u dalších dveří připomene konkrétní zvolený způsob pozorování. Poznámka nepřidává souřadnice. Překlady se přepínají mezi češtinou, angličtinou a francouzštinou.

V Chromium v rámu 390 px prošla repríza Souboje se stínem, prohlídka obrazu myší a ovládání klávesnicí, obnova dvou detailů i dokončeného výkladu, návrat fokusu, shoda mapy a Blackbooku a odpověď Alchymisty. Přepnutí na francouzštinu zachovalo výklad, vypnutí pohybu zachovalo statické stopy. Hra v náhledu proběhla bez zvuku.

Další krok: po vrácení rytmu do okna II otevřít přehled pěti vedlejších stop s viditelným stavem a návratem do rozehrané scény.

## 2026-11-27 · Vedlejší stopy

Po vrácení rytmu se v ulici u okna II objeví Přehled vedlejších stop. V jedné sekci lze otevřít všech pět existujících scén, zjistit, která je dostupná nebo dokončená, a z každé se vrátit přímo na její kartu. Revizor se odemyká dokončením metra. Pokračovat vybírá poslední navštívenou nedokončenou stopu. Přehled zobrazuje skutečné ukládané odměny a u výpovědí počet prohlédnutých detailů.

Klíč `caisik-street-trails-v1` přidává pořadí navštívených scén. Odměna každé stopy zůstává v jejím stávajícím záznamu. Už otevřená scéna se při návratu z přehledu znovu neotevírá a zachová rozpracovaný panel. Po obnovení se vybere správná stopa a načtou její dříve uložené kroky. Rozpracovaný panel Writeru nebo nepředaná sestava stínu žije v otevřené kartě.

V Chromium v rámci širokém 390 px prošel vstup z ulice, všech pět akcí karet, tichý rytmus metra a okamžité odemčení revizora. Ověřeny návraty fokusu, nepřerušený panel Otisk na víku, obnova jednoho detailu výpovědi po načtení, francouzské popisky a přehled s vypnutým pohybem. Teď lze projít první kapitolu a všech pět vedlejších stop z jednoho rozcestí.

Další krok: přidat Pokračovat už k úvodnímu panelu a ověřit hraní od vstupu k rozpracované stopě v jedné cestě.

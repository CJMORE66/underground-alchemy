# CAISIK: skutečné místo, vlastní cesta, tři jazyky

Datum: 27. října 2026. Výsledné slovníky: 2 825 klíčů pro každý ze tří jazyků. Výchozí zdroj: `254091dbd3fdaf9f4d367834cd4881f19bd6c08b`, uložená verze 28. Stack: existující statické HTML/CSS/ES moduly; Three.js, MapLibre a Leaflet zůstávají zachované. Hosting i publikum webu se nemění.

## Co se změnilo

- Trvalé CZ/EN/FR ovládání na 27 existujících stránkách a v nativních aplikačních dialozích, lokalizované HTML včetně alternativních popisů obrázků. Anglické názvy kapitol a samotná autorská písmena v ilustracích zůstávají záměrně zachované.
- Jazyková dílna se 40 praktickými větami ve třech jazycích. Odhalení překladu, vlastní pokus, srovnání dodané věty, opakování, lokální export a samostatné vymazání. Čtenářský režim porovná výslovně vybranou veřejnou větu s místním překladem. Nehodnotí uměleckou kvalitu ani nevymýšlí alternativní překlady.
- Výslovnost pouze na kliknutí a s odpovídajícím místním hlasem zařízení. Není-li místní hlas dostupný, zobrazí se vysvětlení; žádný vzdálený hlas, mikrofon ani upload se nezapne.
- Šest studií a tři přípravné lekce FROM STREET TO SESSION. Celkem 32 objevů a 31 doložených souřadnic. Přístup ke studiím je po předchozí dohodě; nejde o volně přístupnou turistickou atrakci ani partnerství. Body jsou adresní či zveřejněné místní body, nikoli zaměřené vstupy.
- Skutečné mapové půdorysy jsou výchozí. Chybějící výška zůstává nulová, nikoli vymyšlená. Dvanáct vylepšených vlastních modelů je explicitně volitelná, přibližná autorská vrstva. Notre-Dame, Sainte-Chapelle a Saint-Sulpice mají opravené charakteristické proporce a detaily; není to geometrické zaměření staveb.
- Čtyři krátké, reverzibilní přechody při nativním scrollu: stavba → trasa, oko → geometrie, město → rytmus, zvuk → písmo. Sticky navigace používá existující kotvy. Pauza, klidný režim, skrytá karta i zrušení komponenty zastavují práci.
- Explicitní offline balíček expedic nově zahrnuje jazykový runtime, tři slovníky a fráze. Neúspěšná aktualizace zachovává předchozí úplný balíček.

## Skutečné prohlížečové ověření

Použit byl spravovaný preview server a existující Chrome. Šířka 390 × 844 a krátká 844 × 390 byly ověřeny skutečným vykreslením stránky v iframe; nejde o fyzický telefon ani emulaci konkrétního OS.

- Přepnutí CS → FR → EN, jazyková změna napříč otevřenými stránkami a zachování volby při přechodu na `/expeditions/` fungovaly.
- Jazyková dílna zobrazila francouzskou a anglickou větu, vlastní přesný pokus dostal slovní zpětnou vazbu. Mobilní české rozhraní zobrazilo českou a francouzskou větu vedle sebe. Escape zavřel dialog a vrátil fokus na UČIT SE.
- Mobilní kulturní rozcestník filtroval všech šest studií. Terénní režim ukázal skutečnou adresu Urbe, podmínky předchozí domluvy, odkaz na navigaci a vlastní úkol bez povinné animace.
- Skutečný zpětný scroll u přechodu k principům změnil progress na 0.4676 a stroke-dashoffset na 0.2916; scroll vpřed dosáhl 0.7503 a offsetu 0. Oko a geometrie se opravdu rozkreslily, nejde pouze o datový atribut.
- Tento prohlížeč neměl místní francouzský hlas. Kliknutí zobrazilo správný textový fallback a nic neposílalo vzdálené hlasové službě. Úspěšný zvuk konkrétního OS tím není ověřen.

Snímky v `docs/qa/city-languages/` jsou původní browser captures, bez dokreslování UI. Finální profil Notre-Dame má přímo v otevřeném dialogu funkční přepínač CS → FR, přeložené období, metadata i vysvětlení. Některé dřívější snímky zachycují ještě obecnou hlášku o nepřeložených názvech; následná oprava rozlišuje chybějící veřejnou prózu od ponechaných názvů a fragmentů. Nejde o důkaz přehrávané animace ani výkonu GPU.

## Limity a nedodané materiály

Renderování WebGL na fyzickém zařízení, přesné zarovnání autorských 3D modelů se zaměřenými budovami, všechny místní řečové hlasy a dotykový výběr textu na Android/iOS zůstávají samostatné kontroly. Mapová 2D záloha, geometrie a lifecycle jsou pokryté automaticky, prostorové modely jsou otevřeně přibližné. Ceny, kapacita, rezervace, rozhovory a odborné taneční video nevznikly. Výzkumné datum 26. října je datum čtení pramenů, nikoli osobní inspekce.

Uživatelem zvolený Superdesign CLI byl spuštěn s dokumentovaným vypnutím telemetrie. Autentizace nebyla dokončena; žádné nové plátno ani výstup Superdesign proto nevznikly. Úprava používá stávající schválenou identitu a vlastní implementaci.

## Správa a rollback

1. Uprav kanonický obsah a odpovídající výzkumný záznam. Trvalé ID místa drž oddělené od zastávky trasy; `null` souřadnice nepřeváděj na nulu.
2. Uprav tři překlady v odpovídajícím zdrojovém katalogu. Spusť `python tools/build-languages.py` a `python tools/wire-selfmade.py`. Překladové neshody zkontroluj v `docs/i18n/BUILD_REPORT.json`; tento seznam není automatické stylistické rozhodnutí.
3. Spusť testy uvedené v `LANGUAGES_RELEASE_QA.md` a testy dotčených modulů. Nový vlastní obsah uživatele označ před jeho vykreslením.
4. Publikuj jen přesnou ověřenou zdrojovou revizi. Pro návrat z této úpravy znovu nasaď uloženou verzi 28. Nemaž atlas, expedice, Selfmade ani jazyková lokální data; před další migrací umožni export.

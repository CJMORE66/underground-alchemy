# SELFMADE / kontrola 26. 10. 2026

Základ: publikovaná Sites verze 23, commit `65b2f899af9326ec9f5f069288d34d04dac351f5`. Stávající HTML/CSS/ES modules, stejné umístění `dist/`, žádná migrace frameworku ani backendu. Pracovní větev `feature/selfmade-rpg`. Původní obrazy a jejich schválené hashe, 12 míst atlasu, 3 trasy, 7 principů, 8 Living Wall témat, 100 galerijních děl a pět úplných expedic zůstávají zachované.

## Skutečný rozsah

Všech 200 přesných požadavků je v `PLAN.md` a `coverage.json`. Stav po úpravě: **94 funkčních v uvedeném rozsahu, 95 částečných, 1 další vývoj, 10 vyžaduje externí podklady**. Počet zahrnuje i prokazatelně existující funkce, ne 94 údajně zcela nových funkcí. Veřejný plán je `/play/roadmap/`, generovaný nástrojem `tools/build-selfmade-roadmap.py`.

Nový vstup `/play/` obsahuje profil a záměr, pět questů po sedmi krocích, pět vlastních dílen, verzování, inventář a pracovní stůl, soukromý svět a zeď, 32 deduplikovaných zdrojových míst, osobní trasy a postřehy, měření vlastního času, přenosný Blackbook, sedmidílnou vlastní kompozici a procedurální zvukovou dílnu. Vlastní audio/video je podle popisu konkrétního nástroje pouze v otevřené relaci. Nové UI neprezentuje zvukový přehrávač jako hotový DJ mixér nebo ilustraci jako odbornou pohybovou ukázku.

100 galerijních kompozic má samostatnou animovanou konstrukční vrstvu a ovladatelné studium. **Není to kompletní rozdělení každého malovaného detailu původních rastrů.** Zachované specializované hero/logo/principle/TRANSMUTE scény se nepřekreslovaly ani nezdvojovaly.

## Provedené testy

Nezávisle prošlo všech 14 sad: `npm test`, `node tests/expeditions.mjs` (včetně runtime suite), `art-scenes.mjs`, `art-motion.mjs`, `logo-motion.mjs`, `hero-motion.mjs`, `play-store.mjs`, `play-workshops.mjs`, `play-journal.mjs`, `play-field.mjs`, `play-practice.mjs`, `play-sound.mjs`, `selfmade-motion.mjs`, `play-integration.mjs`. Změněné moduly byly po opravách cíleně znovu ověřeny. Syntaxe JS/Python a `git diff --check` prošly.

Po poslední opravě prošly navíc mounted regrese dvou současných Writer/MC dílen i dvou terénních modulů bez doručení storage eventu. Ukládají se jen skutečně změněná pole; odchod nedotčené starší karty nic nepřepisuje. Ve skutečných dvou Chrome kartách po reloadu současně zůstala „QA souběžná poznámka A“ a „QA souběžná cesta B“.

Kontroly zahrnují ochranu poškozeného originálu, vyčerpané a nedostupné úložiště, import s neplatnými poli a prototypy, zachování konfliktních verzí, bezpečné HTML/SVG exporty, skutečné pořadí tahů, zdrojové identity a null souřadnice, vratný motion slider, životní cyklus audia a skrytých panelů. Opožděné `AudioContext.resume()` a `audio.play()` po STOP/Pauze nemají zahájit zvuk. Záznam kadence používá skutečné vzorky úrovně přehrávání a čas souboru; není rozpoznáváním řeči.

## Skutečný prohlížeč

Managed náhled běžel v Chrome na `http://terminal.local:4173/`.

- Vyplněn syntetický alias CAISIK QA a záměr. Writer quest otevřel odpovídající dílnu.
- Klávesnicí vznikly dva skutečné vlastní tahy, uložená první a revidovaná verze s vysvětlením. HUD zobrazil 1 pokus / 1 vysvětlenou revizi; po reloadu Blackbook obsahoval 1 dílo / 2 verze.
- Galerie skutečně obsahovala 100 původních otevíracích tlačítek a 100 samostatných ovladačů studia. Dialog rozlišoval původní malbu a autorský vektorový rozbor.
- Klíč otevřel obě křídla brány, fiktivní průvodce ukázal odpovídající otázku. Klidný režim nastavil `data-motion=off`; návrat obnovil `on`.
- Výslovně spuštěn vlastní procedurální motiv: globální přehrávací panel se zobrazil; STOP jej skryl. Mikrofon nebyl vyžádán ani automaticky spuštěn.
- Osobní trasa obsahovala Rue Dénoyez, skutečnou adresu, původní datum kontroly, zdroj a výslovné upozornění, že pozorování neopravňuje k malování. Navigace bez souřadnic používá vyhledání adresy.
- Responzivní iframe viewporty 390×844, 320×568 a 768×420: naměřené šířky dokumentu a obsahu 375/375, 305/305, 753/753 CSS px po načtení; rozdíl oproti viewportu tvoří svislý scrollbar. Žádné horizontální přetékání dokumentu v kontrolovaném stavu. Skutečný terénní odkaz zpřístupnil adresní oblast bez průchodu animací.

Snímky jsou skutečné rendery, nikoli generované návrhy: [desktop](qa/desktop.jpg), [osobní svět](qa/world.jpg), [mobil a landscape](qa/mobile.jpg). Byly uživateli ukázány před publikací. Dočasná iframe QA stránka není součástí veřejného webu.

## Export a meze ověření

Browser automatizace dvakrát nedoručila událost stažení z `blob:` odkazu, přestože byl odkaz vytvořen. **Netvrdíme úspěšné automatické stažení HTML v tomto prostředí.** Doplněný ruční fallback v rozhraní skutečně zobrazil přesný obsah vydání. Ověřeno: validní začátek HTML, obě verze a vlastní projekt; kopie má 4 300 UTF-8 bajtů a je archivovaná jako [ruční export z UI](qa/blackbook-manual-export.html). DOM test navíc porovnává obsah fallbacku s vytvořeným Blobem. V běžném prohlížeči zůstává nativní odkaz ke stažení.

Nejde o fyzický iPhone/Android test, úplný WCAG audit, zátěžové měření na slabém zařízení nebo skutečnou nahrávací session. OS reduced-motion nebyl přepnut z nastavení systému; ověřen byl vlastní přepínač a programové regresní testy. Živá mikrofonní oprávnění, fyzický taneční pilot a reálný kvalifikovaný feedback nebyly předstírané. Procedurální zvuk není licencovaný hudební archiv ani dokumentární nahrávka místa.

Přístupové a historické údaje přebírají datum existujícího ověření 21. 10. 2026; nové UI z nich nedělá dnešní provozní ověření. Nová vrstva nemá účet, veřejnou komunitu, sdílení uživatelských příloh nebo cloudovou synchronizaci. Nevznikla žádná placená služba či rezervace.

## Správa a rollback

Postup je v `README.md`. Regenerace expedic automaticky spouští idempotentní `tools/wire-selfmade.py`; po ostatních starších generátorech jej spusť samostatně. Rollback publikace na uloženou Sites verzi 23 zachová identitu a publikum. Nevynucuj Git reset a nemaž lokální osobní klíče uživatelů.

# Architektura: rozšíření existujícího CAISIK

## Výchozí stav

Baseline GitHub při přípravě: `04e93d2e2dd29a092fe5995b53bbbf75733ad7e6`, import Sites source `65b2f899af9326ec9f5f069288d34d04dac351f5`. Aktuální kód při zahájení lokální práce znovu audituj. Projekt je buildless HTML/CSS/ES modules, s Python generátorem expedic; některé starší cinematic bundly používají esbuild. To není důvod přepsat současný atlas do Reactu.

Skutečné vstupy: `/#hidden-city`, `/#principles`, `/#frequency`, `/#living-wall`, `/art/`, `/logo/`, `/expeditions/` a `/expeditions/{dj,mc,writer,breaking,knowledge}/`. Existuje dalších 12 `/q/` aliasů; jejich význam čti z routeru. `/q/transmute/` není shortcut na stejnojmenný Living Wall obraz. Původní notebook je dialog, nikoli vymyšlená `/blackbook` route.

Chráněná data: `atlas-saved-places`, `atlas-saved-routes`, `atlas-observations`, `atlas-principle-notes`, `atlas-frequency-draft`, `atlas-motion`, `caisik-expeditions-v1`. Nepřepisuj je prázdným snapshotem, nepřidávej audio do localStorage. Nový RPG stav musí mít verzi, import/export, zjevnou chybu úložiště a bezpečnou migraci.

## Navrhované rozdělení

Názvy následujících modulů jsou návrh; existence se musí ověřit. F01/F02 určí konkrétní umístění a zachovají veřejné URL.

| Vrstva | Odpovědnost |
| --- | --- |
| Profil | Alias, vlastní cíl, přístupnost a soukromé preference |
| Artefakty | Stabilní ID, vlastní práce, verze, zdůvodnění úpravy, původ a licence |
| Quest graph | Předpoklady, úkol, vlastní výstup, zpětná vazba a přenos |
| Osobní svět | Vysvětlitelné vizuální změny odvozené ze skutečných artefaktů |
| Motion manifest | Artwork → zdroj/hash → vrstvy/pivot/masky → význam → fallback |
| Field view | Přímá adresa, podmínky, navigace, jeden úkol, poznámka a alternativa |
| Blackbook | Časová osa, revize, vazby, export/import a pokračování |

Stav „navštívil“ odděl od `draft`, `practised`, `revised` a `feedback_received`. Uživatel může zůstat u jedné disciplíny. Zpětná vazba má původ: vlastní reflexe, AI návrh nebo skutečná osoba. Nevytvářej falešné mentory.

## Motion kontrakt

Navazuj na `dist/alchemy-hero.js`, `dist/caisik-logo.js`, `dist/art-motion.js`, `dist/assets/art-motion/scenes.json` a existující scene buildery. Aktuálně existuje 14 různých SVG scén pro 15 principových/wall umístění, zvlášť hero a logo. Stovka Blackbook obrazů vyžaduje vlastní inventuru; nejde automaticky o stovku kompletně oddělených vrstev.

Každý obrázek v motion inventuře dostane identitu, původní hash, povolenou roli, smysl pohybu, skutečné vrstvy, rozsah transformace, z-order/occlusion, pivot, start/hold/end a statický fallback. Fotografie zůstávají dokumentární — mohou mít anotace, nikoli předstírat vygenerovaný děj jako historický důkaz.

Mentalism musí začít skutečně černým prázdnem, postupně vytvořit svět, podržet čitelnou kompozici a vrátit se do loopu. Rhythm musí otáčet celé kyvadlo kolem skutečného závěsu; žádná nehybná druhá kopie v podkladu. Oběžnice potřebují skutečnou orbitu a správné překrytí, ne náhodné houpání celého PNG. Nedodané clean plates/oddělené figury jsou produkční blokace, ne hotová 3D rekonstrukce.

Runtimy sdílejí preference a lifecycle. Scroll progress je nativní a reverzibilní; UI nesmí být uvězněné v dlouhé scéně. Poskytni quiet/field režim, statický význam, klávesnici/touch, offscreen/hidden pause a cleanup observerů/listenerů/rAF/object URLs.

## První skutečný řez

Writer: vybrat konkrétní cíl → ověřený kontext/místo → vedená ukázka → vlastní skica → paleta/varianta → zpětná vazba → zdůvodněná revize → procesní Blackbook → změna osobní scény odvozená z práce. Terénní realizace je samostatný poctivý stav s ověřenými pravidly, nikdy automaticky „povoleno“.

MC stejnou strukturu prověří na textu a dvou skutečných přednesových verzích. Poté DJ ověří vlastní mix/tracklist/rozhodnutí; Breaking kvalifikovaný materiál a vlastní bezpečnou frázi; Knowledge text/znak/protiargument/zpřesnění. Až potom rozšiř svět, pokročilé přechody a komunitní integrace.

## Média a síť

Nová lokální média vyžadují návrh IndexedDB, limitů, samostatného souhlasu, exportu, retence a mazání. Bez backendu neslibuj cloud, doručení mentorovi nebo sdílenou galerii. Komunita vyžaduje samostatné autentizační/oprávňovací a consent rozhodnutí; loop ji nevymýšlí na pozadí.

#!/usr/bin/env python3
"""Reproduce the normalized expedition content without republishing stale logistics.

Original handoff JSON lives in docs/expeditions/source-content. Operational facts
come only from editorial verification-*.json overrides. No network is used here.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
from copy import deepcopy

ROOT = Path(__file__).resolve().parents[1]

PLACE_IDS = {
    'dj-1': 'univers-sons', 'dj-2': 'betinos-record-shop', 'dj-3': 'le-grand-jeu',
    'dj-4': 'heartbeat-vinyl', 'dj-5': 'la-place', 'dj-6': 'frequence-paris',
    'mc-1': 'scred-boutique', 'mc-2': 'barbes-rochechouart', 'mc-3': 'la-chapelle',
    'mc-4': 'le-grand-jeu', 'mc-5': 'mur-oberkampf', 'mc-6': 'la-place', 'mc-7': 'au-chat-noir',
    'writer-1': 'rue-denoyez', 'writer-2': 'le-grand-jeu', 'writer-3': 'mur-oberkampf',
    'writer-4': '75shop', 'writer-5': 'mur-de-boulogne', 'writer-6': 'mur-de-boulogne',
    'breaking-1': 'la-chapelle', 'breaking-2': 'centquatre', 'breaking-3': 'rue-de-lourcq',
    'breaking-4': 'le-grand-jeu', 'breaking-5': 'belvedere-belleville',
    'breaking-6': 'juste-debout-school-core', 'knowledge-1': 'chuuut-jef-aerosol',
    'knowledge-2': 'cryptik-maruani', 'knowledge-3': 'liberte-egalite-fraternite-fairey',
    'knowledge-4': 'la-madre-secular-2-inti', 'knowledge-5': 'place-frehel-ben',
    'knowledge-6': 'au-chat-noir',
}
PLACE_NAMES = {
    'univers-sons': 'Univers Sons', 'betinos-record-shop': 'Betino’s Record Shop',
    'le-grand-jeu': 'Le Grand Jeu', 'heartbeat-vinyl': 'Heartbeat Vinyl',
    'la-place': 'La Place — Centre culturel hip-hop', 'frequence-paris': 'Fréquence',
    'scred-boutique': 'Scred Boutique', 'barbes-rochechouart': 'Barbès-Rochechouart',
    'la-chapelle': 'La Chapelle — orientační čtvrť', 'mur-oberkampf': 'Le M.U.R. Oberkampf',
    'au-chat-noir': 'Au Chat Noir', 'rue-denoyez': 'Rue Dénoyez', '75shop': '75Shop & Gallery',
    'mur-de-boulogne': 'Le Mur de Boulogne', 'centquatre': 'CENTQUATRE-PARIS',
    'rue-de-lourcq': 'Rue de l’Ourcq', 'belvedere-belleville': 'Belvédère de Belleville',
    'juste-debout-school-core': 'Juste Debout School CORE', 'chuuut-jef-aerosol': 'Jef Aérosol — Chuuut!!!',
    'cryptik-maruani': 'Cryptik — fasáda knihkupectví Maruani',
    'liberte-egalite-fraternite-fairey': 'Shepard Fairey — Liberté, Égalité, Fraternité',
    'la-madre-secular-2-inti': 'INTI — La Madre Secular 2', 'place-frehel-ben': 'Place Fréhel — Ben',
}
ART = {'dj':'012', 'mc':'020', 'writer':'044', 'breaking':'083', 'knowledge':'031'}
PREPARATION = {
    'dj': ['Sluchátka, zápisník a dvě vlastní nebo oprávněně použité nahrávky.', 'Předem napiš, jaké gramofony či kontroler potřebuješ a jak nahraješ vlastní výstup.', 'Ověř konkrétní datum lekce, studio, vybavení, cenu a podmínky exportu přímo u provozovatele.', 'Ponech souvislý blok nejméně dvou hodin na poslech, nahrání a export; obchody jsou volitelné odbočky.'],
    'mc': ['Zápisník, vlastní text, sluchátka a telefon nebo jiný přístroj pro vlastní záznam.', 'Použij vlastní nebo licencovaný beat a měj zálohu textu.', 'Před studiem potvrď techniku a případnou přítomnost technika; pronájem prostoru není hotová produkce.', 'Ponech dvě hodiny na dvě verze přednesu a jejich poslech. Veřejný open mic je dobrovolný bonus.'],
    'writer': ['Skicák, tužka a vlastní slovo; nejdřív navrhni konstrukci a až potom materiál.', 'Připrav paletu dvou výplní, obrysu a jednoho akcentu podle svého návrhu.', 'Před cestou ověř povolený úsek, počasí, pravidla správce a bezpečný převoz materiálu.', 'Ochranu a použití materiálů zvol podle výrobce. Na realizaci, dokumentaci a úklid si ponech dvě a půl hodiny.'],
    'breaking': ['Čisté boty vhodné pro potvrzený povrch, pohodlné oblečení, voda a pauzy.', 'Před lekcí potvrď datum, úroveň, přístupnost, cenu a volné místo přímo se školou.', 'Připrav jednu otázku a jednoduchou frázi, kterou už bezpečně zvládáš; ilustrace není návod techniky.', 'Žádej souhlas před připojením ke skupině i před natáčením. Doporučení k pohybu má dát skutečný lektor.'],
    'knowledge': ['Zápisník pro oddělené poznámky pozorování, výkladu a vlastního záměru.', 'Vyber vlastní text v rozsahu 150–250 slov a připrav konkrétní otázku pro dobrovolnou zpětnou vazbu.', 'Před návštěvou skupiny ověř aktuální termín a jazyk. Veřejné dílo prohlížej ze zpřístupněného prostoru.', 'Ponech nejméně 90 minut v klidu na vlastní text, znak a jejich revizi.'],
}
HOME = {
    'dj': 'Použij dvě vlastní nebo oprávněně použité skladby a dostupný přehrávač či DAW. Dokonči krátký mix, tracklist a tři rozhodnutí doma; nevydávej jej za absolvovanou lekci v pařížském studiu.',
    'mc': 'Pozoruj vlastní okolí, napiš sloku a nahraj dvě verze přednesu dostupným přístrojem. Vysvětli jednu změnu; vystoupení ani placené studio nejsou podmínkou výstupu.',
    'writer': 'Pokud nejsou potvrzené podmínky malování, dokonči na papíře nebo ve vlastním editoru kostru, dvě prostorové varianty, paletu a procesní Blackbook. Venkovní realizaci odlož, nevytvářej náhradní nepovolenou plochu.',
    'breaking': 'Bez potvrzené lekce pracuj s poslechem hudby, poznámkou o rytmickém podnětu a jednoduchou známou reakcí, kterou bezpečně zvládáš. Odbornou reakci lektora označ jako čekající, nikdy ji nenahrazuj AI skóre.',
    'knowledge': 'Vyber vlastní dílo nebo legálně zpřístupněnou reprodukci, odděl pozorování od výkladu a vytvoř text i znak. Dobrovolnou reakci může dát známý; neoznačuj ji za uskutečněný pařížský workshop.',
}
CONTEXT = {
    'dj': 'Tato expedice chápe digging jako vědomou volbu: z poslechu vzniká popis a z popisu rozhodnutí o návaznosti. Nejde o jeden správný styl setu ani povinnost něco koupit.',
    'mc': 'Vlastní hlas tady začíná konkrétním pozorováním a pokračuje rozhodnutím o přednesu. Čtvrť není kulisa pro převzaté soudy a jeden otevřený mikrofon není automaticky rap battle.',
    'writer': 'Čitelná kostra, negativní prostor a pořadí vrstev jsou v této expedici pracovní nástroje pro vlastní rozhodování. Diagram slouží k vysvětlení konstrukce; není hotový podpis cizího writera.',
    'breaking': 'Rytmický kruh na webu pomáhá sledovat hudební změnu. Nezobrazuje správné provedení taneční techniky. Výsledek vzniká bezpečně zvolenou praxí a skutečnou reakcí lektora.',
    'knowledge': 'Knowledge of Self zde používáme jako současnou autorskou cestu od pozorování k přesnějšímu tvrzení. Hermetické obrazy jsou tvůrčí analogie, nikoli doložený původ hip-hopu ani důkaz nadpřirozených účinků.',
}
QUESTIONS = {
 'dj-1':'Co ve skladbě opravdu slyším, když na chvíli schovám její název?', 'dj-2':'Jakou změnu má tato konkrétní návaznost vyvolat?', 'dj-3':'Která tři rozhodnutí drží můj mix pohromadě?',
 'mc-1':'Který vlastní detail nahradí obecný soud o městě?', 'mc-2':'Co v mém textu změní místo pauzy a důrazu?', 'mc-3':'Který jeden slyšitelný problém chci druhým pokusem opravit?',
 'writer-1':'Je moje slovo čitelné ještě před barvou a efekty?', 'writer-2':'Co se stane, když změním pouze mezeru nebo překryv?', 'writer-3':'Jak přizpůsobím návrh skutečné povolené ploše?',
 'breaking-1':'Na který hudební okamžik dokážu vědomě reagovat?', 'breaking-2':'Jak poznám, že v tomto prostoru mohu začít a připojit se?', 'breaking-3':'Jakou jednu změnu dokážu po lekci bezpečně zopakovat?',
 'knowledge-1':'Co na díle vidím a co už je moje přidané vysvětlení?', 'knowledge-2':'Co přesně moje silné slovo znamená v této situaci?', 'knowledge-3':'Co z mého záměru druhý člověk přečte i bez vysvětlování?',
}
NOTICE = {
 'dj-1':'Sleduj nástup rytmu, basy a jednoho motivu; zapisuj konkrétní okamžiky.', 'dj-2':'Všímej si začátků, konců a prostoru mezi nahrávkami, nikoli jen shodného tempa.', 'dj-3':'Označ vstup, změnu energie a konec; porovnej plán se skutečným záznamem.',
 'mc-1':'Zapiš zvuk, gesto a předmět, aniž bys lidem přisuzoval motivy.', 'mc-2':'Sleduj místo nádechu, důležité slovo a srozumitelnost stejného textu.', 'mc-3':'Při poslechu ukaž konkrétní řádek a čas změny, ne obecný dojem vlastní kvality.',
 'writer-1':'Hledej osy tahů, šířky, mezery a to, co zůstane čitelné z dálky.', 'writer-2':'Zakryj efekty a porovnej průhledy, překryvy a kontrast jednotlivých hmot.', 'writer-3':'Sleduj skutečný rozměr, povrch, povolený úsek, průchod a pořadí vrstev.',
 'breaking-1':'Nejdřív označ hudební změnu; obtížnost pohybu není měřítkem tohoto úkolu.', 'breaking-2':'Všímej si značení, využití prostoru a toho, zda ostatní chtějí sdílet praxi.', 'breaking-3':'Zaznamenej přesná slova lektorova doporučení a rozdíl mezi dvěma vlastními pokusy.',
 'knowledge-1':'Odděl viditelný tvar, vlastní asociaci a doložené autorovo vyjádření.', 'knowledge-2':'Všímej si slov, která působí silně, ale neumíš je vysvětlit konkrétně.', 'knowledge-3':'Porovnej cizí čtení znaku s vlastním záměrem; rozdíl nemusí být chyba.',
}
TRANSFER = {
 'dj-1':'Příště použij stejný třívrstvý poslech u skladby jiného stylu a oprav první domněnku.', 'dj-2':'Zkus stejný záměr na jiné dvojici nahrávek a vysvětli, které rozhodnutí bylo třeba změnit.', 'dj-3':'Ze stejných tracků postav jinou posloupnost. Porovnej její účinek se svými třemi původními rozhodnutími.',
 'mc-1':'V jiném místě napiš čtyři nové řádky podle stejné metody a porovnej konkrétnost.', 'mc-2':'Přenes zvolenou práci s pauzou do další vlastní sloky, ne jen do stejné věty.', 'mc-3':'U další sloky si předem zvol jedno kritérium revize a ulož obě verze i důvod změny.',
 'writer-1':'Přenes vybraný konstrukční princip na jiné vlastní slovo bez kopírování cizího podpisu.', 'writer-2':'Zkus zachovat záměr v jiném formátu a s jinou omezenou paletou.', 'writer-3':'Navrhni další verzi podle jednoho konkrétního omezení, které ukázala reálná realizace.',
 'breaking-1':'U jiné skladby najdi nový podnět a prober vhodnou reakci s lektorem.', 'breaking-2':'Stejný postup otázky a souhlasu použij v jiném sdíleném tvůrčím prostoru.', 'breaking-3':'Naplánuj další přiměřený tréninkový krok podle doporučení lektora; limity neřeš obtížnějším trikem.',
 'knowledge-1':'U dalšího obrazu zopakuj dvě oddělené kolonky a vyhledej oporu nejistého výkladu.', 'knowledge-2':'Před sdílením dalšího tvrzení doplň konkrétní význam, zdroj nebo jasné označení domněnky.', 'knowledge-3':'Znak nebo text po čase znovu ukaž jinému dobrovolnému čtenáři a zapiš, co přetrvalo a co se změnilo.',
}
ROUTE_SUMMARIES = {
 'dj':'Od cíleného poslechu přes dvě zkoušky návaznosti k vlastnímu krátkému mixu. Obchody a večerní poslech jsou volitelné; na vlastní práci ponech souvislý blok. Lekci, studio a vybavení potvrzuje jejich provozovatel.',
 'mc':'Z konkrétních detailů čtvrti vznikne vlastní sloka, dvě verze přednesu a vysvětlená revize. Na nahrávání a poslech vyhraď skutečný čas. Veřejný mikrofon je volitelný a závisí na aktuálním programu i pořadateli.',
 'writer':'Od čtení písmen přes vlastní konstrukci a paletu k realizaci na skutečně povoleném úseku. Nákup vychází ze skici; na malování, dokumentaci a úklid zůstává samostatný blok. Nepotvrzené podmínky znamenají variantu na papíře.',
 'breaking':'Od poslechu hudebního podnětu přes respektovanou volnou praxi ke skutečné lekci podle potvrzení školy. Součástí dne jsou pauzy. Cílem je přiměřená vlastní fráze, konkrétní reakce lektora a další krok.',
 'knowledge':'Veřejná díla otevírají otázky pozorování, interpretace a přesnosti vlastních slov. Vyhraď samostatný klidný blok na text a znak; dobrovolnou diskusi podle aktuálního programu lze nahradit vlastní reflexí.',
}
TASK_OVERRIDES = {
 'dj-1':'Přines dvě vlastní skladby a jednu konkrétní otázku k cueingu, scratchi nebo návaznosti. Při potvrzené lekci nech lektora ukázat postup a potom jej sám vyzkoušej.',
 'dj-5':'Nahraj krátký vlastní mix: vstup, tři návazné bloky a závěr. Nejdřív vyzkoušej úroveň záznamu a export na vybavení, které provozovatel skutečně potvrdil.',
 'mc-3':'Z doloženého historického zdroje si připrav poznámku o raných společných jams. Porovnej popsané setkání s dnešní kulturní infrastrukturou; orientační stanice není přesný vstup na zaniklou lokalitu.',
 'mc-6':'Nahraj pracovní sloku, druhý take a čistý export na předem potvrzeném vybavení. Přines vlastní nebo oprávněně použitý beat a kopii textu.',
 'mc-7':'Pokud pořadatel potvrdí prostor pro přednes, připrav krátký vlastní text i a cappella variantu. Bez slotu dokonči stejný výstup vlastním záznamem.',
 'writer-5':'Podle aktuálních informací správce a značení rozliš pozvané autory, pedagogickou sekci a volný úsek. Vyber vhodnou povolenou část; úvodní kurátorovaná stěna není náhradní plocha.',
 'writer-6':'Vyhraď 20 minut na výběr povoleného místa a přípravu, 20 na skicu, 45 na výplně, 35 na obrysy a světla, 20 na opravy a 10 na dokumentaci a úklid.',
 'breaking-1':'Z doloženého historického zdroje vyber příklad propojení tanečníků, DJů, MCs a writerů. Sepiš otázku, kterou chceš ověřit u současného lektora.',
 'breaking-2':'V dostupném prostoru zvol přiměřenou přípravu a jednoduchou známou reakci na rytmus. Před připojením ke skupině se zeptej; respektuj odmítnutí i prostor ostatních.',
 'breaking-6':'Na skutečně potvrzené lekci řekni svoji úroveň a požádej o reakci na jednu jednoduchou sekvenci. Zapiš doporučení i přiměřený další krok.',
 'knowledge-2':'Nejdřív prohlédni formu kaligrafie a potom ji porovnej s vysvětlením galerie. Navrhni vlastní krátkou větu a označ, co je doložený výklad a co tvoje asociace.',
 'knowledge-4':'Porovnej viditelné prvky s výkladem autorského projektu. Nakresli vlastní symbol pochybnosti a důvěry; jejich význam je tvůj autorský záměr, nikoli tvrzení o účinku díla.',
}
CONDITIONS = {
 'univers-sons':'Lekce jen podle potvrzení instruktora. Předem ověř konkrétní vybavení, jazyk, cenu a termín.',
 'betinos-record-shop':'Poslech desek ani konkrétní skladová nabídka nejsou automaticky slíbená služba. Nákup není podmínkou úkolu.',
 'le-grand-jeu':'Volitelná práce s referencemi; ověř aktuální fyzický provoz. Vlastní výsledek musí jít dokončit i bez nákupu.',
 'heartbeat-vinyl':'Potvrď fyzické otevírání a možnost poslechu u obchodu; výběr desek je proměnlivý.',
 'la-place':'Potvrď termín, konkrétní studio, techniku, způsob záznamu a případnou obsluhu. Pronájem prostoru není vedená lekce ani hotový mix.',
 'frequence-paris':'Poslechový podnik není automaticky open decks. Program a podmínky ověř přímo před návštěvou; po alkoholu nepokračuj na kole.',
 'scred-boutique':'Potvrď fyzický provoz prodejny. Návštěva neslibuje setkání s konkrétními umělci ani účast na session.',
 'barbes-rochechouart':'Nezaznamenávej cizí rozhovory nebo rozpoznatelné osoby bez souhlasu; neblokuj průchod.',
 'la-chapelle':'Jde o orientační čtvrť a stanici. Zaniklá historická lokalita není dnešní slíbený tréninkový areál ani přesný vstup.',
 'mur-oberkampf':'Kurátorované dílo studuj z veřejného prostoru. Tato expedice neuděluje souhlas k malování na stěnu.',
 'au-chat-noir':'Ověř konkrétní datum a jazyk programu. Přijetí textu, délku i případný slot určuje pořadatel; nic není rezervované.',
 'rue-denoyez':'Existence graffiti není souhlas k vlastnímu malování. Díla se mění; pozoruj a respektuj okolí.',
 '75shop':'Kupuj podle hotové skici a doporučení výrobce; aktuální provoz a sortiment ověř u obchodu.',
 'mur-de-boulogne':'Na místě rozeznávej přesně povolený úsek a aktuální značení. Komerční organizaci vyjasni zvlášť se správcem; za nevhodného počasí zvol papírovou variantu.',
 'centquatre':'Dostupnost sdíleného prostoru se mění. Otevřená hala není automatická lekce nebo souhlas s placenou akcí; před připojením i natáčením se ptej.',
 'rue-de-lourcq':'Není slíbený organizovaný cypher. Vyber vhodný neblokující prostor a jen známou bezpečnou variantu pohybu.',
 'belvedere-belleville':'Nejprve odpočinek. Na betonu nezkoušej první náročné prvky; natáčej jen se souhlasem a neblokuj veřejný prostor.',
 'juste-debout-school-core':'Škola musí potvrdit aktuální lekci, vhodnou úroveň, kapacitu a cenu. Při nedostupnosti nevymýšlej náhradní battle ani odbornou zpětnou vazbu.',
 'chuuut-jef-aerosol':'Jde o vlastní cvičení pozornosti z veřejného prostoru, nikoli tvrzení o léčebném účinku díla.',
 'cryptik-maruani':'Odděl prohlídku fasády od návštěvy knihkupectví. Vnitřní provoz ověř zvlášť a neslibuj nedělní vstup.',
 'liberte-egalite-fraternite-fairey':'Prohlížej z veřejného prostoru. Odděl doložený autorův záměr od vlastního čtení díla.',
 'la-madre-secular-2-inti':'Ponech si klidný čas na jídlo a vlastní psaní. Symbolické čtení není důkaz nadpřirozených vlastností umění.',
 'place-frehel-ben':'Veřejné dílo použij jako podnět pro vlastní revizi; neslibuje individuální setkání s autorem.',
}

def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

def source_id(url):
    return 'source-' + hashlib.sha256(url.encode()).hexdigest()[:12]

def source_kind(url):
    if any(domain in url for domain in ['wikipedia.org','lefooding.com','infobel.com','cirkwi.com']):
        return 'secondary-reference'
    return 'operator-or-institution'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=ROOT/'docs/expeditions/source-content')
    parser.add_argument('--output',type=Path,default=ROOT/'dist/expeditions/data/expeditions.json')
    args=parser.parse_args()
    source_chapters=load_json(args.source/'chapters.json')
    source_lessons=load_json(args.source/'lessons.json')
    source_routes=load_json(args.source/'routes.json')
    contracts=load_json(args.source/'scene-contracts.json')
    source_registry={}
    places={}
    routes=[]
    for route in source_routes:
        stops=[]
        for index,raw in enumerate(route['stops']):
            ident=raw['id'];place_id=PLACE_IDS[ident]
            for src in raw['sources']:
                source_registry.setdefault(src['url'],{'id':source_id(src['url']),'label':src['label'],'url':src['url'],'kind':source_kind(src['url'])})
            if place_id not in places:
                places[place_id]={'id':place_id,'name':PLACE_NAMES[place_id],'address':raw['address'],'coordinates':None,'sources':[],
                    'access':{'status':'unverified','checkedAt':None,'summary':'Provozní informace vyžadují kontrolu přímo u uvedeného zdroje. Adresa slouží k plánování, nikoli jako ověřený vstup.',
                    'requiresConfirmation':['Konkrétní datum, provoz a podmínky návštěvy.','Přístupnost a případné omezení místa; žádná aktivita není rezervovaná.']}}
            known={s['url'] for s in places[place_id]['sources']}
            places[place_id]['sources'].extend(src for src in raw['sources'] if src['url'] not in known)
            time_match=re.search(r'(\d{1,2}:\d{2})[–-](\d{1,2}:\d{2})',raw['addressLine'])
            if time_match:
                proposed='–'.join(time_match.groups())
                hm=lambda value: int(value.split(':')[0])*60+int(value.split(':')[1])
                duration=max(5,hm(time_match[2])-hm(time_match[1]))
            else:
                proposed='Večer podle potvrzeného programu';duration=90 if ident=='mc-7' else 45
            optional=place_id in {'betinos-record-shop','le-grand-jeu','heartbeat-vinyl','frequence-paris','scred-boutique','75shop'} or ident in {'mc-7','knowledge-6'}
            lesson_number=1 if index<2 else 2 if index<4 else 3
            stops.append({'id':'stop-'+ident,'sourceId':ident,'placeId':place_id,'title':raw['title'],
                'task':TASK_OVERRIDES.get(ident,raw['task']),'transfer':raw['transfer'],
                'conditions':CONDITIONS[place_id],'proposedTime':proposed,'durationMinutes':duration,
                'optional':optional,'lessonId':f'lesson-{route["id"]}-{lesson_number}'})
        routes.append({'id':'route-'+route['id'],'chapterId':route['id'],'title':route['title'],'summary':ROUTE_SUMMARIES[route['id']],'stops':stops})
    lessons=[]
    for raw in source_lessons:
        ident=raw['id'];chapter_id=ident.rsplit('-',1)[0]
        lesson=deepcopy(raw)
        lesson.update({'id':'lesson-'+ident,'sourceId':ident,'chapterId':chapter_id,'question':QUESTIONS[ident],'notice':NOTICE[ident],'transfer':TRANSFER[ident]})
        lessons.append(lesson)
    chapters=[]
    for raw in source_chapters:
        ident=raw['id']
        chapters.append({key:raw[key] for key in ['id','number','label','title','subtitle','teaser','outcome']})
        chapters[-1].update({'goals':[x['objective'] for x in raw['lessons']],'lessonIds':['lesson-'+x['id'] for x in raw['lessons']],
            'routeId':'route-'+ident,'preparation':PREPARATION[ident],'homeAlternative':HOME[ident],
            'context':[{'text':CONTEXT[ident],'sourceIds':[],'kind':'artistic-interpretation'}],
            'art':{'poster':f'/assets/masterworks-v2/{ART[ident]}.webp','layer':f'/expeditions/assets/layers/{ident}.svg',
            'alt':raw['imageAlt']+' Schválená autorská ilustrace CAISIK; nejde o odbornou pohybovou demonstraci.' if ident=='breaking' else raw['imageAlt']+' Schválená autorská ilustrace CAISIK.'}})
    # Verified venue overrides are maintained independently of the original roadbook.
    for path in sorted((ROOT/'docs/expeditions').glob('verification-*.json')):
        override=load_json(path)
        for item in override.get('places',[]):
            if item['id'] not in places:
                raise ValueError(f'{path.name}: unknown place {item["id"]}')
            place=places[item['id']]
            for key in ['name','address','access']:
                if key in item: place[key]=deepcopy(item[key])
            if 'sources' in item:
                place['sources']=[{'label':x['label'],'url':x['url']} for x in item['sources']]
                for src in item['sources']:
                    source_registry.setdefault(src['url'],{'id':source_id(src['url']),'label':src['label'],'url':src['url'],'kind':source_kind(src['url'])})
        for item in override.get('sources',[]):
            source_registry[item['url']]={key:item[key] for key in ['id','label','url','kind']}
        for key,fields in override.get('routeStopOverrides',{}).items():
            found=False
            for route in routes:
                for stop in route['stops']:
                    if stop['sourceId']==key or stop['id']==key:
                        for name,value in fields.items():
                            if name in {'title','task','conditions','proposedTime','durationMinutes','optional','transfer'}:stop[name]=deepcopy(value)
                        if 'sources' in fields:
                            places[stop['placeId']]['sources']=[{'label':x['label'],'url':x['url']} for x in fields['sources']]
                            for src in fields['sources']:
                                source_registry.setdefault(src['url'],{'id':source_id(src['url']),'label':src['label'],'url':src['url'],'kind':source_kind(src['url'])})
                        found=True
            if not found:raise ValueError(f'{path.name}: unknown route placement {key}')
        for key,items in override.get('chapterContexts',{}).items():
            chapter=next((x for x in chapters if x['id']==key),None)
            if chapter is None:raise ValueError(f'{path.name}: unknown chapter {key}')
            chapter['context']=deepcopy(items)+chapter['context']
    culture_path=ROOT/'docs/expeditions/culture-context.json'
    if culture_path.is_file():
        culture=load_json(culture_path)
        for ident,context in culture['chapters'].items():
            chapter=next((x for x in chapters if x['id']==ident),None)
            if chapter is None:raise ValueError(f'Culture context: unknown chapter {ident}')
            chapter['context']=deepcopy(context)
        for item in culture['sources']:
            source_registry[item['url']]={key:item[key] for key in ['id','label','url','kind']}
    # Public source register contains current used venue sources and contextual
    # references, not superseded inherited directories or stale programme URLs.
    active_urls={src['url'] for place in places.values() for src in place['sources']}
    active_context_ids={sid for chapter in chapters for item in chapter['context'] for sid in item['sourceIds']}
    source_registry={url:src for url,src in source_registry.items() if url in active_urls or src['id'] in active_context_ids}
    for contract in contracts:
        for state in contract['states']:
            if 'lessonId' in state:
                state['sourceLessonId']=state['lessonId'];state['lessonId']='lesson-'+state['lessonId']
        contract['assets']=[f'/assets/masterworks-v2/{ART[contract["id"]]}.webp',f'/expeditions/assets/layers/{contract["id"]}.svg']
    result={'schemaVersion':1,'chapters':chapters,'lessons':lessons,'places':list(places.values()),'routes':routes,'sceneContracts':contracts,
        'sources':list(source_registry.values()),'mediaStatus':{'artwork':'approved-existing-caisik-illustrations','sourceMasters':'Stav importu původních masterů uvádí samostatný protokol grafiky; malé výřezy nejsou produkční mastery.',
        'recordedInterviews':False,'licensedAudioExamples':False,'qualifiedDanceDemonstration':False,'partnerships':False,'reservations':False,'accountSync':False,'realParticipantPilot':False,
        'missing':['Licencované komentované audio ukázky a skutečné rozhovory.','Odborná taneční demonstrace a kvalifikovaný pohybový spoluautor.','Skutečná partnerská dohoda, potvrzené rezervace a pilot s účastníkem.','Přihlášení a synchronizace účtu; osobní přílohy se na server nenahrávají.'],
        'notes':['Lekce jsou původní autorská cvičení, nikoli odborně certifikovaný kurz.','Ilustrace nejsou dokumentární fotografie skutečných míst nebo lidí.','Návrhy časů jsou plán tvůrčího dne; aktuální provoz je samostatně označen u místa.']}}
    assert len(chapters)==5 and len(lessons)==15 and sum(len(r['stops']) for r in routes)==31
    assert len(places)==23
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Imported 5 expeditions, 15 complete lessons, 23 places and 31 route placements → {args.output}')

if __name__=='__main__':main()

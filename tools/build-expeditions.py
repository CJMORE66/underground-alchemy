"""Render the five CAISIK expeditions as complete, usable static HTML.

The runtime progressively enhances the same native content. This builder never
rewrites the existing atlas, approved artworks, or their animation code.
"""
from pathlib import Path
from html import escape
from urllib.parse import urlencode, urlsplit
import argparse
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
OUT = DIST / 'expeditions'
DATA = OUT / 'data/expeditions.json'
ORDER = ['dj', 'mc', 'writer', 'breaking', 'knowledge']
ORIGIN = 'https://caisik-underground-alchemy.caisik.chatgpt.site'
SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)


def h(value):
    return escape(str(value if value is not None else ''), quote=True)


def text(value):
    if isinstance(value, dict):
        return str(value.get('text') or value.get('summary') or value.get('title') or '')
    return str(value if value is not None else '')


def paragraphs(value, cls=''):
    if not value:
        return ''
    values = value if isinstance(value, list) else re.split(r'\n\s*\n', text(value))
    return ''.join(f'<p{f" class={chr(34)}{h(cls)}{chr(34)}" if cls else ""}>{h(text(v))}</p>' for v in values if text(v).strip())


def bullets(values, cls='', ordered=False):
    if not values:
        return ''
    if isinstance(values, str):
        values = [values]
    tag = 'ol' if ordered else 'ul'
    return f'<{tag} class="{h(cls)}">' + ''.join(f'<li>{h(text(v))}</li>' for v in values) + f'</{tag}>'


def safe_url(value):
    value = str(value or '')
    if value.startswith('/') and not value.startswith('//'):
        return value
    if value.startswith('#'):
        return value
    if urlsplit(value).scheme == 'https':
        return value
    raise ValueError(f'Unsafe or unsupported URL: {value}')


def anchor(url, label, cls='', external=False, extra=''):
    url = safe_url(url)
    external_attrs = ' target="_blank" rel="noopener noreferrer"' if external else ''
    return f'<a href="{h(url)}"{f" class={chr(34)}{h(cls)}{chr(34)}" if cls else ""}{external_attrs}{extra}>{h(label)}</a>'


def svg_layer(ident):
    path = OUT / f'assets/layers/{ident}.svg'
    # The portable demo used HTML-style boolean data attributes. Normalize them
    # before XML validation; never bypass validation or run source-side scripts.
    source = re.sub(r'\b(data-[a-z][a-z0-9-]*)(?=\s|/?>)', r'\1=""', path.read_text())
    svg = ET.fromstring(source)
    assert svg.tag == f'{{{SVG_NS}}}svg', path
    forbidden = {'script', 'foreignObject', 'animate', 'animateTransform'}
    ids = {}
    for node in svg.iter():
        assert node.tag.split('}')[-1] not in forbidden, path
        if 'id' in node.attrib:
            ids[node.attrib['id']] = f'exp-{ident}-{node.attrib["id"]}'
    for node in svg.iter():
        for name, value in list(node.attrib.items()):
            assert not name.lower().startswith('on'), (path, name)
            if name.split('}')[-1] == 'href':
                assert value.startswith('#'), (path, value)
            if name == 'id':
                node.attrib[name] = ids[value]
            else:
                value = re.sub(r'url\(#([^\s)]+)\)', lambda m: f'url(#{ids.get(m[1], m[1])})', value)
                if value.startswith('#') and value[1:] in ids:
                    value = '#' + ids[value[1:]]
                node.attrib[name] = value
    svg.set('class', 'exp-diagram-svg')
    svg.set('aria-hidden', 'true')
    svg.set('focusable', 'false')
    return ET.tostring(svg, encoding='unicode')


def chapter_url(chapter):
    return '/expeditions/' + chapter['id'] + '/'


def chapter_title(chapter):
    return ' '.join(str(chapter['title']).split())


def split_title(value):
    return '\n'.join(f'<span>{h(line)}</span>' for line in str(value).split('\n'))


def image_art(art):
    poster = art.get('poster') or art.get('src')
    registry = json.loads((DIST / 'art/artworks.json').read_text())
    match = next((a for a in registry if a['image'] == poster), {})
    return {**art, 'src': poster, 'width': match.get('width',1536), 'height': match.get('height',1024)}


def header(current):
    return f'''<a class="exp-skip" href="#exp-main">Přejít na obsah</a>
<header class="exp-header"><a class="exp-brand" href="/" aria-label="CAISIK Underground Alchemy — hlavní web"><img src="/assets/logo/caisik-signature.webp" width="1942" height="809" alt="CAISIK Underground Alchemy" decoding="async"></a>
<nav class="exp-nav" aria-label="Hlavní navigace">{anchor('/expeditions/', 'EXPEDICE', extra=' aria-current="page"' if current == 'overview' else '')}{anchor('/#hidden-city', 'HIDDEN CITY')}{anchor('/#frequency', 'FREQUENCY')}{anchor('/art/', 'BLACKBOOK')}</nav>
<button id="exp-mode" class="exp-mode" type="button" aria-pressed="false">Terénní režim</button></header>'''


def hero(chapter=None):
    if chapter:
        title = chapter['title']
        lead = chapter['subtitle']
        eyebrow = f'PARIS / EXPEDICE {chapter["number"]:02d} / {chapter["label"]}'
        outcome = chapter['outcome']
        art = image_art(chapter['art'])
        goals = chapter.get('goals', [])
        actions = anchor('#story', 'Vstoupit do příběhu ↓', 'exp-button') + anchor('#route', 'Jít rovnou na trasu ↗', 'exp-text-link', extra=' data-mode="field"')
    else:
        title = 'POZNEJ JAZYK.\nVYTVOŘ ODPOVĚĎ.'
        lead = 'Pět pařížských expedic. Skutečná místa, vysvětlená praxe a vlastní práce, kterou má smysl zkusit znovu.'
        eyebrow = 'CAISIK UNDERGROUND ALCHEMY / PARIS'
        outcome = 'DJ · MC · WRITER · BREAKING · KNOWLEDGE'
        art = {'src': '/assets/masterworks-v2/081.webp', 'width': 1536, 'height': 1024, 'alt': 'Autorská CAISIK ilustrace mikrofonu, vinylu, spreje a tenisky; není fotografií místa ani ukázkou techniky.'}
        goals = ['Pochop souvislost.', 'Vyzkoušej ji na vlastní práci.', 'Vysvětli, co změníš příště.']
        actions = anchor('#choose', 'Vybrat svoji expedici ↓', 'exp-button') + anchor('#story', 'Projít pět příběhů ↗', 'exp-text-link')
    return f'''<section class="exp-hero"><div class="exp-hero-copy"><p class="exp-eyebrow">{h(eyebrow)}</p><h1 class="exp-title">{split_title(title)}</h1><p class="exp-lead">{h(lead)}</p><p class="exp-outcome">{h(outcome)}</p><div class="exp-actions">{actions}</div>{bullets(goals, 'exp-goals')}</div><figure class="exp-hero-art"><img src="{h(safe_url(art['src']))}" alt="{h(art.get('alt', 'Autorská CAISIK ilustrace; nikoli dokumentace skutečného místa.'))}" width="{h(art.get('width',1536))}" height="{h(art.get('height',1024))}" fetchpriority="high" decoding="async"><figcaption class="exp-art-caption">AUTORSKÁ ILUSTRACE / CAISIK</figcaption></figure></section>'''


def paths(chapters, current='overview'):
    return '<section id="choose" class="exp-paths" aria-labelledby="exp-paths-title"><div class="exp-section-heading"><p class="exp-eyebrow">PĚT VSTUPŮ / PĚT VLASTNÍCH VÝSTUPŮ</p><h2 id="exp-paths-title">Vyber podle toho, co chceš vytvořit.</h2></div><div role="list">' + ''.join(
        f'<article class="exp-path" role="listitem"><span class="exp-path-number">{c["number"]:02d}</span><div><p class="exp-label">{h(c["label"])}</p><h3>{anchor(chapter_url(c), chapter_title(c), extra=" aria-current=\"page\"" if c["id"] == current else "")}</h3></div><p>{h(c["outcome"])}</p>{anchor(chapter_url(c), "Vstoupit ↗", "exp-text-link")}</article>' for c in chapters
    ) + '</div></section>'


def story_stage(chapters):
    scenes = []
    for index, chapter in enumerate(chapters):
        art = image_art(chapter['art'])
        image_attr = 'src' if index == 0 else 'data-src'
        scenes.append(f'''<div class="exp-scene{' is-active' if index == 0 else ''}" data-scene="{h(chapter['id'])}" aria-hidden="true"><div class="exp-art"><img {image_attr}="{h(safe_url(art['src']))}" alt="" width="{h(art.get('width',1536))}" height="{h(art.get('height',1024))}" loading="{'eager' if index == 0 else 'lazy'}" decoding="async"><p class="exp-art-caption">Autorská ilustrace a výukový diagram; nejde o záznam skutečné lekce.</p></div><div class="exp-diagram">{svg_layer(chapter['id'])}</div><span class="exp-scene-label">{h(chapter['label'])} / {h(chapter['outcome'])}</span></div>''')
    return '<aside id="exp-stage" class="exp-stage" aria-label="Ilustrovaný rozbor"><div class="exp-stage-inner">' + ''.join(scenes) + f'</div><div class="exp-stage-progress"><p id="exp-phase">{h(chapters[0]["label"])} / Pozoruj → vytvoř → zpřesni</p><progress id="exp-progress" max="1" value="0" aria-label="Průběh ilustrovaného příběhu"></progress></div></aside>'


def source_links(items, sources, cls='exp-source-links'):
    resolved = [sources[i] if isinstance(i,str) else i for i in items if not isinstance(i,str) or i in sources]
    return '<ul class="'+h(cls)+'">'+''.join('<li>'+anchor(s['url'],s.get('label') or s.get('title') or s['url'],external=True)+'</li>' for s in resolved)+'</ul>' if resolved else ''


def context_blocks(chapter, sources):
    labels = {'documented-fact':'Doložený kontext','historical-evidence':'Doložený kontext','artistic-interpretation':'Autorské čtení','original-editorial-exercise':'Tvůrčí zadání'}
    return ''.join(f'<div class="exp-context"><p class="exp-label">{h(labels.get(item.get("kind"),"Kontext a souvislosti"))}</p><p>{h(item["text"])}</p>{source_links(item.get("sourceIds",[]),sources)}</div>' for item in chapter.get('context',[]))


def preparation(chapter, sources):
    return f'''<section id="preparation" class="exp-preparation"><p class="exp-eyebrow">PŘIPRAV SE / DEJ TVORBĚ SKUTEČNÝ ČAS</p><h2>Než vyrazíš.</h2><div class="exp-preparation-grid"><div><h3>Co si připravit</h3>{bullets(chapter['preparation'])}</div><div><h3>Když plán nevyjde</h3><p>{h(chapter['homeAlternative'])}</p>{context_blocks(chapter,sources)}</div></div></section>'''


def lesson_step(chapter, lesson, index, sources):
    return f'''<section id="{h(lesson['id'])}" class="exp-step" data-story-step data-chapter="{h(chapter['id'])}" data-phase="{index}"><p class="exp-eyebrow">{h(chapter['label'])} / LEKCE {index+1:02d} Z 03</p><h2 class="exp-step-title">{h(lesson['title'])}</h2><p class="exp-label">OTÁZKA</p><p class="exp-question">{h(lesson['question'])}</p><p class="exp-objective"><strong>Po téhle lekci:</strong> {h(lesson['objective'])}</p><h3>Souvislost</h3><p>{h(lesson['why'])}</p><h3>Kam zaměřit pozornost</h3><p>{h(lesson['notice'])}</p><div class="exp-example"><p class="exp-label">VYSVĚTLENÁ AUTORSKÁ UKÁZKA</p><p>{h(lesson['example'])}</p></div><h3>Tvůj pokus</h3>{bullets(lesson['steps'],'exp-steps',ordered=True)}<h3>Zpětná vazba</h3>{bullets(lesson['check'],'exp-checks')}<div class="exp-transfer"><p class="exp-label">PŘENOS / DALŠÍ SITUACE</p><p>{h(lesson['transfer'])}</p><p><strong>Vlastní výstup:</strong> {h(lesson['artifact'])}</p>{anchor('#blackbook','Zachytit vlastní rozhodnutí ↗','exp-text-link')}</div><details class="exp-lesson-details"><summary>Další varianta pro zkušenější</summary><p>{h(lesson['advanced'])}</p></details>{source_links(lesson.get('sourceIds',[]),sources)}</section>'''


def overview_story(chapters, lessons, sources):
    steps=[]
    for chapter in chapters:
        lesson_list=''.join(f'<li>{anchor(chapter_url(chapter)+"#"+ident,lessons[ident]["title"])}</li>' for ident in chapter['lessonIds'])
        steps.append(f'''<section id="story-{h(chapter['id'])}" class="exp-step" data-story-step data-chapter="{h(chapter['id'])}" data-phase="0"><p class="exp-eyebrow">{chapter['number']:02d} / {h(chapter['label'])}</p><h2 class="exp-step-title">{h(chapter_title(chapter))}</h2><p>{h(chapter['subtitle'])}</p>{context_blocks(chapter,sources)}<p class="exp-label">TŘI CÍLE</p>{bullets(chapter['goals'],'exp-checks')}<h3>Tři lekce. Jeden vlastní výstup.</h3><ol class="exp-lesson-links">{lesson_list}</ol><p class="exp-outcome">{h(chapter['outcome'])}</p><div class="exp-actions">{anchor(chapter_url(chapter),"Otevřít celou expedici ↗","exp-button")}{anchor(chapter_url(chapter)+"#route","Adresy a vlastní praxe →","exp-text-link",extra=' data-mode="field"')}</div></section>''')
    return '<section id="story" class="exp-story" aria-label="Pět tvůrčích příběhů">'+story_stage(chapters)+'<div class="exp-story-copy">'+''.join(steps)+'</div></section>'


def route_section(chapter, route, places, sources):
    stops=[]
    labels={'verified':'Provozní informace ověřena','partial':'Ověřeno částečně','unverified':'Provoz je nutné potvrdit'}
    for index,stop in enumerate(route['stops']):
        place=places[stop['placeId']]
        access=place['access']
        evidence=labels[access['status']]
        if access.get('checkedAt'):
            evidence+=' · '+'. '.join(reversed(access['checkedAt'].split('-')))
        next_id=route['stops'][index+1]['id'] if index+1<len(route['stops']) else ''
        maps='https://www.google.com/maps/search/?'+urlencode({'api':'1','query':place['address']})
        next_button=f'<button type="button" class="exp-button exp-secondary" data-next-stop="{h(next_id)}" value="{h(next_id)}">Další místo →</button>' if next_id else anchor('#blackbook','Vrátit se ke své práci →','exp-button exp-secondary')
        atlas_link=anchor('/#hidden-city','Pokračovat v Hidden City ↗','exp-text-link') if place['id'] in {'la-place','mur-oberkampf','centquatre','saint-sulpice','flamel-house','shakespeare-company'} else ''
        timing=f'<p class="exp-label">NAVRŽENÝ ČAS: {h(stop["proposedTime"])} · {h(stop["durationMinutes"])} MIN</p>' if stop.get('proposedTime') else ''
        optional='VOLITELNÁ ODBOČKA' if stop.get('optional') else 'HLAVNÍ PRAXE'
        stops.append(f'''<article id="{h(stop['id'])}" class="exp-stop" data-stop-id="{h(stop['id'])}" data-place-id="{h(place['id'])}"><div class="exp-stop-top"><div><p class="exp-label">{index+1:02d} / {h(optional)}</p><h3>{h(stop['title'])}</h3><address>{h(place['address'])}</address></div><div>{timing}<p class="exp-evidence">{h(evidence)}</p></div></div><div class="exp-stop-body"><div><p><strong>Jeden úkol na místě</strong></p><p>{h(stop['task'])}</p><p><strong>Přesun:</strong> {h(stop['transfer'])}</p></div><div><p><strong>Přístup a podmínky</strong></p><p>{h(access['summary'])}</p>{bullets(access.get('requiresConfirmation',[]))}<p>{h(stop['conditions'])}</p>{source_links(place['sources'],sources)}</div></div><div class="exp-stop-actions">{anchor(maps,'Navigace podle adresy ↗','exp-text-link',external=True)}{anchor('#'+stop['lessonId'],'Otevřít související lekci','exp-text-link')}{atlas_link}{next_button}{anchor('#blackbook','Poznámka do Blackbooku ↗','exp-text-link')}</div></article>''')
    return f'''<section id="route" class="exp-route"><div class="exp-route-head"><p class="exp-eyebrow">TERÉN / MÍSTA JSOU ZAČÁTEK, VLASTNÍ PRÁCE JE CÍL</p><h2>{h(route['title'])}</h2><p>{h(route['summary'])}</p><p class="exp-route-note">Časy níže jsou návrh tvůrčího dne, ne rezervace ani potvrzení otevírací doby. Navigace vyhledá adresu; neurčuje ověřený vstup do budovy.</p></div>{''.join(stops)}</section>'''


def overview_routes(chapters,routes):
    return '<section id="route" class="exp-route"><p class="exp-eyebrow">DO ULICE / ADRESY BEZ ČEKÁNÍ NA ANIMACI</p><h2>Vyber si svoji praktickou trasu.</h2>'+''.join(f'<article class="exp-stop"><div class="exp-stop-top"><div><p class="exp-label">{h(c["label"])}</p><h3>{h(routes[c["routeId"]]["title"])}</h3></div>{anchor(chapter_url(c)+"#route","Adresy a podmínky ↗","exp-button exp-secondary",extra=" data-mode=\"field\"")}</div><p>{h(routes[c["routeId"]]["summary"])}</p></article>' for c in chapters)+'</section>'


def project_section(chapter,lessons):
    return f'''<section class="exp-project"><p class="exp-eyebrow">VLASTNÍ TVORBA / ODNES SI ROZHODNUTÍ</p><h2>{h(chapter['outcome'])}</h2><p>Dokončení zastávky není důkaz dovednosti. Uchovej svůj první pokus, jednu vysvětlenou změnu a další krok.</p><ol>'''+''.join(f'<li>{h(lessons[ident]["artifact"])}</li>' for ident in chapter['lessonIds'])+f'''</ol><div class="exp-actions">{anchor('#blackbook','Otevřít procesní Blackbook ↓','exp-button')}{anchor('/#frequency','Text a vlastní nahrávka ve Frequency ↗','exp-text-link') if chapter['id'] in {'mc','dj'} else anchor('/#living-wall','Pokračovat v Living Wall ↗','exp-text-link')}</div></section>'''


def blackbook(chapters,chapter=None):
    select=''
    if chapter is None:
        select='<label for="exp-note-chapter">Ke které expedici píšeš?</label><select id="exp-note-chapter" name="chapter">'+''.join(f'<option value="{h(c["id"])}">{h(c["label"])} / {h(chapter_title(c))}</option>' for c in chapters)+'</select>'
    fields=[('work','První pokus / vlastní práce','Text, popis skici, struktura mixu nebo poznámky k vlastní frázi.'),('revision','Druhá verze / vysvětlená úprava','Co konkrétně jsi změnil a co sis při porovnání všiml?'),('decision','Tvoje rozhodnutí','Pojmenuj tři rozhodnutí. S čím souvisejí a proč sis je vybral?'),('feedback','Zpětná vazba','Vlastní poslech nebo skutečná reakce posluchače či lektora. Rozliš, co opravdu zaznělo.'),('nextStep','Jeden další krok','Co zkusíš jinak při dalším pokusu?')]
    if chapter and chapter['id']=='dj': fields.append(('tracklist','Tracklist / vlastní mix','Pořadí skladeb, čas přechodů a místo, kde máš uložen svůj export.'))
    if chapter and chapter['id']=='writer': fields.append(('palette','Paleta / vrstvy / povolená plocha','Výplně, obrys, akcent, pořadí vrstev a konkrétní podmínka povolení. Skicu a fotky si uchovej u sebe.'))
    if chapter and chapter['id']=='knowledge': fields.append(('symbol','Vlastní znak / zpřesněná myšlenka','Popiš svůj znak, původní výklad a co se po otázkách změnilo.'))
    inputs=''.join(f'<div class="exp-note-field"><label for="exp-note-{key}">{h(label)}</label><textarea id="exp-note-{key}" name="{key}" data-note-field="{key}" rows="5" maxlength="12000" placeholder="{h(placeholder)}"></textarea></div>' for key,label,placeholder in fields)
    return f'''<section id="blackbook" class="exp-blackbook"><div><p class="exp-eyebrow">TVŮJ PROCES / TVOJE ROZHODNUTÍ</p><h2>BLACKBOOK.</h2><p>{h(chapter['outcome']) if chapter else 'Uchovej postup, první pokus i jeho revizi.'}</p><p>Poznámky patří tobě. Ukládají se v tomto prohlížeči a můžeš je exportovat. Zvuk a fotografie se sem nenahrávají; své soubory uchovej samostatně.</p><p>Chceš si nahrát vlastní přednes? {anchor('/#frequency','Otevři existující Frequency ↗','exp-text-link')} a stáhni si každý take.</p></div><div><form id="exp-blackbook-form">{select}<div class="exp-note-grid">{inputs}</div><div class="exp-actions"><button id="exp-save" type="submit" class="exp-button">Uložit poznámky ↗</button><button id="exp-export" type="button" class="exp-button exp-secondary">Export Blackbooku ↓</button></div></form><p id="exp-storage-status" role="status">Uložení se ověří po načtení. Pro jistotu si poznámky exportuj.</p><div class="exp-actions"><button id="exp-export-text" class="exp-button exp-secondary" type="button">Stáhnout textový průvodce ↓</button><button id="exp-save-offline" class="exp-button exp-secondary" type="button">Uložit pro cestu bez připojení ↓</button></div><p id="exp-export-status" role="status" aria-live="polite"></p><a id="exp-export-ready" class="exp-button exp-secondary" hidden download>Stáhnout připravený soubor ↓</a><p id="exp-offline-status" role="status">Bez připojení funguje jen obsah, který už máš uložený. Externí mapy a stránky provozovatelů potřebují síť.</p><noscript><p class="exp-evidence">Bez JavaScriptu můžeš číst všechny lekce a adresy. Poznámky napiš do svého souboru nebo si stránku vytiskni; tlačítka ukládání potřebují JavaScript.</p></noscript></div></section>'''


def links_section():
    return '<section id="exp-links" class="exp-links"><h2>Pokračuj ve vlastním světě.</h2>'+''.join(anchor(url,label) for url,label in [('/#hidden-city','Hidden City ↗'),('/#principles','Seven Principles ↗'),('/#frequency','Frequency ↗'),('/#living-wall','Living Wall ↗'),('/art/','100-work Blackbook ↗')])+'</section>'


def sources_section(chapters,routes,places,sources):
    ids={s['id'] for c in chapters for stop in routes[c['routeId']]['stops'] for s in places[stop['placeId']]['sources'] if s.get('id')}
    ids.update(ident for c in chapters for context in c.get('context',[]) for ident in context.get('sourceIds',[]))
    return '<section id="sources" class="exp-sources"><p class="exp-eyebrow">ZDROJE / FAKT, VÝKLAD A VLASTNÍ POKUS</p><h2>O co se můžeš opřít.</h2><p>Provozní informace jsou označené u jednotlivých míst. Výukové příklady jsou původní autorská zadání; ilustrace nejsou historické fotografie ani doklad skutečné lekce.</p><details><summary>Otevřít zdrojový registr této expedice</summary>'+source_links(sorted(ids),sources)+'</details></section>'


def footer(media):
    return '<footer class="exp-footer"><div><strong>CAISIK / UNDERGROUND ALCHEMY</strong><p>THE CITY IS A TEXT.</p>'+anchor('/','Zpět do hlavního světa ↗')+'</div><div><p>Obrazové scény zachovávají schválené původní ilustrace CAISIK. Jsou autorskou vizuální interpretací, nikoli svědectvím o skutečných lidech či místech. Lekce jsou autorská cvičení.</p><p>Součástí zatím nejsou licencované komentované audio ukázky, skutečné rozhovory ani odborná taneční demonstrace. Návštěvy nejsou rezervované a označení partner nevzniká bez skutečné dohody. Záznamy účastníků se na server nenahrávají.</p>'+anchor('#sources','Zdroje a podmínky ↑')+'</div></footer>'


def build_page(data,chapter=None):
    chapters=sorted(data['chapters'],key=lambda c:c['number'])
    lessons={x['id']:x for x in data['lessons']}
    routes={x['id']:x for x in data['routes']}
    places={x['id']:x for x in data['places']}
    sources={x['id']:x for x in data['sources']}
    ident=chapter['id'] if chapter else 'overview'
    selected=[chapter] if chapter else chapters
    title=f'{chapter["label"]} — {chapter_title(chapter)}' if chapter else 'Pět hiphopových expedic v Paříži'
    description=chapter['subtitle'] if chapter else 'Pět samostatných tvůrčích expedic CAISIK: DJ, MC, Writer, Breaking a Knowledge. Plné lekce, skutečná místa a vlastní procesní Blackbook.'
    canonical='/expeditions/'+(chapter['id']+'/' if chapter else '')
    if chapter:
        story='<section id="story" class="exp-story" aria-label="Tři hlavní lekce">'+story_stage(selected)+'<div class="exp-story-copy">'+''.join(lesson_step(chapter,lessons[lesson_id],i,sources) for i,lesson_id in enumerate(chapter['lessonIds']))+'</div></section>'
        body=hero(chapter)+preparation(chapter,sources)+story+route_section(chapter,routes[chapter['routeId']],places,sources)+project_section(chapter,lessons)
        first=routes[chapter['routeId']]['stops'][0]['id']
        field=f'<nav class="exp-field-bar" aria-label="Rychlý přístup v terénu">{anchor("#route","Adresy a podmínky ↓",extra=" data-mode=\"field\"")}<button type="button" class="exp-text-link" data-next-stop="{h(first)}" value="{h(first)}">Další místo →</button>{anchor("#blackbook","Poznámka ↓")}</nav>'
    else:
        intro='<section class="exp-preparation"><p class="exp-eyebrow">DOMA → V ULICI → VLASTNÍ TVORBA → DALŠÍ POKUS</p><h2>Čti kulturu. Potom něco vytvoř.</h2><div class="exp-preparation-grid"><p>Každá expedice má tři konkrétní cíle, tři plné lekce a vlastní výstup. Otázka vede k pozorování, vysvětlené ukázce, pokusu a jeho revizi.</p><p>V terénu otevři adresy rovnou. Nemusíš projít animaci, abys zjistil podmínky dalšího místa. Pokud místo nebo aktivita nejsou dostupné, každá expedice nabízí domácí variantu.</p></div></section>'
        body=hero()+paths(chapters)+intro+overview_story(chapters,lessons,sources)+overview_routes(chapters,routes)
        field=f'<nav class="exp-field-bar" aria-label="Rychlý přístup v terénu">{anchor("#route","Vybrat praktickou trasu ↓")}{anchor("#blackbook","Otevřít poznámky ↓")}</nav>'
    body+=blackbook(chapters,chapter)+links_section()+sources_section(selected,routes,places,sources)
    if chapter:
        body+=paths(chapters,ident)
    html=f'''<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#080808"><title>{h(title)} / CAISIK</title><meta name="description" content="{h(description)}"><link rel="canonical" href="{h(ORIGIN+canonical)}"><link rel="icon" href="/assets/atlas/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/fonts-v7.css"><link rel="stylesheet" href="/expeditions/expeditions.css?v=2"><script type="module" src="/expeditions/app.js?v=2"></script></head>
<body data-expedition="{h(ident)}">{header(ident)}<main id="exp-main"><p id="exp-content-error" class="exp-error" role="status" hidden></p>{field}{body}</main>{footer(data['mediaStatus'])}</body></html>\n'''
    target=OUT/('index.html' if chapter is None else chapter['id']+'/index.html')
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(html)
    return target


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data',type=Path,default=DATA)
    args=parser.parse_args()
    data=json.loads(args.data.read_text())
    assert data['schemaVersion']==1
    assert [c['id'] for c in sorted(data['chapters'],key=lambda c:c['number'])]==ORDER
    assert len(data['lessons'])==15 and sum(len(r['stops']) for r in data['routes'])==31
    pages=[build_page(data)]
    for chapter in sorted(data['chapters'],key=lambda c:ORDER.index(c['id'])):
        pages.append(build_page(data,chapter))
    print(f'Built {len(pages)} static expedition pages: 15 complete lessons and 31 route stops; no runtime required for reading.')


if __name__=='__main__':
    main()


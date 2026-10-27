"""Idempotent additive wiring. Run after any legacy HTML generator."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
HEAD='<link rel="stylesheet" href="/selfmade-motion.css?v=1"><script src="/selfmade-motion.js?v=1" defer></script>'
BANNER='''<section class="selfmade-entry" aria-label="SELFMADE — tvoje vlastní cesta"><div><p>THE CITY IS YOUR PLAYGROUND / TY JSI HRDINA</p><h2>SELF<span>MADE.</span></h2><p>Vlastní questy. Pět dílen. Tvoje tvorba proměňuje tvůj svět.</p></div><a href="/play/">VSTOUPIT DO VLASTNÍHO SVĚTA ↗</a></section>'''
pages=[DIST/'index.html',DIST/'art/index.html',DIST/'logo/index.html',*sorted((DIST/'q').glob('*/index.html')),*sorted((DIST/'expeditions').glob('**/index.html'))]
for file in pages:
    data=file.read_text()
    if '/selfmade-motion.js' not in data: data=data.replace('</head>',HEAD+'</head>')
    if file==DIST/'index.html':
        if '/selfmade-entry.css' not in data: data=data.replace('</head>','<link rel="stylesheet" href="/selfmade-entry.css?v=1"></head>')
        if 'data-selfmade-entry' not in data:
            data=data.replace('<a href="/expeditions/">EXPEDICE</a>','<a href="/play/" data-selfmade-entry>SELFMADE</a><a href="/expeditions/">EXPEDICE</a>',1)
        if 'class="selfmade-entry"' not in data: data=data.replace('<section id="expeditions"',BANNER+'<section id="expeditions"',1)
        if 'PROBUĎ SVŮJ SVĚT' not in data: data=data.replace('<div class="hero-actions">','<div class="hero-actions"><a class="button gold selfmade-hero-link" href="/play/">PROBUĎ SVŮJ SVĚT ↗</a>',1)
    elif file.parent.parent==DIST/'expeditions' or file==DIST/'expeditions/index.html':
        if 'data-selfmade-entry' not in data: data=data.replace('<nav class="exp-nav" aria-label="Hlavní navigace">','<nav class="exp-nav" aria-label="Hlavní navigace"><a href="/play/" data-selfmade-entry>SELFMADE ↗</a>',1)
    elif file==DIST/'art/index.html':
        if 'data-selfmade-entry' not in data:data=data.replace('<div class="mw-art-top">','<div class="mw-art-top"><a href="/play/#journal" data-selfmade-entry>MŮJ SELFMADE BLACKBOOK ↗</a>',1)
    file.write_text(data)
print(f'Selfmade linked to {len(pages)} existing pages; original routes retained.')

# Interactive typography is optional enhancement, never required to read a page.
TEXT_HEAD='<link rel="stylesheet" href="/text-motion.css?v=2"><script src="/text-motion.js?v=2" defer></script>'
text_pages=[p for p in sorted(DIST.rglob('*.html')) if p.name not in ['implementation.html','launch-plan.html'] and p!=DIST/'play/roadmap/index.html']
for file in text_pages:
    data=file.read_text()
    data=data.replace('/text-motion.css?v=1','/text-motion.css?v=2').replace('/text-motion.js?v=1','/text-motion.js?v=2')
    if '/text-motion.js' not in data:
        data=data.replace('</head>',TEXT_HEAD+'</head>')
    file.write_text(data)
print(f'Interactive type linked to {len(text_pages)} experience pages.')

# Preserve the geographic atlas and add an optional 3D stage around its 2D map.
atlas_pages=[DIST/'index.html',*sorted((DIST/'q').glob('*/index.html'))]
for file in atlas_pages:
    data=file.read_text()
    data=data.replace('/atlas.js?v=3','/atlas.js?v=4')
    data=data.replace('/city-atlas.css?v=1','/city-atlas.css?v=2')
    data=data.replace('/city-atlas.css?v=2','/city-atlas.css?v=3').replace('/city-map.css?v=1','/city-map.css?v=2')
    if '/city-atlas.css' not in data:
        data=data.replace('</head>','<link rel="stylesheet" href="/city-atlas.css?v=3"><link rel="stylesheet" href="/city-map.css?v=2"></head>')
    if 'class="map-wrap"' not in data:
        data=data.replace('<div id="city-map" role="region" aria-label="Interactive geographic map of Paris discoveries"></div>', '<div class="city-scene-heading"><span>PARIS / THE HIDDEN CITY</span><span>TAHEJ MĚSTO. NAJDI VLASTNÍ CESTU.</span></div><div class="map-wrap"><div id="city-map" role="region" aria-label="Interaktivní geografická mapa pařížských míst"></div></div>')
    data=data.replace('Map tiles from OpenStreetMap receive your IP and viewed map area.', 'Mapová data © OpenStreetMap; 3D dlaždice OpenFreeMap. Poskytovatel mapy přijímá IP adresu a zobrazenou oblast. Půdorysy vycházejí z mapových dat; dostupné výšky budov jsou orientační, chybějící výška je výtvarně doplněná. Nejde o přesný model památek.')
    file.write_text(data)
print(f'Animated geographic city stage linked to {len(atlas_pages)} atlas routes.')

# Individually generated, animated place artwork; documentary originals stay optional.
for file in atlas_pages:
    data=file.read_text().replace('/atlas.js?v=4','/atlas.js?v=7').replace('/atlas.js?v=5','/atlas.js?v=7').replace('/atlas.js?v=6','/atlas.js?v=7')
    data=data.replace('/place-visuals.css?v=1','/place-visuals.css?v=3').replace('/place-visuals.css?v=2','/place-visuals.css?v=3')
    if '/place-visuals.css' not in data:
        data=data.replace('</head>','<link rel="stylesheet" href="/place-visuals.css?v=3"><link rel="stylesheet" href="/place-art-motion.css?v=1"><script src="/place-art-motion.js?v=1" defer></script></head>')
    file.write_text(data)

# Living culture is part of the same geographic atlas and field notebook.
import re
MOTION_TOOLS='<div class="atlas-motion-tools" lang="cs"><div><button type="button" class="small-button" data-atlas-motion aria-pressed="false">POZASTAVIT ANIMACE Ⅱ</button><p data-atlas-motion-state>Živé detaily jsou zapnuté.</p></div><a class="text-link" href="#culture-district">STREET / SOUND / THOUGHT · 14 NOVÝCH MÍST ↓</a></div>'
CULTURE_HOST='<div id="culture-district" lang="cs" aria-label="Živá kultura Paříže — místa, vlastní praxe a Blackbook"><p class="status">Připravuji STREET / SOUND / THOUGHT…</p><a class="text-link" href="/expeditions/">Otevřít expedice ↗</a></div>'
for file in atlas_pages:
    data=file.read_text()
    data=re.sub(r'/atlas\.js\?v=\d+','/atlas.js?v=8',data)
    data=re.sub(r'/place-art-motion\.(js|css)\?v=\d+',r'/place-art-motion.\1?v=2',data)
    if '/culture-board.css' not in data:data=data.replace('</head>','<link rel="stylesheet" href="/culture-board.css?v=1"></head>')
    if 'data-atlas-motion ' not in data:data=data.replace('<div class="explorer-top">',MOTION_TOOLS+'<div class="explorer-top">',1)
    if 'id="culture-district"' not in data:data=data.replace('<p class="privacy-line">Near Me',CULTURE_HOST+'<p class="privacy-line">Near Me',1)
    data=data.replace('Published information was checked on <time datetime="2026-10-21">21 October 2026</time>', 'Original atlas information was checked on <time datetime="2026-10-21">21 October 2026</time>; cultural additions show their own research dates')
    file.write_text(data)
print(f'Visible motion controls and living-culture field desk linked to {len(atlas_pages)} atlas routes.')

# Accuracy-first map and reversible chapter motion preserve native page scrolling.
for file in atlas_pages:
    data=file.read_text()
    data=re.sub(r'/atlas\.js\?v=\d+','/atlas.js?v=10',data)
    data=re.sub(r'/city-map\.css\?v=\d+','/city-map.css?v=3',data)
    data=re.sub(r'/culture-board\.css\?v=\d+','/culture-board.css?v=2',data)
    data=data.replace('STREET / SOUND / THOUGHT · 14 NOVÝCH MÍST ↓','STREET / SOUND / THOUGHT · 20 KULTURNÍCH MÍST ↓')
    data=data.replace('chybějící výška je výtvarně doplněná','chybějící výška zůstává plochým půdorysem')
    if '/journey-scroll.js' not in data:data=data.replace('</head>','<link rel="stylesheet" href="/journey-scroll.css?v=1"><script src="/journey-scroll.js?v=1" defer></script></head>')
    file.write_text(data)

# One persistent language preference across atlas, expeditions, workshops and gallery.
LANGUAGE_HEAD='<link rel="stylesheet" href="/languages.css?v=1"><script src="/languages.js?v=2" defer></script>'
for file in text_pages:
    data=file.read_text()
    if '/languages.js' not in data:
        marker='<link rel="stylesheet" href="/text-motion.css'
        if marker in data:data=data.replace(marker,LANGUAGE_HEAD+marker,1)
        else:data=data.replace('</head>',LANGUAGE_HEAD+'</head>')
    file.write_text(data)
print(f'CZ / EN / FR language controls linked to {len(text_pages)} experience pages.')

# Venue names and street addresses are authoritative identifiers, not prose.
for file in atlas_pages:
    data=file.read_text()
    for name in ['Le M.U.R. Oberkampf · 107 rue Oberkampf','Vitry-sur-Seine · Mur/Murs']:
        data=data.replace('<strong>'+name+'</strong>','<strong translate="no">'+name+'</strong>')
    file.write_text(data)

# Mobile place navigation and the native collection replace the retired shop links.
for file in atlas_pages:
    data=file.read_text()
    data=re.sub(r'/city-atlas\.css\?v=\d+','/city-atlas.css?v=4',data)
    if 'data-native-shop' not in data:
        data=data.replace('<a href="#living-wall">LIVING WALL</a>','<a href="#living-wall">LIVING WALL</a><a href="/shop/" data-native-shop>SHOP</a>',1)
    file.write_text(data)
for file in text_pages:
    data=file.read_text()
    data=re.sub(r'href="https://hiphop\.caisik\.i234\.me/dk/[^"<>]*"','href="/shop/"',data)
    data=data.replace('CHECK LIVE CATALOG ↗','VIEW THE COLLECTION ↗').replace('OPEN LIVE STORE ↗','VIEW THE COLLECTION ↗')
    file.write_text(data)

for file in text_pages:
    data=file.read_text().replace('/languages.js?v=1','/languages.js?v=2')
    file.write_text(data)

# Reload only the changed legacy link adapters after this release.
for file in text_pages:
    data=file.read_text()
    for script in ['app.js','catalog.js','experience.js','cinematic-v7.js']:
        data=data.replace('src="/'+script+'"','src="/'+script+'?v=2"')
    file.write_text(data)

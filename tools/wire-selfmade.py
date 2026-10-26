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

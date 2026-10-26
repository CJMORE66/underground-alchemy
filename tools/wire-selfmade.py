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

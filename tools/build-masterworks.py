"""Prepare generated artwork for the site without changing its alpha channel."""
from pathlib import Path
import json, shutil, html
from PIL import Image
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'art-direction-100.json').read_text())
paths=json.loads((root/'art-generated-paths.json').read_text())
source={int(k):v for k,v in paths.items()}
short_names={
'Letterworks':['CAISIK','Transmute','Underground','Inner Voice','Know Thyself','No Mask','Raw Thoughts','Stay True','Create','Listen'],
'Hip-Hop':['The Open Mic','Two Decks','Analog Thoughts','Balance','Paint the Silence','Low End Theory','The Blackbook','Listen In','City in the Groove','Pass the Mic'],
'Seven Principles':['Inner World','Correspondence','Vibration','Polarity','Rhythm','Cause & Effect','Generation','Seven Chapters','Interconnected','The Lantern'],
'Inner Underground':['The Reader','Mirror Flame','Unmask','Heart on Record','A Way In','Reform','The Endless Cable','Mended Crown','Inward Eyes','The Inner Door'],
'Street Alchemy':['Concrete Portal','Transit Language','Writer’s Crown','Wild Structure','Unchained','Chrome Relic','Make Your World','Fragments of Time','Rooftop Frequency','Find a Direction'],
'Freestyle Ritual':['Speak It','Raw Capture','Paper Wings','A Safe Voice','Follow the Thread','Tape Ritual','First Bar','Deep Listening','Hear Your Heart','Honest'],
'Creative Practice':['Rough to Refined','Tools of Expression','Build on Paper','One Continuous Line','Work in Progress','Reassembled','Construct the Idea','Grow Through','Field Notes','Inner Compass'],
'Symbols':['Open Eye','As Above / So Below','The Knot','Sun & Moon','An Opening','Inner Fire','The Key','Seven Points','Crystal Stair','Spiral Thought'],
'Culture':['Four Forms','Connection','Step Into It','Make the Beat','The Blend','Foundation','Cap & Crown','Pages of Practice','Frame the City','Respect'],
'Future Relics':['Analog Bloom','Temple of Voice','Eye in the Groove','Future Wing','Become','Repair Time','Carry the Light','The Book & Crown','New Language','Alchemy']}
practice={
'Letterworks':'Sketch the letter skeleton before the flourishes. Try the same word with a different width, weight and rhythm.',
'Hip-Hop':'Choose a sound, a movement or a mark. Make a small response in your own medium and notice what changes.',
'Seven Principles':'Treat the image as a philosophical metaphor. Name one useful comparison, then ask where that comparison stops working.',
'Inner Underground':'Describe what this symbol brings to mind for you. Keep one concrete phrase and use it to open a freestyle.',
'Street Alchemy':'Find an everyday shape and redraw it three ways. Change only one feature at a time so you can compare the results.',
'Freestyle Ritual':'Make a short raw take. Listen back, choose one line you want to keep and let it begin the next take.',
'Creative Practice':'Choose a small next step you can finish today. Keep the rough version so you can compare it with the revision.',
'Symbols':'Symbols can carry different meanings for different people. Write your own interpretation and label it as an interpretation.',
'Culture':'Explore the makers and histories behind the forms. Start with the Smithsonian hip-hop collection linked on the Knowledge Wall.',
'Future Relics':'Combine two familiar objects in a sketch. Ask what new idea their combination lets you express.'}
from concurrent.futures import ThreadPoolExecutor
import hashlib
def prepare_art(row):
 slug=row['slug']
 src=Path(source[row['id']]); original=root/'art-originals'/f'{slug}.png';original.parent.mkdir(exist_ok=True)
 if src.resolve()!=original.resolve():shutil.copy2(src,original)
 im=Image.open(original).convert('RGBA');a=im.getchannel('A');lo,hi=a.getextrema()
 if lo!=0 or hi<128 or a.histogram()[0]/(im.width*im.height)<0.05:raise ValueError(f'{slug}: missing genuine transparency {lo,hi}')
 out=root/'dist/assets/masterworks';out.mkdir(parents=True,exist_ok=True)
 im.save(out/f'{slug}.webp',quality=86,method=4)
 thumb=im.copy();thumb.thumbnail((600,600));thumb.save(out/f'{slug}-thumb.webp',quality=82,method=4)
 return {'id':row['id'],'size':im.size,'alpha':True,'web_bytes':(out/f'{slug}.webp').stat().st_size,'sha256':hashlib.sha256(original.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=6) as pool:
 stats=list(pool.map(prepare_art,rows))
assert len({item['sha256'] for item in stats})==100, 'Duplicate source images'
counts={}
for row,item in zip(rows,stats):
 slug=row['slug'];category=row['category'];idx=counts.get(category,0);counts[category]=idx+1
 row.update(description=row.get('description',row['title']),title=short_names[category][idx],image=f'/assets/masterworks/{slug}.webp',thumbnail=f'/assets/masterworks/{slug}-thumb.webp',width=item['size'][0],height=item['size'][1],practice=practice[category],status='generated',alpha=True)
public=[{k:v for k,v in row.items() if k not in ('prompt',)} for row in rows]
(root/'dist/art').mkdir(exist_ok=True)
(root/'dist/art/artworks.json').write_text(json.dumps(public,ensure_ascii=False))
(root/'dist/art/prompts.json').write_text(json.dumps([{'id':r['id'],'title':r['title'],'prompt':r['prompt']} for r in rows],indent=2,ensure_ascii=False))
(root/'dist/art/artworks.js').write_text('window.CAISIK_ART='+json.dumps(public,ensure_ascii=False)+';')
(root/'art-direction-100.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False))
(root/'docs/MASTERWORKS-QA.json').write_text(json.dumps(stats,indent=2))
options=''.join('<option>'+html.escape(c)+'</option>' for c in counts)
cards=''.join(f'<figure class="mw-art-card" data-slug="{r["slug"]}"><button class="mw-art-open" data-art="{r["slug"]}" aria-label="Open artwork {r["slug"]}: {html.escape(r["title"],quote=True)}"><img src="{r["thumbnail"]}" alt="{html.escape(r["title"],quote=True)} — original transparent graffiti illustration" width="600" height="600" loading="lazy" decoding="async"><figcaption><span>{r["slug"]} / {html.escape(r["category"])}</span><b>{html.escape(r["title"])}</b></figcaption></button></figure>' for r in rows)
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Blackbook — 100 Original Artworks / CAISIK</title><meta name="description" content="100 original AI-created transparent graffiti artworks. Explore the CAISIK Blackbook: hip-hop, inner expression and alchemical metaphors."><link rel="canonical" href="https://caisik-underground-alchemy.caisik.chatgpt.site/art/"><link rel="stylesheet" href="/fonts-v7.css"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/masterworks.css"></head><body class="mw-art-page"><div class="mw-art-top"><a href="/" aria-label="CAISIK home"><img src="/assets/masterworks/001.webp" alt="CAISIK" width="150" height="60"></a><a href="/#knowledge">KNOWLEDGE WALL ↗</a><a href="/#freestyle">FREESTYLE LAB ↗</a></div><main><section class="mw-art-intro"><p class="mw-overline">100 ORIGINAL ARTWORKS / THE CAISIK VISUAL UNIVERSE</p><h1>THE<br><em>BLACKBOOK.</em></h1><p>Letterforms. Hip-hop relics. Symbols for the world inside. Explore 100 individually generated artworks, open a piece and view its real transparency on different backgrounds. These are original AI-created concept artworks, separate from the store’s product previews.</p></section><div class="mw-art-tools"><label for="mw-category">CHOOSE A CHAPTER<select id="mw-category"><option value="">All chapters</option>OPTIONS</select></label><label for="mw-search">FIND AN IDEA<input id="mw-search" type="search" placeholder="Search words, symbols, themes…"></label><output id="mw-count" aria-live="polite">100 / 100 ARTWORKS</output></div><section id="mw-art-grid" class="mw-art-grid" aria-label="The Blackbook artworks">CARDS</section><p id="mw-empty" class="mw-empty" hidden>No artworks match. Try another word or chapter.</p></main><dialog id="mw-art-modal" class="mw-art-modal" aria-labelledby="mw-modal-title"><div class="mw-modal-top"><h2 id="mw-modal-title"></h2><button id="mw-modal-close" class="mw-modal-close" aria-label="Close artwork">CLOSE ×</button></div><div id="mw-transparency" class="mw-transparency"><img id="mw-preview" alt=""></div><p id="mw-practice" class="mw-modal-note"></p><div class="mw-modal-actions"><a id="mw-png" class="mw-cta mw-download-png" aria-disabled="true" download>PREPARING PNG…</a><a id="mw-download" class="mw-cta" download>DOWNLOAD TRANSPARENT WEBP ↓</a><button data-backdrop="checker">CHECKERBOARD</button><button data-backdrop="dark">DARK</button><button data-backdrop="light">LIGHT</button></div><p class="mw-modal-note">The checkerboard is a preview surface. It is not part of the downloaded artwork. AI-created original concept art / CAISIK.</p></dialog><footer class="mw-art-footer">CAISIK / UNDERGROUND ALCHEMY<br><a href="/">BACK TO THE WORLD ↗</a> · <a href="/art/prompts.json" download>ART PROMPTS / JSON ↓</a> · <a href="/#knowledge">LEARN SOMETHING ↗</a> · <a href="/#drops">EXPLORE THE COLLECTIONS ↗</a></footer><script src="/art/artworks.js"></script><script src="/masterworks.js" defer></script></body></html>'''.replace('OPTIONS',options).replace('CARDS',cards)
# Keep button content phrasing-only; each figure's accessible label is on its button.
page=page.replace('<figcaption>', '<span class="mw-card-label">').replace('</figcaption>', '</span>')
(root/'dist/art/index.html').write_text(page)
print(json.dumps({'artworks':len(rows),'alpha_verified':len(stats),'web_mb':round(sum(x['web_bytes'] for x in stats)/1e6,2)}))

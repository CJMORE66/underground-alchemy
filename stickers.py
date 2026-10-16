from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile,json
p=Path('/workspace/sites/caisik-underground-alchemy/dist');out=p/'assets'/'stickers';out.mkdir(exist_ok=True)
names=['transmute','mentalism','correspondence','vibration','polarity','rhythm','cause-effect','generation','shadow-work','as-above','so-below','underground']
lines=[('TRANS','MUTE.'),('MIND','FIRST.'),('WITHIN.','WITHOUT.'),('FIND YOUR','FREQUENCY.'),('HOLD','BOTH.'),('MOVE.','RETURN.'),('CHOOSE','THE CAUSE.'),('MAKE IT','REAL.'),('MEET YOUR','SHADOW.'),('AS','ABOVE.'),('SO','BELOW.'),('STAY','UNDERGROUND.')]
accents=['#bdab79','#d8d6c7','#b99863','#b5bca1','#dddddd','#b7946b','#a34b36','#b4a979','#b7bec0','#d1bb81','#9a4436','#d7d6c7']
for i,name in enumerate(names):
 qr=ET.parse(p/'assets'/f'qr-{name}.svg').getroot();qr.attrib.update({'x':'200','y':'550','width':'660','height':'660'});raw=ET.tostring(qr,encoding='unicode')
 color=accents[i];shape=['<circle cx="820" cy="230" r="130"/>','<path d="M820 90 970 350H670Z"/>','<path d="M820 360 670 100H970Z"/>'][i%3]
 size=120 if max(map(len,lines[i]))<10 else 100
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:ns0="http://www.w3.org/2000/svg" width="106mm" height="146mm" viewBox="0 0 1060 1460"><title>CAISIK street series {i+1:02} — {name}</title><desc>106 by 146 mm artboard includes 3 mm bleed for a 100 by 140 mm trim. QR must remain unaltered. Private Site destination requires public launch before distribution. RGB SVG: printer conversion and physical proof required.</desc><rect width="1060" height="1460" fill="#13170f"/><g fill="none" stroke="{color}" stroke-width="4" opacity=".45">{shape}<circle cx="820" cy="230" r="95"/><path d="M640 230H1000 M820 50V410"/></g><path d="M30 30H1030V1430H30Z" fill="none" stroke="{color}" stroke-width="5"/><g font-family="Arial,sans-serif" fill="{color}"><text x="85" y="140" font-size="30" letter-spacing="7">CAISIK / {i+1:02}</text><text x="80" y="310" font-size="{size}" font-weight="900" letter-spacing="-4">{lines[i][0]}</text><text x="80" y="440" font-size="{size}" font-weight="900" letter-spacing="-4">{lines[i][1]}</text><text x="85" y="510" font-size="20" letter-spacing="4">UNDERGROUND ALCHEMY</text><text x="85" y="1300" font-size="26" font-weight="700">SCAN TO ENTER THE WORLD ↗</text><text x="85" y="1365" font-size="16" letter-spacing="2">SIGN {i+1:02} / THE STREET SERIES</text></g><rect x="190" y="540" width="680" height="680" fill="white"/>{raw}</svg>'''
 (out/f'{i+1:02}-{name}.svg').write_text(svg)
readme='''CAISIK — STREET SERIES / 12 ORIGINAL VECTOR LAYOUTS

Artboard: 106 x 146 mm. Intended trim: 100 x 140 mm (3 mm bleed each side).
Vector QR codes are black on white with their own quiet zone. Do not distort, recolor or crop the code.
Color: RGB SVG. Printer must convert using its selected production profile, outline/substitute fonts, and confirm trim/bleed. These are design masters, not certified CMYK press PDFs.
Print one actual-size proof and scan each finished physical sticker on multiple phones before a full run.
CRITICAL: destinations currently use the owner-private Sites URL. Public access and final destination approval must be completed before distribution.
No claim of final physical scannability is made before proof testing.
Apply only where permission has been granted.
All campaigns use utm_source=sticker, utm_medium=qr, per-design campaign/content identifiers. This build does not implement analytics or order attribution.
'''
(out/'PRINT-README.txt').write_text(readme)
with zipfile.ZipFile(p/'assets'/'caisik-street-series-12.zip','w',zipfile.ZIP_DEFLATED)as z:
 for f in out.iterdir():z.write(f,f.name)
print('12 original sticker layouts and vector-design ZIP created.')

"""TRANSMUTE: independently rigged original paint, over a restored empty city.

No complete original painting sits behind moving parts. Hand-traced source masks
separate the figure, celestial objects, lettering, ribbons, drips and ornaments.
The occluded vinyl is reconstructed with engraved vector grooves; its authentic
red label is preserved. All motion is authored on a seamless 24-second clock.
"""
from pathlib import Path
from html import escape
import json
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
OUT.mkdir(parents=True, exist_ok=True)
PAINT = '/assets/atlas/transmute-approved.webp'
CLEAN = '/assets/art-motion/transmute-city-clean.png'
DURATION = 24
GOLD, WHITE, RED = '#ffd827', '#fff0b4', '#eb1635'

def attr(**values):
    return ' '.join(f'{key.replace("_", "-")}="{escape(str(value), quote=True)}"' for key,value in values.items())

def track(name,content,frames,cx=768,cy=512,ease='smooth'):
    return f'<g {attr(data_am="story",data_part=name,data_frames=json.dumps(frames,separators=(",",":")),data_cx=cx,data_cy=cy,data_ease=ease)}>{content}</g>'

def cycle(amp=1,offset=0,cycles=4,phase=0):
    # Repeated smooth extrema close exactly at the loop boundary, including offset.
    return [[round(i*DURATION/(cycles*4),5),round(offset+amp*math.sin(i*math.pi/2+phase),5)] for i in range(cycles*4+1)]

def drift(name,content,cx,cy,x=0,y=0,rotate=0,scale=0,cycles=4,phase=0):
    frames={}
    if x: frames['x']=cycle(x,cycles=cycles,phase=phase)
    if y: frames['y']=cycle(y,cycles=cycles,phase=phase+math.pi/2)
    if rotate: frames['rotate']=cycle(rotate,cycles=cycles,phase=phase)
    if scale: frames['scale']=cycle(scale,1,cycles=cycles,phase=phase)
    return track(name,content,frames,cx,cy)

def use(clip,mask=None):
    return f'<use href="#paint" clip-path="url(#{clip})"'+(f' mask="url(#{mask})"' if mask else '')+'/>'

def clip(name,path):
    defs.append(f'<clipPath id="{name}" clipPathUnits="userSpaceOnUse"><path d="{path}"/></clipPath>')
    return name

def mask(name,holes):
    defs.append(f'<mask id="{name}" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024" style="mask-type:luminance"><rect width="1536" height="1024" fill="white"/>{holes}</mask>')
    return name

def hole(path,stroke=0):
    return f'<path d="{path}" fill="black" stroke="black" stroke-width="{stroke}"/>'

def circle_hole(x,y,r):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="black"/>'

def trace(name,path,speed=10,width=2,color=WHITE,opacity=.65,dash='5 95'):
    speed = max(1,round(speed*24/100))*100/24
    return f'<path {attr(data_am="trace",data_part=name,data_speed=speed,d=path,pathLength=100,fill="none",stroke=color,stroke_width=width,stroke_dasharray=dash,stroke_linecap="round",opacity=opacity)}/>'

letters=json.loads((ROOT/'tools/transmute-letter-layers.json').read_text())['parts']
defs=[f'<image id="paint" href="{PAINT}" width="1536" height="1024"/>',
      '<radialGradient id="disc"><stop stop-color="#25221c"/><stop offset=".35" stop-color="#050505"/><stop offset=".82" stop-color="#171717"/><stop offset="1" stop-color="#050505"/></radialGradient>',
      '<linearGradient id="gold-edge" x1="0" x2="1"><stop stop-color="#9f710b"/><stop offset=".4" stop-color="#fff4b7"/><stop offset=".65" stop-color="#ffd600"/><stop offset="1" stop-color="#99650a"/></linearGradient>',
      '<linearGradient id="eye-gold"><stop stop-color="#806010"/><stop offset=".5" stop-color="#fff0a7"/><stop offset="1" stop-color="#cf9f14"/></linearGradient>']
layers=[f'<image data-part="restored-city" href="{CLEAN}" width="1536" height="1024"/>']

# Architectural lights and stone figure outlines remain aligned to their building.
window_paths=[
 'M138 24V47M145 24V39M258 72V94M295 64V93M334 130V155M354 123V151M371 159V200M378 162V191',
 'M235 122V144M262 159V185M317 198V220M254 316V336M262 319V333M219 365V389M208 419V441',
 'M1194 110V136M1205 152V177M1260 94V121M1287 128V150M1308 162V184M1340 105V134',
 'M1273 291V314M1284 300V327M1308 348V379M1330 405V433M1383 25V47M1392 32V53'
]
for i,path in enumerate(window_paths):
    layers.append(track(f'city-windows-{i+1}',f'<path d="{path}" fill="none" stroke="{WHITE}" stroke-width="3"/>',{'opacity':cycle(.36,.5,cycles=2+i%2,phase=i*math.pi/2)}))
for name,path in [('left-statue','M49 382Q29 318 48 248Q61 200 88 211M29 698Q16 640 28 578Q36 539 59 523'),('right-statue','M1482 390Q1503 315 1481 252Q1465 209 1446 216M1510 704Q1528 631 1505 576Q1495 545 1474 534')]:
    layers.append(trace(name,path,7,1.6,GOLD,.5,'3 97'))

# Thin astrolabe rails and moving pearls belong behind the actual painted objects.
rail_paths=[('left-orbit','M190 378C205 197 296 116 440 116C517 113 567 154 594 218'),('right-orbit','M944 152Q1036 81 1090 117Q1218 122 1227 206L1345 470'),('lower-orbit','M279 790C456 904 999 975 1306 832')]
for name,path in rail_paths:
    layers.append(trace(name,path,8,2.5,GOLD,.8,'8 92'))
# Gold pearl source textures, genuinely displaced along their own small orbits.
pearls=[('sun-orbit-pearl',440,116,22,11,7),('left-upper-pearl',309,199,10,7,10),('mic-orbit-pearl',188,379,20,9,9),('mic-lower-pearl',233,434,19,8,10),('moon-orbit-pearl',1090,119,24,12,6),('right-upper-pearl',1227,209,13,9,11),('right-lower-pearl',1346,468,28,10,12),('lower-left-pearl',578,834,25,7,6),('lower-left-pearl-2',594,876,30,7,5),('lower-right-pearl',960,850,28,8,5)]
for i,(name,cx,cy,r,dx,dy) in enumerate(pearls):
    defs.append(f'<clipPath id="{name}-cut"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>')
    layers.append(drift(name,use(name+'-cut'),cx,cy,x=dx,y=dy,cycles=2,phase=i*math.pi/5))

# Source ouroboros, actual hood geometry and engraved astrolabe geometry.
snake='M574 190C579 122 613 75 668 45Q708 22 746 18Q757 2 782 6L805 9L817 18L805 35L798 46Q847 54 889 80Q932 109 951 153Q967 190 976 232L951 237Q945 187 919 143Q886 102 831 80L790 62Q743 53 694 77Q650 99 626 146Q609 174 624 195L649 214L611 242L590 221Z'
clip('ouroboros-cut',snake)
layers.append(drift('ouroboros',use('ouroboros-cut'),771,230,rotate=2.3,y=3,cycles=2))
# Original halo is cut as annular lines, avoiding the portrait in its centre.
outer_halo='M539 237C533 120 626 31 741 20C877 7 992 96 1005 236L994 238C982 103 875 19 741 32C631 43 544 127 551 237Z M579 238C581 158 652 83 745 80C849 76 940 148 952 239L942 240C930 154 849 88 745 91C657 95 591 165 590 239Z'
clip('halo-rings-cut',outer_halo)
layers.append(drift('halo-rings',use('halo-rings-cut'),770,237,rotate=-3.2,scale=.009,cycles=2))
# Triangle geometry is native to the painted philosophical construction, behind hood.
triangle='<path d="M754 65L874 268H633ZM754 65V279M672 200H836" fill="none" stroke="url(#gold-edge)" stroke-width="2.8"/>'
layers.append(drift('triangle-geometry',triangle,754,203,rotate=3.4,scale=.018,cycles=2))

# Sun rays turn independently of the engraved face. Rays avoid mic and monk pixels.
sun_rays='M358 250L391 242L362 218L402 226L376 192L418 210L402 167L438 200L435 155L457 194L472 149L480 191L500 153L498 197L531 162L518 211L557 184L538 222L582 213L554 238L626 239L553 259L593 276L550 278L579 311L537 296L554 337L522 315L526 359L502 325L491 380L478 328L454 369L455 324L421 357L435 316L397 339L419 299L377 309L408 278L363 276L402 260Z'
clip('sun-rays-cut',sun_rays)
mask('sun-rays-clear',circle_hole(484,256,55))
layers.append(drift('sun-rays',use('sun-rays-cut','sun-rays-clear'),484,256,rotate=8.5,cycles=2))
defs.append('<clipPath id="sun-face-cut"><circle cx="484" cy="256" r="54"/></clipPath>')
layers.append(drift('sun-face',use('sun-face-cut'),484,256,y=6,x=2,rotate=.7,cycles=2))

# Reconstructed hidden vinyl keeps the foreground crescent out of the spinning disc.
# This is an exact geometric disc, plus the original label and visible engraved glints.
vinyl=['<circle cx="1210" cy="399" r="125" fill="url(#disc)" stroke="url(#gold-edge)" stroke-width="3.2"/>']
for r in range(50,122,5):
    vinyl.append(f'<circle cx="1210" cy="399" r="{r}" fill="none" stroke="#a8a6a0" stroke-width=".8" opacity="{.22 if r%2 else .32}"/>')
defs.append('<clipPath id="vinyl-label-cut"><circle cx="1210" cy="399" r="40"/></clipPath>')
label=use('vinyl-label-cut')+'<circle cx="1210" cy="399" r="6" fill="#080808" stroke="#cba348" stroke-width="1.5"/>'
vinyl.append(track('vinyl-label',label,{'rotate':[[0,0],[24,720]]},1210,399,ease='linear'))
vinyl.append(track('vinyl-groove-reflections','<path d="M1120 348A104 104 0 0 1 1286 326M1133 475A106 106 0 0 0 1297 452" fill="none" stroke="#f0eee4" stroke-width="5" opacity=".6"/>',{'rotate':[[0,0],[24,360]]},1210,399,ease='linear'))
layers.append(drift('vinyl-record',''.join(vinyl),1210,399,y=5,rotate=4,cycles=2,phase=math.pi))
# Painted gold serpentine rails wrap the recreated record; isolated ribbons below.
vinyl_rails='M1150 404Q1322 296 1384 341Q1414 379 1234 439Q1141 475 1177 499L1184 484Q1151 468 1236 449Q1434 388 1391 337Q1337 285 1151 393Z M1205 476Q1310 415 1365 403Q1306 448 1211 486Z'
clip('vinyl-rails-cut',vinyl_rails)
layers.append(drift('vinyl-orbit-rings',use('vinyl-rails-cut'),1259,409,rotate=-3.5,scale=.012,cycles=2))
moon='M1013 160Q1095 129 1142 187Q1185 243 1153 302Q1124 354 1067 346L1039 331Q1112 323 1124 272Q1115 265 1108 258L1109 246L1096 241L1106 234Q1100 198 1064 179L1041 173Z M1002 172Q1067 130 1135 179L1143 188Q1070 145 1008 181Z'
clip('moon-cut',moon)
layers.append(drift('moon-face',use('moon-cut'),1076,249,x=-3,y=-6,rotate=-1.2,cycles=2))
defs.append('<clipPath id="moon-star-cut"><circle cx="1045" cy="237" r="36"/></clipPath>')
layers.append(drift('moon-star',use('moon-star-cut'),1045,237,rotate=12,scale=.08,cycles=2))

# The microphone is one rigid source-painted object; grille/shaft never split apart.
mic='M188 224Q186 202 218 190Q257 174 286 199Q306 219 305 245L281 286L362 445L333 465L246 309Q203 295 189 260Z'
clip('microphone-cut',mic)
layers.append(drift('microphone',use('microphone-cut'),330,439,rotate=3.2,y=3,cycles=4))
# Actual intertwined source coil segments stay behind the letters.
mic_coils='M203 304Q163 343 244 356Q337 364 373 389L390 410Q414 437 345 459L337 448Q389 431 378 414Q345 382 242 370Q158 353 190 315Z M284 276Q354 296 347 324Q331 349 292 367L279 360Q343 326 333 315Q321 300 279 291Z M303 396Q266 433 300 451L320 455L316 467Q250 459 278 417Z'
clip('mic-coils-cut',mic_coils)
layers.append(drift('microphone-orbit-rings',use('mic-coils-cut'),285,377,rotate=-3.4,x=3,cycles=3))

# Crimson calligraphic ribbons: separate source silhouettes, no large red overlays.
ribbons=[
 ('ribbon-left-upper','M180 251Q158 279 179 299L194 312L187 291Q174 283 187 272Z M320 303Q345 311 346 331L366 333L354 317Q341 306 320 303Z',269,294),
 ('ribbon-left-mid','M186 433Q157 446 160 466L151 479L171 473Q169 453 196 450L240 437Z M298 477Q338 499 370 482L397 470L410 473L402 491Q365 520 316 499Z',281,472),
 ('ribbon-right-upper','M1164 243Q1184 218 1209 235L1226 245L1216 255Q1186 237 1174 255Z M1241 277Q1269 257 1299 277L1329 285L1326 299L1304 287Q1285 277 1250 291Z',1252,265),
 ('ribbon-right-mid','M1352 329Q1393 318 1401 340L1391 358L1407 354L1412 333Q1405 313 1378 316Z M1368 392Q1415 398 1417 430L1397 463L1411 466Q1441 417 1409 400Z',1390,398),
 ('ribbon-right-low','M1403 497Q1430 506 1423 533L1437 553L1439 535Q1449 513 1429 499Z M1427 625Q1455 654 1427 681L1418 690L1438 689Q1469 659 1447 632Z',1436,594)
]
for i,(name,path,cx,cy) in enumerate(ribbons):
    clip(name+'-cut',path)
    layers.append(drift(name,use(name+'-cut'),cx,cy,x=3.8,y=5,rotate=1.8,cycles=3,phase=i*math.pi/2))

# Seated alchemist: paint stays authentic while the silhouette breathes as a body.
figure='M527 354L542 326L568 307L601 296L623 263L660 239L675 221L667 203L689 158L706 137L737 129L767 145L794 182L816 214L865 218L901 235L936 261L965 296L989 338L1010 366L1025 413L1081 452L1109 479L1119 532L1064 567L955 569L873 545L850 506L797 509L769 490L718 504L652 534L601 519L552 497L503 487L467 456L481 416L509 374Z'
clip('alchemist-cut',figure)
eye1='M696 181Q703 175 713 178Q710 187 700 188Z'
eye2='M725 169Q733 162 742 164Q739 173 729 175Z'
pendant='M750 292L780 347L716 347Z'
beads=[(718,262,7),(720,287,7),(717,310,8),(723,330,8),(725,356,7),(733,374,8),(753,382,7),(774,370,8),(778,346,7),(778,324,7),(773,301,8),(770,280,7),(767,260,7),(739,401,8),(737,423,9),(738,448,10)]
mask('figure-detail-holes',hole(eye1,2)+hole(eye2,2)+hole(pendant,2)+''.join(circle_hole(x,y,r+1) for x,y,r in beads))
figure_content=[f'<path d="{figure}" fill="#080808"/>',use('alchemist-cut','figure-detail-holes')]
# Eyes actually close/open and engraved gold follows attention inside safe apertures.
for i,(eye,cx,cy) in enumerate([(eye1,705,183),(eye2,734,170)]):
    clip(f'alchemist-eye-{i}',eye)
    eyeart=f'<path d="{eye}" fill="#171006"/><g clip-path="url(#alchemist-eye-{i})"><g data-am="blink" data-part="alchemist-eye-{i}-blink" data-cx="{cx}" data-cy="{cy}" data-period="6"><path d="{eye}" fill="url(#eye-gold)"/><g data-am="gaze" data-part="alchemist-eye-{i}-gaze" data-x="2" data-y="1"><use href="#paint" clip-path="url(#alchemist-eye-{i})"/></g></g></g>'
    figure_content.append(track(f'alchemist-eye-{i}-loop-guard',eyeart,{'opacity':[[0,0],[.25,0],[.55,1],[23.45,1],[23.75,0],[24,0]]}))
clip('pendant-cut',pendant)
figure_content.append(drift('alchemist-pendant',use('pendant-cut'),750,290,rotate=5,y=1.3,cycles=4))
# Four bead groups swing at different phases along the original chain, not a new necklace.
for i in range(4):
    selected=beads[i::4]
    beadclip=f'beads-{i}-cut'
    defs.append(f'<clipPath id="{beadclip}">'+''.join(f'<circle cx="{x}" cy="{y}" r="{r+1}"/>' for x,y,r in selected)+'</clipPath>')
    figure_content.append(drift(f'alchemist-beads-{i}',use(beadclip),748,257,rotate=1.6,y=1.3,cycles=4,phase=i*math.pi/2))
layers.append(drift('alchemist-body',''.join(figure_content),770,490,y=3.8,rotate=.55,scale=.007,cycles=4))

# Preserve every painted bevel that lies between the hand-traced letter faces.
# The framework is a separate moving texture, never a stationary original duplicate.
word_envelope='M74 705L117 478L224 443L343 467L423 445L532 552L615 552L653 578L662 508L776 562L811 500L878 572L941 532L1002 542L1180 522L1311 483L1398 576L1402 625L1430 642L1443 697L1430 750L1442 882L1430 934L1302 956L1274 883L1170 788L1160 837L1140 906L1118 890L1018 929L1008 850L937 919L858 945L849 799L767 938L706 830L620 842L589 822L519 878L475 916L435 938L407 950L390 934L338 944L325 853L191 818L140 864L96 895L109 780Z'
clip('word-envelope',word_envelope)
lower_ornament_holes=''.join(circle_hole(x,y,r+2) for _,x,y,r,_,_ in pearls if y>600)+circle_hole(767,841,92)+hole('M767 924L785 955L766 986L746 958Z',3)
mask('letter-framework', ''.join(hole(item['path']) for item in letters)+lower_ornament_holes)
mask('word-detail-clear',lower_ornament_holes)
word_layers=[drift('letter-bevel-framework',use('word-envelope','letter-framework'),768,700,x=.6,y=.9,rotate=.05,cycles=4)]
# Native source-paint letter rigs. Larger transforms would expose occluded strokes.
for i,item in enumerate(letters):
    clip(item['id']+'-cut',item['path'])
    motion=item['motion']
    word_layers.append(drift(item['id'],use(item['id']+'-cut','word-detail-clear'),item['cx'],item['cy'],x=motion['x'],y=motion['y'],rotate=motion['rotate'],cycles=4,phase=i*math.pi/5))
layers.extend(word_layers)

# Lower engraved rosette and hanging diamond are independently articulated.
flower='M762 761Q783 770 791 789Q820 783 829 805Q854 814 842 839Q851 860 829 875Q825 898 800 897Q784 921 764 910Q743 924 729 901Q703 897 701 873Q682 860 692 839Q679 817 704 804Q705 783 730 785Q742 763 762 761Z'
clip('rosette-cut',flower)
layers.append(drift('rosette',use('rosette-cut'),767,841,rotate=7,scale=.025,cycles=2))
clip('hanging-diamond-cut','M767 924L785 955L766 986L746 958Z')
layers.append(drift('hanging-diamond',use('hanging-diamond-cut'),767,924,rotate=6,y=2,cycles=4))
# A travelling edge signal ties all nine faces into one transmutation cycle.
letter_line='M144 516L475 553L309 590M442 491L520 627L411 807M552 587L625 764M677 544L713 615Q846 648 731 739M828 540L893 732L938 586L1014 729M1000 589L1056 712L1084 616M1109 585L1359 552M1202 653L1379 651M1209 727L1384 832'
layers.append(trace('letter-face-signal',letter_line,12,2.3,WHITE,.7,'3 97'))
# Reflections move on the actual street plane, never with the word or the camera.
for i,path in enumerate(['M9 967H365M414 990H683','M799 969H1092M1164 992H1520']):
    layers.append(trace(f'water-reflection-{i+1}',path,18+5*i,2,GOLD,.6,'9 91'))

svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1024" data-story-duration="24" aria-hidden="true" focusable="false"><defs>'+''.join(defs)+'</defs>'+''.join(layers)+'</svg>\n'
parsed=ET.fromstring(svg)
nodes=list(parsed.iter())
ids=[node.attrib['id'] for node in nodes if 'id' in node.attrib]
assert len(ids)==len(set(ids))
channels=[node for node in nodes if 'data-am' in node.attrib]
assert len(channels)<80, len(channels)
for node in channels:
    if node.attrib['data-am']=='story':
        for key,keys in json.loads(node.attrib['data-frames']).items():
            assert all(keys[i][0]<=keys[i+1][0] for i in range(len(keys)-1))
            assert keys[0][0]==0 and keys[-1][0]==24
            if key!='rotate' or not node.attrib.get('data-part','').startswith('vinyl-'):
                assert abs(keys[0][1]-keys[-1][1])<.00001,(node.attrib.get('data-part'),key)
(OUT/'transmute.svg').write_text(svg)
parts=[node.attrib.get('data-part') for node in channels]
descriptor={'id':'transmute','title':'TRANSMUTE','poster':PAINT,'svg':'/assets/art-motion/transmute.svg','width':1536,'height':1024,
 'motionSummary':'Every major painted component has its own rig: nine individual wildstyle letters and signature, breathing alchemist with blinking eyes and swinging necklace, turning sun rays, floating moon, leaning microphone, spinning vinyl label and grooves, Ouroboros, orbital pearls, crimson ribbons, rosette, diamond, window lights and street reflections. Original paint is assembled over a restored empty city; there is no stationary full-image duplicate.',
 'assets':[CLEAN],
 'parts':parts,
 'story':{'duration':24,'phases':[{'at':0,'label':'TRANSMUTE / Every element is alive'},{'at':6,'label':'STONE TO SYMBOL / Follow the separate layers'},{'at':12,'label':'VOICE TO FORM / Let the letters move'},{'at':18,'label':'ONE LIVING COMPOSITION / Return and renew'}]}}
(OUT/'transmute-story.json').write_text(json.dumps(descriptor,ensure_ascii=False,indent=2)+'\n')
print(f'Built TRANSMUTE: {len(channels)} independent motion channels over a restored city; 24-second loop.')

"""Mentalism: an imagined world grows from an empty field into the approved paint.

The approved 021.webp is never changed. Thought, blueprint, faceted foundation,
architectural extrusions and celestial connections are individually staged.
The original complete masterpiece is held alive before dissolving back to void.
"""
from pathlib import Path
from html import escape
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
OUT.mkdir(parents=True, exist_ok=True)
DURATION = 24
PAINT = '/assets/masterworks-v2/021.webp'
YELLOW, GOLD, WHITE = '#ffd600', '#e8bc3d', '#fff2b0'


def attrs(**values):
    return ' '.join(f'{key.replace("_", "-")}="{escape(str(value), quote=True)}"' for key, value in values.items())


def track(content, frames, cx=None, cy=None, ease='smooth', **extra):
    properties = {'data_am':'story','data_frames':json.dumps(frames,separators=(',',':')),'data_ease':ease}
    if cx is not None: properties['data_cx'] = cx
    if cy is not None: properties['data_cy'] = cy
    properties.update(extra)
    return f'<g {attrs(**properties)}>{content}</g>'


def outline(d, start, end, fade=7, width=2.6, color=GOLD):
    return f'<path {attrs(data_am="story",data_frames=json.dumps({"opacity":[[0,0],[start,0],[start+.25,.8],[fade,.8],[fade+.7,0]],"dash":[[0,100],[start,100],[end,0]]},separators=(",",":")),data_ease="smooth",d=d,fill="none",stroke=color,stroke_width=width,stroke_dasharray=100,stroke_dashoffset=100,pathLength=100,stroke_linecap="round",stroke_linejoin="round",opacity=0)}/>'


def use(clip=None,mask=None):
    return '<use href="#paint"'+(f' clip-path="url(#{clip})"' if clip else '')+(f' mask="url(#{mask})"' if mask else '')+'/>'


def star(x,y,size=14,color=WHITE):
    return f'<path d="M{x} {y-size}L{x+2} {y-2}L{x+size} {y}L{x+2} {y+2}L{x} {y+size}L{x-2} {y+2}L{x-size} {y}L{x-2} {y-2}Z" fill="{color}" stroke="none"/>'


head = 'M161 573L177 491L253 330L337 513Q439 570 587 587L701 651Q764 659 815 676L876 785L862 935L887 1040L934 1119L883 1187L742 1235L584 1237L467 1211L367 1128L359 1072Q261 1094 207 1049L166 1004L182 952Q154 914 178 875Q146 856 163 823L141 790Q101 779 130 747L176 704Z'
city = 'M264 318Q382 203 561 179L640 122L691 175Q861 188 971 267L1057 331Q1100 447 1060 590L984 707Q868 765 792 663L691 592L586 578L345 514Z'
towers = [
    ('M362 250L384 191L409 248L407 416L365 402Z',386,416,6.2,8.4),
    ('M534 182L550 146L568 181L566 274L536 275Z',551,275,6.9,9.2),
    ('M627 62L640 15L657 66L658 145L627 158Z',642,156,8.5,10.5),
    ('M807 192L827 143L847 194L844 302L810 289Z',828,302,7.4,9.8),
    ('M882 236L904 190L926 235L925 415L884 404Z',905,415,8.0,10.3),
    ('M963 340L988 284L1012 339L1006 482L966 467Z',989,482,8.7,11.0),
    ('M509 435L528 386L551 433L547 553L511 546Z',530,553,6.5,9.1),
    ('M760 431L783 380L806 431L799 588L762 559Z',784,588,7.7,10.3),
    ('M942 451L967 401L990 454L982 556L945 564Z',968,565,9.0,11.4)
]
almond = 'M599 377Q620 353 643 356Q668 355 690 376Q669 394 644 397Q618 395 599 377Z'

defs = [
    f'<image id="paint" href="{PAINT}" width="1254" height="1254"/>',
    f'<clipPath id="head"><path d="{head}"/></clipPath>',
    f'<clipPath id="city"><path d="{city}"/></clipPath>',
    '<linearGradient id="sclera" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8a671b"/><stop offset=".5" stop-color="#f8df87"/><stop offset="1" stop-color="#b78c1c"/></linearGradient>',
    f'<clipPath id="eye-aperture"><path d="{almond}"/></clipPath>',
    '<clipPath id="iris"><circle cx="643" cy="376" r="20"/></clipPath>',
    '<linearGradient id="light"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".48" stop-color="#fff7bc" stop-opacity=".12"/><stop offset=".56" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
    f'<mask id="paint-light" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style="mask-type:luminance"><use href="#paint"/><path d="{almond}" fill="black" stroke="none"/></mask>'
]
for i,(path,cx,cy,start,end) in enumerate(towers):
    defs.append(f'<clipPath id="tower-{i}"><path d="{path}"/></clipPath>')
# Architecture grows first as terraces, then actual towers extrude from their bases.
defs.append('<mask id="terraces" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style="mask-type:luminance"><rect width="1254" height="1254" fill="white"/>'+''.join(f'<path d="{d}" fill="black" stroke="none"/>' for d,*_ in towers)+'</mask>')
for i,(x1,x2) in enumerate([(100,359),(357,594),(592,948)]):
    defs.append(f'<clipPath id="face-part-{i}"><rect x="{x1}" y="320" width="{x2-x1}" height="934"/></clipPath>')
planets = [(357,164,71,8.9),(236,285,30,9.5),(181,459,43,10.0),(1062,251,107,10.5),(1125,384,32,11.0),(972,674,47,11.3),(1016,881,43,11.6),(730,942,62,11.2)]
for i,(cx,cy,r,start) in enumerate(planets):
    defs.append(f'<clipPath id="planet-{i}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>')

layers = ['<rect width="1254" height="1254" fill="#080808" stroke="none"/>']
# A point in the exact location of the final engraved eye is the first visible thought.
seed = '<circle cx="643" cy="376" r="7" fill="#fff2b0" stroke="none"/>'+star(643,376,19)
seed += '<circle cx="643" cy="376" r="27" fill="none" stroke="#ffd600" stroke-width="2"/>'
layers.append(track(seed,{'opacity':[[0,0],[.8,0],[1.25,1],[3.5,1],[5.5,0],[24,0]],'scale':[[0,.05],[.8,.05],[1.4,1],[2.1,.7],[3.4,1.3],[5.5,1.6]]},643,376,opacity=0))
# Blueprint geometry is drawn in actual relationship to the future painted world.
for d,a,b,fade,width,color in [
    ('M643 227L738 422H548ZM643 227V539M548 422H738',1.5,3.2,6.6,3.2,WHITE),
    ('M643 376C643 560 475 825 475 1130',2.3,4.9,7.2,2.6,GOLD),
    ('M536 376A107 107 0 1 1 750 376A107 107 0 1 1 536 376',1.8,3.4,6.6,2.5,YELLOW),
    ('M252 330L177 492L337 513L587 587L701 651L815 676L876 785L862 935L887 1040L934 1119L883 1187L742 1235L584 1237L467 1211L367 1128L359 1072L207 1049L166 1004L182 952L178 875L141 790L176 704L161 573L177 492',2.8,6.0,8.1,3.0,YELLOW),
    ('M178 495L516 665L359 1072M337 513L516 665L815 676M516 665L467 1211M141 790L516 665L207 1049M516 665L742 1235',3.2,6.1,8.0,2.1,GOLD),
    ('M266 318C353 213 777 125 968 267C1052 334 1059 479 973 520C850 589 497 566 345 514',3.7,6.1,10.7,2.5,YELLOW),
    ('M344 514C316 395 564 303 797 333C1040 363 1107 482 985 584C834 710 537 586 507 535',4.1,7.2,11.1,2.5,GOLD),
    ('M530 553V432L528 386M784 588V431L783 380M968 565V454L967 401M386 416V250L384 191M551 275V182L550 146M828 302V192L827 143M905 415V236L904 190M989 482V340L988 284M642 156V62L640 15',4.7,8.5,11.7,2.4,WHITE)
]:
    layers.append(outline(d,a,b,fade,width,color))

# Three faceted regions grow from the chin into a recognisable self, not a flat reveal.
for i,(cx,start,end) in enumerate([(245,3.3,6.4),(475,3.9,7.0),(762,4.5,7.6)]):
    content=f'<g clip-path="url(#head)">{use(f"face-part-{i}")}</g>'
    layers.append(track(content,{'opacity':[[0,0],[start,0],[start+.5,1],[12.5,1],[13.1,0],[24,0]],'scale':[[0,.18],[start,.18],[end,1]],'y':[[0,145],[start,145],[end,0]]},cx,1130,opacity=0))

# Curved streets and arches establish a place, and nine separate painted towers rise.
terraces=f'<g clip-path="url(#city)">{use(mask="terraces")}</g>'
layers.append(track(terraces,{'opacity':[[0,0],[5.4,0],[6.2,1],[12.7,1],[13.2,0],[24,0]],'scale':[[0,.35],[5.4,.35],[9.8,1]],'y':[[0,100],[5.4,100],[9.8,0]]},643,605,opacity=0))
for i,(d,cx,cy,start,end) in enumerate(towers):
    layers.append(track(use(f'tower-{i}'),{'opacity':[[0,0],[start,0],[start+.3,1],[12.7,1],[13.2,0],[24,0]],'scale':[[0,.05],[start,.05],[end,1]],'y':[[0,14],[start,14],[end,0]]},cx,cy,opacity=0))

# Connections extend out into the city and celestial pearls arrive at their own anchors.
for d,start,end in [
    ('M66 614C160 330 463 82 843 111C1138 134 1272 432 1179 660C1051 947 852 1002 664 1020',7.7,11.6),
    ('M110 718C25 533 358 117 641 75C939 28 1172 252 1191 478C1241 799 1024 915 891 911',8.3,12.2),
    ('M181 459C227 295 631 135 1062 251M236 285C186 492 684 630 1125 384M730 942C941 1056 1255 594 972 674',8.8,12.2)
]:
    layers.append(outline(d,start,end,12.4,2.8,GOLD))
for i,(cx,cy,r,start) in enumerate(planets):
    layers.append(track(use(f'planet-{i}'),{'opacity':[[0,0],[start,0],[start+.55,1],[12.7,1],[13.2,0],[24,0]],'scale':[[0,.01],[start,.01],[start+.8,1]]},cx,cy,opacity=0))

# A complete living masterpiece replaces the exactly aligned construction pieces.
world=[use(),f'<path d="{almond}" fill="#080703" stroke="none"/>',
       f'<g clip-path="url(#eye-aperture)"><g data-am="blink" data-cx="643" data-cy="376" data-period="7.1"><path d="{almond}" fill="url(#sclera)" stroke="none"/><g data-am="gaze" data-x="8" data-y="4"><use href="#paint" clip-path="url(#iris)"/></g></g></g>',
       '<path data-am="lid" data-period="7.1" d="M601 377Q643 392 688 376" fill="none" stroke="#e5c64d" stroke-width="2.5" stroke-linecap="round" opacity="0"/>']
for d,speed in [('M277 320C290 223 624 198 804 252C901 283 817 319 714 317',10),('M516 440C427 369 568 319 766 328C1000 342 1046 439 968 471',-8),('M425 492C425 559 702 590 914 571C1074 550 1122 456 1063 425',9)]:
    world.append(f'<path data-am="trace" data-speed="{speed}" d="{d}" pathLength="100" fill="none" stroke="#fff0a1" stroke-width="2.7" stroke-linecap="round" stroke-dasharray="8 92" opacity=".75"/>')
world.append('<g mask="url(#paint-light)"><g data-am="shine" data-start="-450" data-end="1700" data-period="8.5" opacity="0"><path d="M0 -80H145L-100 1330H-245Z" fill="url(#light)" stroke="none"/></g></g>')
# The activated wave and sparks are always inside the world guard, so void stays void.
world.append('<g data-am="wave" data-radius="310" opacity="0"><circle cx="643" cy="376" r="0" fill="none" stroke="#ffe165" stroke-width="2.3"/><circle cx="643" cy="376" r="0" fill="none" stroke="#e71932" stroke-width="1.4"/></g>')
for i in range(6):
    world.append(f'<path data-am="spark" data-cx="643" data-cy="376" data-angle="{i*60+15}" data-radius="{210+i%2*55}" d="M0 -5 1.5 -1 6 0 1.5 2 0 7-1.5 2-6 0-1.5 -1Z" fill="#fff1b2" stroke="none" opacity="0"/>')
layers.append(track(''.join(world),{'opacity':[[0,0],[11.8,0],[13.15,1],[20.7,1],[23.3,0],[24,0]],'scale':[[0,.985],[11.8,.985],[13.15,1],[20.7,1],[23.3,.92],[24,.92]]},643,730,opacity=0,data_story_part='masterpiece'))
# When the world dissolves, one small thought remains briefly, then true black returns.
layers.append(track('<circle cx="643" cy="376" r="6" fill="#fff2b0" stroke="none"/>'+star(643,376,15),{'opacity':[[0,0],[20.9,0],[21.6,.75],[22.3,.75],[23.25,0],[24,0]],'scale':[[0,1],[21,1],[23.25,.08]]},643,376,opacity=0))

svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" data-story-duration="{DURATION}" aria-hidden="true" focusable="false"><defs>'+''.join(defs)+'</defs>'+''.join(layers)+'</svg>\n'
ET.fromstring(svg)
(OUT/'mentalism.svg').write_text(svg)
descriptor = {
    'id':'mentalism','title':'Mentalism','poster':PAINT,'svg':'/assets/art-motion/mentalism.svg','width':1254,'height':1254,
    'motionSummary':'An empty black field becomes a thought, a drawn geometric framework, a growing faceted self, nine rising architectural towers and a connected celestial city. The complete approved masterpiece stays alive, then returns to possibility.',
    'story':{'duration':DURATION,'phases':[
        {'at':0,'label':'VOID / An open field of possibility'},
        {'at':.8,'label':'THOUGHT / A point of attention'},
        {'at':2.1,'label':'GEOMETRY / An idea finds structure'},
        {'at':3.7,'label':'FORM / A self takes shape'},
        {'at':6.3,'label':'WORLD / Architecture rises from the mind'},
        {'at':13.15,'label':'CREATION / The imagined world is alive'},
        {'at':20.7,'label':'RETURN / Form becomes possibility'}
    ]}
}
(OUT/'mentalism-story.json').write_text(json.dumps(descriptor,ensure_ascii=False,indent=2)+'\n')
print('Built Mentalism: 24-second world-growth story, black void, faceted self, nine towers, eight celestial anchors and living masterpiece.')

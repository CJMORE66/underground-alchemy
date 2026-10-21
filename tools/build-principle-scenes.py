"""Native SVG motion compositing for seven approved CAISIK principle paintings.

The source rasters stay untouched. Circular interiors can rotate without revealing
unpainted content; silhouette cuts move only a few source pixels. This is not a
vector redraw of the source artwork and never invents hidden painted surfaces.
"""
from pathlib import Path
from html import escape
import json
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 1254
GOLD = '#fff0a1'
YELLOW = '#ffd600'


def attrs(**values):
    return ' '.join(f'{key.replace("_", "-")}="{escape(str(value), quote=True)}"' for key, value in values.items())


def path(d, stroke=GOLD, width=2, **extra):
    return f'<path {attrs(d=d, fill="none", stroke=stroke, stroke_width=width, stroke_linecap="round", stroke_linejoin="round", **extra)}/>'


def circle(cx, cy, r, **extra):
    return f'<circle {attrs(cx=cx, cy=cy, r=r, **extra)}/>'


class Scene:
    def __init__(self, key, title, asset, summary, center=(627, 627)):
        self.key, self.title, self.asset, self.summary, self.center = key, title, asset, summary, center
        self.poster = f'/assets/masterworks-v2/{asset}.webp'
        self.defs = [f'<image id="paint" href="{self.poster}" width="1254" height="1254"/>',
            '<linearGradient id="sweep"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".46" stop-color="#fffbd6" stop-opacity=".3"/><stop offset=".55" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
            '<linearGradient id="sclera" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8a671b"/><stop offset=".5" stop-color="#f8df87"/><stop offset="1" stop-color="#b78c1c"/></linearGradient>',
            '<mask id="paint-light" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style="mask-type:luminance"><use href="#paint"/></mask>']
        self.holes, self.layers = [], []
        self.counter = 0

    def cut(self, shape, kind, **motion):
        self.counter += 1
        name = f'cut-{self.counter}'
        self.defs.append(f'<clipPath id="{name}">{shape}</clipPath>')
        self.holes.append(shape.replace('<path ', '<path fill="black" ').replace('<circle ', '<circle fill="black" '))
        self.layers.append(f'<g {attrs(data_am=kind, **motion)}><use href="#paint" clip-path="url(#{name})"/></g>')

    def orb(self, cx, cy, r, speed):
        # Only the painted interior moves: its circular crop always covers the same pixels.
        self.cut(circle(cx, cy, r), 'rotate', data_cx=cx, data_cy=cy, data_speed=speed)

    def trace(self, d, speed=12, dash='7 93', width=2.5, color=GOLD):
        self.layers.append(path(d, color, width, pathLength=100, stroke_dasharray=dash, data_am='trace', data_speed=speed))

    def pulse(self, d, period=4, phase=0, lo=.05, hi=.7, width=2.5, color=GOLD):
        self.layers.append(path(d, color, width, data_am='pulse', data_min=lo, data_max=hi, data_period=period, data_phase=phase))

    def eye(self, cx, cy, almond, iris_radius, lid):
        # A travelling shine must not expose the original stationary iris while
        # the native aperture is closed or looking in a different direction.
        self.defs = [definition.replace('</mask>', f'<path d="{almond}" fill="black" stroke="none"/></mask>') if 'id="paint-light"' in definition else definition for definition in self.defs]
        self.defs.extend([f'<clipPath id="eye-aperture"><path d="{almond}" fill="black"/></clipPath>',
            f'<clipPath id="iris">{circle(cx,cy,iris_radius)}</clipPath>'])
        # Aperture patch is restricted to the iris/sclera area; surrounding engraved rays remain original.
        self.layers.extend([f'<path d="{almond}" fill="#080703" stroke="none"/>',
            f'<g clip-path="url(#eye-aperture)"><g {attrs(data_am="blink",data_cx=cx,data_cy=cy,data_period=8.2)}><path d="{almond}" fill="url(#sclera)" stroke="none"/><g {attrs(data_am="gaze",data_x=8,data_y=4)}><use href="#paint" clip-path="url(#iris)"/></g></g></g>',
            path(lid,'#e5c64d',2.5,data_am='lid',data_period=8.2,opacity=0)])

    def finish(self):
        self.defs.append('<mask id="still" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style="mask-type:luminance"><rect width="1254" height="1254" fill="white"/>'+''.join(self.holes)+'</mask>')
        cx,cy = self.center
        accents = f'<g mask="url(#paint-light)"><g {attrs(data_am="shine",data_start=-450,data_end=1700,data_period=10.5)} opacity="0"><path d="M0 -80H145L-100 1330H-245Z" fill="url(#sweep)" stroke="none"/></g></g>'
        accents += f'<g {attrs(data_am="wave",data_radius=300)} opacity="0">{circle(cx,cy,0,fill="none",stroke="#ffe165",stroke_width=2.3)}{circle(cx,cy,0,fill="none",stroke="#e71932",stroke_width=1.4)}</g>'
        for i in range(6):
            accents += f'<path d="M0 -5 1.5 -1 6 0 1.5 2 0 7-1.5 2-6 0-1.5 -1Z" fill="#fff1b2" stroke="none" opacity="0" {attrs(data_am="spark",data_cx=cx,data_cy=cy,data_angle=i*60+15,data_radius=200+(i%2)*70)}/>'
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" aria-hidden="true" focusable="false"><defs>{"".join(self.defs)}</defs><use href="#paint" mask="url(#still)"/>{"".join(self.layers)}{accents}</svg>\n'
        ET.fromstring(svg)
        (OUT/f'{self.key}.svg').write_text(svg)
        return {'id':self.key,'title':self.title,'poster':self.poster,'svg':f'/assets/art-motion/{self.key}.svg','width':1254,'height':1254,'motionSummary':self.summary}


scenes=[]

s=Scene('mentalism','Mentalism','021','The engraved eye opens, blinks and follows attention; celestial interiors turn while a light travels the architectural spiral.',(643,377))
s.orb(357,164,52,6)
s.orb(776,142,20,-12)
s.eye(643,376,'M599 377Q620 353 643 356Q668 355 690 376Q669 394 644 397Q618 395 599 377Z',20,'M601 377Q643 392 688 376')
s.trace('M277 320C290 223 624 198 804 252C901 283 817 319 714 317',10,'7 93',2.5)
s.trace('M516 440C427 369 568 319 766 328C1000 342 1046 439 968 471',-8,'9 91',2.3)
s.trace('M425 492C425 559 702 590 914 571C1074 550 1122 456 1063 425',9,'8 92',2.2)
s.pulse('M641 226V269M620 248H662',4.5,0,.05,.8,2.5)
s.pulse('M640 508V555M620 535H663',4.5,2,.05,.7,2.4)
scenes.append(s.finish())

s=Scene('correspondence','Correspondence','022','Mirrored stair lights answer one another; the central compass and two vanishing-point stars turn within the original architecture.',(626,611))
s.orb(626,611,123,8)
s.orb(627,212,35,9)
s.orb(627,1013,35,-9)
s.trace('M443 125Q626 -16 811 125M344 285Q282 450 197 610',10,'5 95',2.2)
s.trace('M1057 611Q971 840 916 923Q824 1168 627 1171',-10,'5 95',2.2)
for i,(x1,y,x2) in enumerate([(580,306,672),(552,351,701),(523,398,730)]):
    s.pulse(f'M{x1} {y}H{x2}',3.2,-i*.9,.02,.65,3)
    s.pulse(f'M{x1} {1254-y}H{x2}',3.2,-i*.9,.02,.65,3)
scenes.append(s.finish())

s=Scene('vibration','Vibration','023','The two tuning-fork tines quiver in opposition; painted wave fronts breathe and luminous vibration moves out across the rings.',(627,505))
s.cut('<path d="M546 261H579V621Q578 675 605 687L597 700Q542 687 542 641Z"/>','float',data_x=2.1,data_y=0,data_period=1.1,data_phase=0)
s.cut('<path d="M672 261H706L709 642Q706 684 657 700L650 687Q677 671 674 622Z"/>','float',data_x=2.1,data_y=0,data_period=1.1,data_phase=math.pi)
s.orb(341,255,39,10)
s.orb(914,255,38,-10)
s.orb(627,983,49,7)
for i,(left,right) in enumerate([('M522 441C442 417 427 519 499 564','M731 441C812 417 827 519 755 564'),('M484 405C355 381 325 572 482 612','M769 405C898 381 928 572 771 612'),('M455 375C254 325 192 632 460 652','M798 375C999 325 1061 632 793 652')]):
    s.pulse(left,3.4,-i*.85,.02,.65,2.7)
    s.pulse(right,3.4,-i*.85,.02,.65,2.7)
s.trace('M627 150A457 457 0 0 1 1084 607A457 457 0 0 1 627 1064',10,'5 95',2.6)
s.trace('M627 150A457 457 0 0 0 170 607A457 457 0 0 0 627 1064',10,'5 95',2.6)
scenes.append(s.finish())

s=Scene('polarity','Polarity','024','Opposed crescent surfaces catch travelling light, two orbital pearls turn in contrary directions and the central compass holds their shared axis.',(627,599))
s.orb(537,399,43,8)
s.orb(790,703,27,-8)
s.orb(947,233,27,-10)
s.orb(201,879,29,10)
s.orb(627,599,57,8)
s.trace('M360 500C362 367 545 220 829 207C583 219 470 310 465 374',10,'5 95',3)
s.trace('M735 312C877 329 1041 503 1046 673C1010 560 925 419 824 380',-10,'6 94',3)
s.trace('M1082 866C1162 954 890 958 677 871C421 782 137 716 86 809',12,'9 91',3)
s.trace('M427 624C247 641 57 725 89 810',12,'8 92',2.5)
s.pulse('M626 552V647M584 598H670',5.1,0,.02,.75,2.2)
scenes.append(s.finish())

s=Scene('rhythm','Rhythm','025','The actual painted pendulum swings from its pin; small orbiting clock interiors turn and sequential gold arcs mark a silent visual rhythm.',(627,251))
# The moving silhouette follows the painted rod and faceted bob. The small angle
# keeps unrecovered background detail from becoming visible at its boundary.
pendulum='M621 256Q641 245 655 267L684 346L704 394L720 468L743 526L760 562L788 594L781 637L814 671Q916 677 986 756L1045 796L1063 838L1042 904Q1027 1004 929 1047L941 1117L930 1174L900 1134L858 1085Q762 1070 710 1020Q646 968 625 892L618 849L638 818Q643 746 695 711L749 676L745 655L714 626L711 592L690 553L679 499L658 440L650 394L629 341L627 301Z'
s.cut(f'<path d="{pendulum}"/>','swing',data_cx=627,data_cy=251,data_amp=.65,data_period=3.1,data_phase=0)
s.orb(291,620,31,12)
s.orb(400,733,45,-10)
s.orb(571,845,55,8)
s.trace('M292 545A75 75 0 1 1 291 695A75 75 0 1 1 292 545',15,'10 90',2.7)
s.trace('M401 646A87 87 0 1 1 400 820A87 87 0 1 1 401 646',-15,'10 90',2.7)
s.pulse('M290 541Q316 737 432 912',3.1,0,.02,.6,3)
s.pulse('M401 642Q419 842 535 975',3.1,math.pi,.02,.65,3)
s.pulse('M620 149V171M620 215V236M600 193H578M664 193H642',3.1,0,.03,.7,2.4)
scenes.append(s.finish())

s=Scene('cause-effect','Cause and Effect','026','A phased ripple passes through the five painted dominoes; solar and compass interiors rotate while light follows the chain of consequence.',(643,971))
dominoes=[
 ('M162 301L244 272L398 391L410 846L246 862L139 803Z',261,854,.52,0),
 ('M414 456L493 411L589 494L653 820L559 826L463 778Z',560,824,.63,-.55),
 ('M602 553L658 505L762 562L834 844L738 864L662 807Z',747,853,.76,-1.1),
 ('M800 650L851 610L942 659L1012 873L929 889L874 842Z',932,886,.85,-1.65),
 ('M966 729L992 687L1088 743L1172 925L1099 911L1045 841Z',1113,920,.95,-2.2)
]
for d,cx,cy,amp,phase in dominoes:
    s.cut(f'<path d="{d}"/>','swing',data_cx=cx,data_cy=cy,data_amp=amp,data_period=5.2,data_phase=phase)
s.orb(486,285,50,7)
s.orb(643,971,45,-10)
s.trace('M85 481C222 94 739 139 999 439',11,'6 94',2.5)
s.trace('M484 136A149 149 0 0 1 632 285A149 149 0 0 1 483 434',-13,'8 92',2.5)
s.trace('M335 951Q641 1082 1002 961',14,'7 93',2.8)
scenes.append(s.finish())

s=Scene('gender','Gender / Creative Modes','027','Organic veins breathe against precise geometric edges; leaf interiors sway while the central red seed and outer pearls turn.',(627,630))
s.cut('<path d="M398 143C440 109 488 139 516 177C545 210 532 254 518 279C499 247 476 222 460 195C443 172 421 161 398 143Z"/>','swing',data_cx=519,data_cy=279,data_amp=1.2,data_period=5.4,data_phase=0)
s.cut('<path d="M377 298C428 277 467 315 488 361C512 408 535 464 527 522C513 485 468 448 453 415C438 374 413 341 377 298Z"/>','swing',data_cx=527,data_cy=522,data_amp=.8,data_period=5.4,data_phase=1.2)
s.orb(626,629,30,11)
s.orb(627,204,40,-8)
s.orb(161,769,34,8)
s.trace('M400 152C457 172 501 217 516 274',10,'9 91',2.3)
s.trace('M435 330C491 378 512 439 525 506',11,'10 90',2.3)
s.trace('M214 1012C244 908 318 841 441 806',12,'10 90',2.5)
s.trace('M741 194L684 348L716 377L808 294L817 404L732 473',-10,'7 93',2.7)
s.trace('M846 516L939 490L1046 627L1120 652L984 709L1031 853',10,'7 93',2.7)
s.pulse('M627 562V592M600 631H657M627 662V696',5.4,0,.02,.7,2.4)
scenes.append(s.finish())

(OUT/'principles.json').write_text(json.dumps(scenes,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(scenes)} original-painting SVG scenes.')
for item in scenes:
    svg=ET.parse(OUT/f'{item["id"]}.svg').getroot()
    channels=[n.attrib['data-am'] for n in svg.iter() if 'data-am' in n.attrib]
    print(item['id'],len(channels),'channels:',', '.join(sorted(set(channels))))

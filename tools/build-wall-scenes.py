"""Native SVG motion passes for seven approved CAISIK Living Wall paintings.

Original rasters are never rewritten. Geometry follows painted details; eyes use
safe inset apertures and original engraved iris paint. All clocks belong to the
shared browser runtime, so reduced-motion and pause controls remain authoritative.
"""
from pathlib import Path
from html import escape
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
OUT.mkdir(parents=True, exist_ok=True)
GOLD = '#ffe768'
WHITE = '#fff5c2'
RED = '#e71932'


def am(kind, **attrs):
    return ' '.join([f'data-am="{kind}"'] + [f'data-{key.replace("_", "-")}="{value}"' for key, value in attrs.items()])


class Scene:
    def __init__(self, ident, title, poster, width, height, center):
        self.ident, self.title, self.poster = ident, title, poster
        self.w, self.h, self.center = width, height, center
        self.defs = [f'<image id="paint" href="{poster}" width="{width}" height="{height}"/>',
                     '<linearGradient id="sweep"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff9db" stop-opacity=".1"/><stop offset=".58" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
                     '<linearGradient id="sclera" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#151006"/><stop offset=".55" stop-color="#edcf71"/><stop offset="1" stop-color="#f6e9b2"/></linearGradient>']
        self.layers = ['<use href="#paint"/>']
        self.exclude = []
        self.serial = 0

    def new(self, prefix):
        self.serial += 1
        return f'{prefix}-{self.serial}'

    def trace(self, path, speed=12, color=WHITE, width=2.4, opacity=.65, dash='5 95'):
        self.layers.append(f'<path {am("trace", speed=speed)} d="{path}" pathLength="100" fill="none" stroke="{color}" stroke-width="{width}" stroke-dasharray="{dash}" stroke-linecap="round" opacity="{opacity}"/>')

    def pulse(self, geometry, period=4, phase=0, low=.05, high=.75):
        self.layers.append(f'<g {am("pulse", period=period, phase=phase, min=low, max=high)}>{geometry}</g>')

    def glint(self, x, y, radius=14, period=4, phase=0):
        self.pulse(f'<path d="M{x} {y-radius}L{x+2} {y-2}L{x+radius} {y}L{x+2} {y+2}L{x} {y+radius}L{x-2} {y+2}L{x-radius} {y}L{x-2} {y-2}Z" fill="{WHITE}" stroke="none"/>', period, phase, .08, .85)

    def interior_motion(self, path, kind, **attrs):
        """Move only a safely inset paint patch, keeping the object silhouette fixed."""
        cut = self.new('interior')
        self.defs.append(f'<clipPath id="{cut}"><path d="{path}"/></clipPath>')
        self.layers.append(f'<g clip-path="url(#{cut})"><g {am(kind, **attrs)}><use href="#paint"/></g></g>')

    def eye(self, path, cx, cy, radius, pivot_y, period=8, phase=0, gaze_x=9, gaze_y=4):
        aperture, iris = self.new('eye'), self.new('iris')
        self.defs.extend([f'<clipPath id="{aperture}"><path d="{path}"/></clipPath>', f'<clipPath id="{iris}"><circle cx="{cx}" cy="{cy}" r="{radius}"/></clipPath>'])
        self.exclude.append(f'<path d="{path}" fill="black"/>')
        self.layers.append(f'<path d="{path}" fill="#080704" stroke="none"/><g clip-path="url(#{aperture})"><g {am("blink", cx=cx, cy=pivot_y, period=period, phase=phase)}><path d="{path}" fill="url(#sclera)" stroke="none"/><g {am("gaze", x=gaze_x, y=gaze_y)}><use href="#paint" clip-path="url(#{iris})"/></g></g></g>')
        # The closed lid remains inside the original painted lash boundary.
        lid_width = radius * 2.3
        self.layers.append(f'<path {am("lid", cx=cx, cy=pivot_y, period=period, phase=phase)} d="M{cx-lid_width/2:g} {pivot_y:g}Q{cx:g} {pivot_y+radius*.21:g} {cx+lid_width/2:g} {pivot_y:g}" fill="none" stroke="#d7b631" stroke-width="2" stroke-linecap="round" opacity="0"/>')

    def shine(self, period=9, region=None):
        mask = self.new('luminance')
        extra = ''.join(self.exclude)
        self.defs.append(f'<mask id="{mask}" maskUnits="userSpaceOnUse" x="0" y="0" width="{self.w}" height="{self.h}" style="mask-type:luminance"><use href="#paint"/>{extra}</mask>')
        sweep = f'<g {am("shine", start=-self.w*.35, end=self.w*1.4, period=period)} opacity="0"><path d="M0 -40H{self.w*.13:g}L{-self.h*.2+self.w*.13:g} {self.h+40}H{-self.h*.2:g}Z" fill="url(#sweep)" stroke="none"/></g>'
        if region:
            clip = self.new('shine-area')
            self.defs.append(f'<clipPath id="{clip}"><path d="{region}"/></clipPath>')
            sweep = f'<g clip-path="url(#{clip})">{sweep}</g>'
        self.layers.append(f'<g mask="url(#{mask})">{sweep}</g>')

    def activation(self, radius=None, sparks=6):
        x, y = self.center
        radius = radius or min(self.w, self.h) * .3
        self.layers.append(f'<g {am("wave", radius=radius)} opacity="0"><circle cx="{x}" cy="{y}" r="0" fill="none" stroke="{GOLD}" stroke-width="2.8"/><circle cx="{x}" cy="{y}" r="0" fill="none" stroke="{RED}" stroke-width="1.3"/></g>')
        for i in range(sparks):
            self.layers.append(f'<path {am("spark", cx=x, cy=y, angle=i*360/sparks+17, radius=radius*(.7+(i%2)*.15))} d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="{WHITE}" stroke="none" opacity="0"/>')

    def save(self, summary):
        content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" aria-hidden="true" focusable="false"><defs>\n' + '\n'.join(self.defs) + '\n</defs>\n' + '\n'.join(self.layers) + '\n</svg>\n'
        ET.fromstring(content)
        (OUT / f'{self.ident}.svg').write_text(content)
        return {'id': self.ident, 'title': self.title, 'poster': self.poster, 'svg': f'/assets/art-motion/{self.ident}.svg', 'width': self.w, 'height': self.h, 'motionSummary': summary}


scenes = []

# 072: two interlocking triangles, mirrored meridian, and the engraved orbit.
s = Scene('as-above', 'AS ABOVE / SO BELOW', '/assets/masterworks-v2/072.webp', 1312, 1199, (656, 607))
s.trace('M300 635L656 145 1008 635 811 628 M1008 674L656 1063 300 674 486 682', 8, WHITE, 3.2, .8, '8 92')
s.trace('M656 153V1063M463 558H850M521 743H797', -14, GOLD, 2, .65, '4 96')
# Tiny moving hands sit inside the painted dial; the triangular silhouettes stay fixed.
s.layers.append(f'<g {am("rotate", cx=656, cy=607, speed=8)}><path d="M656 491V513M656 701V723M540 607H562M750 607H772" fill="none" stroke="{WHITE}" stroke-width="2" opacity=".6"/></g>')
s.glint(655, 382, 25, 4.8)
s.glint(655, 850, 22, 4.8, 3.14159)
s.trace('M175 521C170 289 367 128 620 128M691 128C944 128 1144 292 1130 521M1130 521C1148 802 979 1016 700 1074M611 1074C343 1014 160 804 175 521', 9, WHITE, 1.8, .5, '2 98')
s.shine(10)
s.activation(285)
scenes.append(s.save('Opposed triangle edge illumination, mirrored meridian, rotating dial hands, alternating star points and a luminance-masked paint sweep.'))

# Transmute: the original illustrated scene and lettering remain intact.
s = Scene('transmute', 'TRANSMUTE', '/assets/atlas/transmute-approved.webp', 1536, 1024, (767, 625))
s.trace('M149 515L471 552 306 588M522 517L660 748M728 553Q908 597 754 702M955 555L1052 710M1200 575L1381 555M227 821L377 772M1001 788L1117 778', 14, WHITE, 2.5, .65, '5 95')
# The halo sweep follows the actual painted disc and stays behind the central hood.
s.trace('M543 237C535 127 614 45 716 26M815 35C928 75 990 143 1001 235', 8, WHITE, 2.3, .6, '7 93')
s.layers.append(f'<g clip-path="url(#vinyl-pass)"><g {am("rotate", cx=1210, cy=400, speed=18)}><path d="M1114 386A100 100 0 0 1 1240 306M1188 492A96 96 0 0 0 1303 378" fill="none" stroke="{WHITE}" stroke-width="3" opacity=".45"/></g></g>')
s.defs.append('<clipPath id="vinyl-pass"><ellipse cx="1210" cy="400" rx="104" ry="110"/></clipPath>')
s.pulse('<path d="M703 177L712 175M728 169L739 165" fill="none" stroke="#fff0a0" stroke-width="4" stroke-linecap="round"/>', 4.4, 0, .1, .8)
s.glint(1045, 237, 20, 6)
s.glint(747, 329, 12, 3.6)
# Passing water strokes sit on the painted reflections, below the letter drips.
s.trace('M80 973H361M428 990H697M831 971H1083M1167 986H1473', 20, GOLD, 1.8, .5, '9 91')
s.shine(8.5, 'M60 455H1464V952H60Z')
s.activation(350)
scenes.append(s.save('Letter-face highlights, painted halo tracing, moving vinyl groove glints, glowing alchemist eyes and pendant, and rippling street reflections.'))

# Frame the City: window-by-window illumination inside the hand-built frame.
s = Scene('map-territory', 'THE MAP IS NOT THE TERRITORY', '/assets/masterworks-v2/089.webp', 1536, 1024, (781, 497))
s.trace('M531 420V565L579 550 629 572M697 362V543L728 550V435L751 437V506M850 328V563L874 559V491M914 270V517', 11, WHITE, 2, .6, '7 93')
for phase, d in enumerate([
    'M384 447V484H400V444Z M447 456V474H458V451Z M432 545V559H443V542Z',
    'M627 525V551H638V523Z M723 607V633H736V604Z M780 606V627H787V603Z',
    'M840 398V424H847V395Z M850 508V536H858V504Z M960 406V433H969V404Z',
    'M1043 316V338H1051V313Z M1077 263V282H1084V261Z M1245 454V476H1253V450Z'
]):
    s.pulse(f'<path d="{d}" fill="#fff1a1" stroke="none"/>', 5.2+phase*.6, phase*1.3, .05, .55)
s.trace('M604 116Q783 1 957 116M957 116Q1066 225 1038 338', 8, WHITE, 2, .55, '6 94')
s.glint(783, 56, 24, 5)
s.glint(1130, 270, 24, 5, 2)
s.glint(453, 745, 22, 6.6, 3.4)
s.shine(11, 'M220 125H1305V854H220Z')
s.activation(300)
scenes.append(s.save('Staggered light inside the real city windows, travelling architectural linework, the framed skyline halo and alternating compass-star glints.'))

# Know Thyself: original iris engraving, protected by small inset eye apertures.
s = Scene('know-thyself', 'KNOW THYSELF', '/assets/masterworks-v2/005.webp', 1536, 1024, (768, 531))
s.eye('M600 518Q661 478 727 529Q661 560 600 518Z', 669, 518, 39, 524, 8.3, 0, 8, 3)
s.eye('M810 529Q875 478 947 518Q882 560 810 529Z', 873, 518, 39, 524, 8.3, 0, 8, 3)
s.trace('M150 276L325 269 231 425M411 202L581 410M679 266L724 422M818 278Q941 300 869 420M1029 271L1183 448 1260 276', 12, WHITE, 2.4, .6, '4 96')
s.trace('M87 597L267 608 183 719M365 627L503 817M620 694Q797 636 770 759M885 654L1100 607M1204 622L1374 655', -12, WHITE, 2.4, .6, '4 96')
s.glint(767, 531, 20, 4.8)
s.trace('M545 196Q770 6 992 196M483 859Q767 1011 1059 857', 8, GOLD, 2, .55, '5 95')
s.shine(9)
s.activation(300)
scenes.append(s.save('Two engraved eyes open, blink and follow attention; distinct upper/lower word highlights, a pulsing central star and travelling compass arcs.'))

# Shadow Work: preserve the deliberately closed portrait eye and the mask silhouette.
s = Scene('shadow-work', 'SHADOW WORK', '/assets/masterworks-v2/033.webp', 1254, 1254, (538, 850))
s.eye('M566 141Q600 119 635 141Q603 163 566 141Z', 602, 141, 12, 141, 9.7, 0, 2, 1)
s.eye('M516 849Q536 831 558 849Q538 862 516 849Z', 537, 848, 11, 849, 9.7, 0, 2, 1)
s.trace('M963 263L992 305 1017 289M960 348L983 390 978 430 1010 463M1078 273L1103 313 1102 364M1005 484L1027 515', 9, WHITE, 2, .45, '5 95')
s.trace('M302 421L448 281 580 272M381 518L460 654 590 698M688 283L769 408 771 493M228 796L374 746 496 760M779 755L882 711 935 781', 10, GOLD, 2.2, .5, '4 96')
s.trace('M283 334A353 353 0 0 1 913 320M863 577A354 354 0 0 1 827 665', -7, WHITE, 2, .5, '5 95')
s.layers.append(f'<g {am("rotate", cx=620, cy=973, speed=-6)}><path d="M548 910A98 98 0 0 1 693 1040M536 1000A90 90 0 0 0 575 1048" fill="none" stroke="{WHITE}" stroke-width="1.7" opacity=".4"/></g>')
s.shine(10, 'M278 248H1150V1090H278Z')
s.activation(260)
scenes.append(s.save('Watchful triangle and pendant eyes, light travelling through mask cracks and hood folds, engraved halo traces and a crescent-dial glint.'))

# Inward Eyes: large, deliberately engraved gaze; both eyes blink together.
s = Scene('omerta-ego', 'OMERTÀ WITH THE EGO', '/assets/masterworks-v2/039.webp', 1600, 800, (800, 414))
s.eye('M400 345Q468 326 533 337Q585 350 623 410Q565 422 508 417Q430 412 400 345Z', 528, 350, 66, 385, 8.7, 0, 12, 5)
s.eye('M1200 345Q1132 326 1067 337Q1015 350 977 410Q1035 422 1092 417Q1170 412 1200 345Z', 1072, 350, 66, 385, 8.7, 0, 12, 5)
s.eye('M748 417Q800 374 855 417Q800 454 748 417Z', 800, 414, 22, 417, 8.7, 0, 4, 2)
s.trace('M353 224L604 289 522 214M1247 224L996 289 1078 214M288 521L551 466 428 553M1312 521L1049 466 1172 553', 13, WHITE, 2.6, .6, '6 94')
s.layers.append(f'<g {am("rotate", cx=800, cy=414, speed=9)}><path d="M800 348V357M800 471V480M734 414H743M857 414H866" fill="none" stroke="{WHITE}" stroke-width="2" opacity=".65"/></g>')
s.trace('M563 128Q800 28 1042 128M560 572Q800 698 1040 571', 9, GOLD, 2.2, .6, '5 95')
s.shine(11)
s.activation(270)
scenes.append(s.save('Paired large engraved irises track the pointer and blink together, a third eye opens, lettering carries mirrored highlights and the central dial turns.'))

# Rooftop Frequency: real window openings, antenna routes and vinyl light.
s = Scene('city-remembers', 'THE CITY REMEMBERS', '/assets/masterworks-v2/049.webp', 1254, 1254, (655, 846))
window_sets = [
    'M234 794L261 782V829L234 841Z M332 767L351 761V809L332 815Z',
    'M463 708L486 698V746L463 754Z M730 741L748 733V779L730 789Z',
    'M474 490L491 484V509L474 516Z M475 524L492 518V578L475 585Z',
    'M808 769L829 774V839L808 829Z M579 486L590 490V515L579 512Z'
]
for i, path in enumerate(window_sets):
    s.pulse(f'<path d="{path}" fill="#fff4a7" stroke="none"/>', 5.4+i*.7, i*1.2, .02, .65)
s.trace('M545 164V300L590 312V349M591 43V289M1080 428V565M990 912L971 960 925 948 900 1007 860 994 833 1047', 15, WHITE, 2.2, .6, '8 92')
s.trace('M328 430Q312 361 393 366Q435 378 442 400', 20, WHITE, 2, .65, '12 88')
s.layers.append(f'<g clip-path="url(#rooftop-vinyl)"><g {am("rotate", cx=350, cy=400, speed=14)}><path d="M269 376A95 95 0 0 1 421 343M279 443A90 90 0 0 0 428 425" fill="none" stroke="{WHITE}" stroke-width="2.4" opacity=".5"/></g></g>')
s.defs.append('<clipPath id="rooftop-vinyl"><path d="M245 319Q344 282 448 365L454 417 374 410Q322 404 307 456L247 418Z"/></clipPath>')
s.glint(367, 191, 22, 5.7)
s.glint(1148, 547, 18, 5.7, 2.9)
s.glint(655, 1010, 23, 6.8, 1)
s.shine(12, 'M135 222H1170V1110H135Z')
s.activation(290)
scenes.append(s.save('Staggered apartment lights, antenna and staircase signals, vinyl groove glints, rooftop compass flashes and a restrained architectural light pass.'))

(OUT / 'wall.json').write_text(json.dumps(scenes, ensure_ascii=False, indent=2) + '\n')
print(f'Built {len(scenes)} Living Wall motion scenes without changing approved paint.')

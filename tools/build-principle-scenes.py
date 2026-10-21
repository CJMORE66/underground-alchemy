"""Author readable principle stories around the approved CAISIK paintings.

The original WebPs are untouched. Large semantic motions use complete native or
clipped objects against a reconstructed stationary scene, not duplicate ghosts.
"""
from pathlib import Path
from html import escape
import json
import math
import runpy
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
OUT.mkdir(parents=True, exist_ok=True)
GOLD, YELLOW, WHITE, RED = '#fff0a1', '#ffd600', '#fff8d5', '#e71932'


def at(**values):
    return ' '.join(f'{k.replace("_", "-")}="{escape(str(v), quote=True)}"' for k, v in values.items())


def story(markup, frames, cx=627, cy=627, ease='smooth', ident=None):
    options = {'data_am':'story', 'data_frames':json.dumps(frames,separators=(',',':')), 'data_cx':cx, 'data_cy':cy, 'data_ease':ease}
    if ident: options['data_part'] = ident
    initial = frames.get('opacity',[[0,1]])[0][1]
    return f'<g {at(**options)} opacity="{initial}">{markup}</g>'


def line(d, color=GOLD, width=3, **attrs):
    return f'<path {at(d=d,fill="none",stroke=color,stroke_width=width,stroke_linecap="round",stroke_linejoin="round",**attrs)}/>'


def star(x,y,r=18,color=WHITE):
    return f'<path d="M{x} {y-r}L{x+r*.18:g} {y-r*.18:g}L{x+r} {y}L{x+r*.18:g} {y+r*.18:g}L{x} {y+r}L{x-r*.18:g} {y+r*.18:g}L{x-r} {y}L{x-r*.18:g} {y-r*.18:g}Z" fill="{color}" stroke="#080808" stroke-width="1"/>'


class Scene:
    def __init__(self, ident,title,asset,duration,phases,summary,viewbox='0 0 1254 1254'):
        self.ident,self.title,self.asset=ident,title,asset
        self.duration,self.phases,self.summary,self.viewbox=duration,phases,summary,viewbox
        self.poster=f'/assets/masterworks-v2/{asset}.webp'
        self.defs=[f'<image id="paint" href="{self.poster}" width="1254" height="1254"/>',
          '<linearGradient id="gold-face" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8c8"/><stop offset=".22" stop-color="#ffd600"/><stop offset=".55" stop-color="#e6af00"/><stop offset="1" stop-color="#fff0a1"/></linearGradient>',
          '<linearGradient id="sweep"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff9db" stop-opacity=".1"/><stop offset=".58" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
          '<mask id="paint-light" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style="mask-type:luminance"><use href="#paint"/></mask>']
        self.layers=[];self.serial=0

    def clip(self,shape):
        self.serial+=1;ident=f'paint-part-{self.serial}'
        self.defs.append(f'<clipPath id="{ident}">{shape}</clipPath>')
        return f'<use href="#paint" clip-path="url(#{ident})"/>'

    def rect(self,x,y,w,h):
        return self.clip(f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/>')

    def part(self,shape,frames,cx=627,cy=627,ident=None):
        self.layers.append(story(self.clip(shape),frames,cx,cy,ident=ident))

    def trace(self,d,frames,width=3,color=GOLD,ident=None):
        p=line(d,color,width,pathLength=100,stroke_dasharray=100,stroke_dashoffset=100)
        self.layers.append(story(p,frames,ident=ident))

    def finish(self,center=(627,627),guard=None):
        cx,cy=center
        # Do not illuminate a stationary copy of the source behind large moving parts.
        accents=''
        accents+=f'<g data-am="wave" data-radius="300" opacity="0"><circle cx="{cx}" cy="{cy}" r="0" fill="none" stroke="#ffe165" stroke-width="2.3"/><circle cx="{cx}" cy="{cy}" r="0" fill="none" stroke="{RED}" stroke-width="1.4"/></g>'
        for i in range(6):
            accents+=f'<path d="M0-5 1.5-1 6 0 1.5 2 0 7-1.5 2-6 0-1.5-1Z" fill="#fff1b2" stroke="none" opacity="0" data-am="spark" data-cx="{cx}" data-cy="{cy}" data-angle="{i*60+15}" data-radius="{200+i%2*70}"/>'
        if guard is not None: accents=story(accents,{'opacity':guard})
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.viewbox}" data-story-duration="{self.duration}" aria-hidden="true" focusable="false"><defs>{"".join(self.defs)}</defs><rect x="-120" y="-100" width="1600" height="1450" fill="#080808"/>{"".join(self.layers)}{accents}</svg>\n'
        ET.fromstring(svg);(OUT/f'{self.ident}.svg').write_text(svg)
        return {'id':self.ident,'title':self.title,'poster':self.poster,'svg':f'/assets/art-motion/{self.ident}.svg','width':1254,'height':1254,'motionSummary':self.summary,'story':{'duration':self.duration,'phases':[{'at':t,'label':label} for t,label in self.phases]}}


made=[]

# CORRESPONDENCE: one action above produces the same architecture below.
s=Scene('correspondence','Correspondence','022',12,[(0,'ONE PATTERN / ABOVE'),(2.2,'THE ANSWER / BELOW'),(4.5,'MATCH THE SCALE'),(8,'ONE STRUCTURE / TWO VIEWS'),(10.6,'RETURN TO THE SOURCE')],
 'The upper architectural world grows from the central axis; the lower world answers with the same motion. Both expand and contract together before settling into one mirrored composition.')
s.layers.append(s.rect(0,494,1254,250))
s.layers.append(line('M627 26V1220','#7f6a20',2,stroke_dasharray='5 13'))
s.layers.append(story(star(627,611,46),{'scale':[[0,.6],[1,1.4],[2,1],[4.5,1],[5.6,1.6],[6.5,1],[12,.6]],'opacity':[[0,.8],[10.6,.8],[12,.8]]},627,611))
s.part('<rect x="0" y="0" width="1254" height="494"/>',{
 'opacity':[[0,0],[.4,0],[1.4,1],[10.6,1],[11.8,0],[12,0]],
 'scale':[[0,.15],[.4,.15],[2,1],[4.5,1],[5.6,.72],[6.8,1.08],[8,1],[10.6,1],[11.8,.15],[12,.15]]},627,611,'above-world')
s.part('<rect x="0" y="744" width="1254" height="510"/>',{
 'opacity':[[0,0],[2.2,0],[3.2,1],[10.6,1],[11.8,0],[12,0]],
 'scale':[[0,.15],[2.2,.15],[4.2,1],[4.5,1],[5.6,.72],[6.8,1.08],[8,1],[10.6,1],[11.8,.15],[12,.15]]},627,611,'below-world')
# Matching gold signals visibly travel outwards from the central star.
for sign in [-1,1]:
    s.layers.append(story(star(627,611,15),{'y':[[0,0],[.5,0],[2,sign*400],[4.2,sign*400],[4.6,0],[8.4,sign*400],[10.4,sign*400],[11.9,0],[12,0]],'opacity':[[0,0],[.5,1],[2.1,1],[2.5,0],[4.5,0],[4.6,1],[8.4,1],[8.8,0],[12,0]]},627,611,ident=f'matching-signal-{sign}'))
for y1,y2 in [(306,948),(351,903),(398,856)]:
    s.trace(f'M552 {y1}H702M552 {y2}H702',{'dash':[[0,100],[4.5,100],[6.2,0],[9.5,0],[11.7,100],[12,100]],'opacity':[[0,0],[4.4,0],[4.8,.8],[9.5,.8],[11,0],[12,0]]},5,WHITE)
made.append(s.finish((627,611),[[0,0],[4.3,0],[4.6,1],[10.5,1],[11.5,0],[12,0]]))

# VIBRATION: rigid tines move in opposition; discrete wave packets propagate.
s=Scene('vibration','Vibration','023',10,[(0,'STILLNESS'),(1,'AN IMPULSE'),(2.1,'THE FORK VIBRATES'),(3.3,'WAVES CARRY THE MOTION'),(8.2,'SETTLE / REPEAT')],
 'A visible impulse starts opposed tuning-fork motion. Three pairs of bright wave packets travel away from the fork, and the painted wave architecture builds outwards before the vibration settles.')
left='M532 253L571 245L599 259L602 644Q604 682 627 696V725Q526 717 524 651Z'
right='M656 258L680 245L719 251L729 650Q727 711 649 727L627 723V697Q654 689 655 644Z'
s.defs.append('<mask id="fork-rest" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254" style="mask-type:luminance"><rect width="1254" height="1254" fill="white"/><path d="'+left+'" fill="black" stroke="black" stroke-width="8"/><path d="'+right+'" fill="black" stroke="black" stroke-width="8"/></mask>')
s.layers.append('<use href="#paint" mask="url(#fork-rest)"/>')
# A real source-paint tine pair, each fully extracted, not a second image on top.
for shape,sgn,pivot in [(left,-1,565),(right,1,692)]:
    tracks={'rotate':[[0,0],[1.2,0]],'opacity':[[0,1],[10,1]]}
    for k in range(26): tracks['rotate'].append([1.35+k*.24,sgn*(2.35 if k%2 else -2.35)])
    tracks['rotate'] += [[7.6,0],[10,0]]
    s.part(f'<path d="{shape}"/>',tracks,pivot,697,f'tine-{sgn}')
# Impulse reaches the core, then exits as wave fronts. All six travel shapes.
s.layers.append(story(star(627,505,30),{'scale':[[0,.4],[.9,.4],[1.25,1.8],[1.6,1],[7.8,1],[8.4,.4],[10,.4]],'opacity':[[0,.1],[.9,.1],[1.3,1],[7.8,.9],[8.4,.1],[10,.1]]},627,505))
for side in [-1,1]:
    for i in range(3):
        x=627+side*102
        d=f'M{x} 390Q{x+side*60} 505 {x} 620'
        packet=line(d,WHITE if i%2==0 else YELLOW,7,stroke_opacity=.9)
        times=[];op=[]
        for start in [1.8+i*.48,4.7+i*.48]:
            times.extend([[start,0],[start+1.65,side*370]])
            op.extend([[max(0,start-.1),0],[start,.85],[start+1.1,.85],[start+1.65,0]])
        times=[[0,0]]+times+[[10,side*370]];op=[[0,0]]+op+[[10,0]]
        s.layers.append(story(packet,{'x':times,'opacity':op},627,505,ease='linear',ident=f'wave-packet-{side}-{i}'))
# The golden waves themselves visibly breathe, in timed outward order.
for i,(lp,rp) in enumerate([('M522 441C442 417 427 519 499 564','M731 441C812 417 827 519 755 564'),('M484 405C355 381 325 572 482 612','M769 405C898 381 928 572 771 612'),('M455 375C254 325 192 632 460 652','M798 375C999 325 1061 632 793 652')]):
    start=2.1+i*.5
    s.layers.append(story(line(lp+' '+rp,WHITE,5),{'opacity':[[0,0],[start,0],[start+.28,.8],[start+1.2,0],[5+ i*.5,0],[5.28+i*.5,.8],[6.2+i*.5,0],[10,0]],'scale':[[0,.83],[start,.83],[start+1.2,1.08],[4.9,.83],[5+i*.5,.83],[6.2+i*.5,1.08],[10,1.08]]},627,505,ident=f'painted-wave-{i}'))
made.append(s.finish((627,505),[[0,0],[1,0],[1.2,1],[8,1],[8.5,0],[10,0]]))

# POLARITY: the whole paired disc exchanges sides; opposite forces remain linked.
s=Scene('polarity','Polarity','024',12,[(0,'TWO POLES / ONE WHOLE'),(1.2,'POSITIONS EXCHANGE'),(4,'OPPOSITE VIEW'),(6,'THE SAME AXIS'),(9,'RETURN / INTEGRATE')],
 'The complete interlocked gold and dark crescents exchange sides through a half-turn, hold the opposite arrangement, then turn back around their shared axis. Both poles remain part of one continuous composition.')
s.layers.append('<circle cx="627" cy="627" r="574" fill="none" stroke="#7e691c" stroke-width="3"/><circle cx="627" cy="627" r="594" fill="none" stroke="#574615" stroke-width="1" stroke-dasharray="3 12"/>')
s.layers.append(story('<use href="#paint"/>',{'rotate':[[0,0],[1.2,0],[3.8,180],[5.5,180],[8.4,360],[12,360]],'scale':[[0,.87],[12,.87]]},627,627,ident='whole-opposed-crescents'))
for side,color in [(-1,YELLOW),(1,RED)]:
    mark=f'<circle cx="{627+side*581}" cy="627" r="20" fill="{color}" stroke="#fff4bd" stroke-width="2"/>'+star(627+side*581,627,29,color)
    s.layers.append(story(mark,{'rotate':[[0,0],[1.2,0],[3.8,180],[5.5,180],[8.4,360],[12,360]]},627,627,ident=f'pole-marker-{side}'))
s.layers.append(story(star(627,627,38),{'scale':[[0,.6],[1.2,.6],[3.8,1],[5.5,1],[8.4,.6],[12,.6]],'opacity':[[0,.4],[1.2,.4],[3.8,.9],[8.4,.4],[12,.4]]},627,627))
for sign in [-1,1]:
    s.trace('M627 33A594 594 0 0 1 1221 627' if sign==1 else 'M627 1221A594 594 0 0 1 33 627',{'dash':[[0,100],[1.2,100],[3.8,0],[5.5,0],[8.4,100],[12,100]],'opacity':[[0,.3],[1.2,.3],[2,1],[5.5,1],[8.4,.3],[12,.3]]},4,WHITE)
made.append(s.finish((627,627)))

# CAUSE AND EFFECT: five whole source-painted dominoes actually fall in sequence.
# The native frame replaces the occluded background instead of leaving standing
# source dominoes behind the moving ones. Room on the right keeps the last fall visible.
s=Scene('cause-effect','Cause and Effect','026',14,[(0,'A CHANGE BEGINS'),(1.4,'THE FIRST CONTACT'),(2.4,'ONE EVENT TRIGGERS THE NEXT'),(5,'THE CONSEQUENCE'),(8,'RESET THE CONDITIONS'),(11.2,'READY FOR ANOTHER CHOICE')],
 'A single visible push tips the first complete domino. Its fall triggers the second, then the remaining three. The whole chain stays fallen before resetting in reverse order.',viewbox='-70 -50 1500 1350')
# Preserved painted astrolabe details above and below the chain.
for shape in ['<circle cx="486" cy="285" r="52"/>','<circle cx="879" cy="475" r="116"/>','<path d="M425 930H861V1240H425Z"/>','<circle cx="81" cy="480" r="53"/>']:
    s.layers.append(s.clip(shape))
# Reconstruct the sun rays occluded by the first standing tile; no old tile paint
# can remain in this stationary background when its complete body falls.
for i in range(24):
    angle=i*math.pi/12;outer=252 if i%2==0 else 202
    pts=[]
    for radius,a in [(126,angle-.035),(outer,angle),(126,angle+.035)]:
        pts.append(f'{486+math.cos(a)*radius:g},{285+math.sin(a)*radius:g}')
    s.layers.insert(0,f'<polygon points="{" ".join(pts)}" fill="url(#gold-face)" stroke="#080808" stroke-width="3"/>')
s.layers.insert(24,'<circle cx="486" cy="285" r="139" fill="none" stroke="#ffd600" stroke-width="7"/><circle cx="486" cy="285" r="163" fill="none" stroke="#ac8b27" stroke-width="2"/>')
# Rich stationary gold orbital rails and faceted stone floor.
for d,w,c in [('M79 482C143 230 325 156 494 151C864 138 1122 382 1197 716',7,YELLOW),('M97 606C246 120 927 217 1179 790',2,WHITE),('M162 948Q655 1131 1174 939',8,YELLOW),('M203 928Q620 1048 1123 921',2,WHITE)]:s.layers.append(line(d,c,w))
rocks=[(30,827),(112,889),(213,868),(309,901),(418,845),(515,899),(629,879),(742,898),(848,923),(966,937),(1090,932),(1190,971)]
for i,(x,y) in enumerate(rocks):
    s.layers.append(f'<path d="M{x} {y}L{x+57} {y-22}L{x+110} {y+9}L{x+83} {y+55}L{x+13} {y+45}Z" fill="#151515" stroke="#b69124" stroke-width="2"/><path d="M{x+57} {y-22}L{x+51} {y+23}L{x+110} {y+9}" fill="#ffd600" stroke="#080808" stroke-width="3"/>')
dominoes=[
 ('M162 301L244 272L398 391L410 846L246 862L139 803Z',410,846,88),
 ('M414 456L493 411L589 494L653 820L559 826L463 778Z',653,820,88),
 ('M602 553L658 505L762 562L834 844L738 864L662 807Z',834,844,88),
 ('M800 650L851 610L942 659L1012 873L929 889L874 842Z',1012,873,88),
 ('M966 729L992 687L1088 743L1172 925L1099 911L1045 841Z',1172,925,88)
]
for i,(shape,cx,cy,fall) in enumerate(dominoes):
    begin=1.4+i*.64;reset=8+(4-i)*.42
    s.part(f'<path d="{shape}"/>',{'rotate':[[0,0],[begin,0],[begin+1.1,fall],[reset,fall],[reset+1.1,0],[14,0]]},cx,cy,f'whole-domino-{i+1}')
    x,y=[(216,320),(484,455),(666,550),(851,650),(1020,735)][i]
    s.layers.append(story(star(x,y,25,WHITE),{'opacity':[[0,0],[begin,0],[begin+.22,.9],[begin+.6,0],[14,0]],'scale':[[0,.3],[begin,.3],[begin+.6,1.8],[14,1.8]]},x,y,ident=f'contact-{i+1}'))
# A short red impulse makes the initiating cause unambiguous.
arrow='<path d="M36 365H157V338L219 389 157 440V413H36Z" fill="#e71932" stroke="#fff0a1" stroke-width="2"/>'
s.layers.append(story(arrow,{'x':[[0,-90],[.6,-90],[1.5,0],[1.9,15],[14,15]],'opacity':[[0,0],[.45,0],[.6,1],[1.5,1],[1.9,0],[14,0]]},0,0,ident='initiating-push'))
# Original lower dial remains legible in front of the floor.
s.layers.append(s.clip('<circle cx="643" cy="971" r="124"/>'))
made.append(s.finish((643,971),[[0,0],[1.3,0],[1.6,1],[7.2,1],[8,0],[14,0]]))

# CREATIVE MODES: receive impressions, then let organic and angular worlds grow.
s=Scene('gender','Gender / Creative Modes','027',14,[(0,'RECEIVE / AN OPEN SEED'),(2,'GATHER THE IMPRESSIONS'),(3.8,'INITIATE / MAKE A FORM'),(7.2,'ORGANIC + GEOMETRIC'),(9,'CREATE TOGETHER'),(12,'RETURN TO POSSIBILITY')],
 'Gold impressions travel inward to a red seed. The received energy branches out: leaf forms unfold on one side while angular architecture grows on the other, completing one intricate living composition.')
# Sparse potential, before any world exists.
s.layers.append('<circle cx="627" cy="629" r="94" fill="none" stroke="#77601a" stroke-width="2"/><circle cx="627" cy="629" r="121" fill="none" stroke="#574615" stroke-width="1"/>')
seed='<circle cx="627" cy="629" r="34" fill="#d90b32" stroke="#ffe768" stroke-width="4"/><path d="M606 608Q627 588 647 612" fill="none" stroke="#fff2a6" stroke-width="5"/>'
s.layers.append(story(seed,{'scale':[[0,.8],[1.7,.8],[3.7,1.7],[4.5,1],[8.5,1],[11.7,1],[13.3,.8],[14,.8]],'opacity':[[0,1],[8.3,1],[9,0],[11.7,0],[13.2,1],[14,1]]},627,629,ident='receiving-seed'))
for i,angle in enumerate([0,60,120,180,240,300]):
    a=math.radians(angle);dx,dy=math.cos(a)*430,math.sin(a)*430
    particle=star(627,629,15,YELLOW)
    start=.6+(i%3)*.42
    s.layers.append(story(particle,{'x':[[0,dx],[start,dx],[start+1.6,0],[14,0]],'y':[[0,dy],[start,dy],[start+1.6,0],[14,0]],'scale':[[0,.7],[start,.7],[start+1.45,1.1],[start+1.65,0],[14,0]],'opacity':[[0,0],[start,0],[start+.15,1],[start+1.5,1],[start+1.75,0],[14,0]]},627,629,ease='smooth',ident=f'received-impression-{i}'))
# Branching construction visibly precedes the painted growth.
branches=['M627 629Q461 478 284 302Q228 250 220 178','M627 629Q360 529 70 560','M627 629Q354 752 214 1022','M627 629L766 434L817 204','M627 629L918 579L1124 656','M627 629L866 841L1030 1045']
for i,d in enumerate(branches):
    start=2.5+(i%3)*.25
    s.trace(d,{'dash':[[0,100],[start,100],[start+1.8,0],[8,0],[9,100],[14,100]],'opacity':[[0,0],[start,0],[start+.2,1],[7.8,1],[9,0],[14,0]]},5,WHITE if i%2 else YELLOW)
# Overlapping component silhouettes grow from the seed without rectangular seams.
# Soft mask edges let each painted leaf/letter resolve into its neighbours.
s.defs.append('<filter id="growth-soft-edge" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="9"/></filter>')
regions=[
 ('M644 680C560 664 509 577 409 490C289 397 223 322 172 165C243 129 320 102 421 90C526 61 595 166 610 296C630 425 669 548 644 680Z',3.4,-18),
 ('M659 677C577 754 429 739 307 707C194 700 108 775 24 792C1 671 4 550 72 481C201 367 330 370 435 448C539 496 604 546 659 677Z',4,-9),
 ('M652 638C692 767 727 938 681 1121C572 1204 374 1168 244 1101C131 1022 152 884 209 776C295 679 472 650 652 638Z',4.6,12),
 ('M600 676L608 316L688 167L752 176L778 96L858 128L916 269L895 470L818 591L721 694Z',3.8,18),
 ('M611 582L804 369L909 252L977 328L994 429L1121 410L1226 475L1207 562L1250 654L1187 760L1002 823L826 744L682 729Z',4.4,10),
 ('M598 624L795 606L947 646L1099 715L1133 889L1129 1083L1013 1144L824 1183L687 1136L637 957L583 798Z',5,5)
]
for i,(shape,start,angle) in enumerate(regions):
    mask=f'growth-component-{i}'
    s.defs.append(f'<mask id="{mask}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="1374" height="1374" style="mask-type:luminance"><path d="{shape}" fill="white" filter="url(#growth-soft-edge)"/></mask>')
    s.layers.append(story(f'<use href="#paint" mask="url(#{mask})"/>',{'scale':[[0,.03],[start,.03],[start+2.5,1.03],[start+3,1],[11.8,1],[13.6,.03],[14,.03]],'rotate':[[0,angle],[start,angle],[start+2.8,0],[11.8,0],[13.6,angle],[14,angle]],'opacity':[[0,0],[start,0],[start+.5,1],[11.8,1],[13.6,0],[14,0]]},627,629,ident=f'grown-region-{i}'))
# Full paint closes every partition edge after the construction is complete.
s.layers.append(story('<use href="#paint"/>',{'opacity':[[0,0],[7.8,0],[9,1],[11.8,1],[13.6,0],[14,0]]},627,629,ident='completed-co-creation'))
made.append(s.finish((627,629),[[0,0],[7.8,0],[9,1],[11.8,1],[13.2,0],[14,0]]))

# The two specialist stories are separate authoring units, merged in book order.
old={item['id']:item for item in json.loads((OUT/'principles.json').read_text())} if (OUT/'principles.json').exists() else {}
if '--only-five' not in sys.argv:
    for filename in ['build-mentalism-story.py','build-rhythm-story.py']:
        runpy.run_path(str(ROOT/'tools'/filename),run_name='__main__')
    for name in ['mentalism','rhythm']:
        old[name]=json.loads((OUT/f'{name}-story.json').read_text())
all_items={**old,**{item['id']:item for item in made}}
order=['mentalism','correspondence','vibration','polarity','rhythm','cause-effect','gender']
(OUT/'principles.json').write_text(json.dumps([all_items[k] for k in order],ensure_ascii=False,indent=2)+'\n')
print('Built five semantic principle stories and merged seven ordered descriptors.')
for item in made:
    root=ET.parse(OUT/f'{item["id"]}.svg').getroot()
    motion=[n for n in root.iter() if 'data-am' in n.attrib]
    print(item['id'],len(motion),'channels;',item['story']['duration'],'second cycle')

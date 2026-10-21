"""A single rigid painted pendulum swinging through a complete visual rhythm.

The image-generated stationary frame has no old rod, bob or ghost positions.
The original painted rod, bob and finial are hand-clipped as one object, then
registered to the frame's actual suspension loop. No original raster is edited.
"""
from pathlib import Path
from html import escape
import json
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
OUT.mkdir(parents=True, exist_ok=True)
PERIOD = 4.8
SOURCE_PIVOT = (627, 251)
FRAME_PIVOT = (627, 335)
SCALE = .86
OFFSET = 19.3
AMPLITUDE = 23

# Hand audited against the original 1254-square image. Follow the whole brass
# rod, faceted bob, angular outer points and bottom finial; exclude the red ribbon
# and neighbouring stationary pillar/ghost-bob paintings.
PENDULUM = 'M624 256C615 260 615 270 622 280C621 290 625 298 632 304L638 326Q630 333 639 345L654 391Q646 402 653 418L660 429Q651 438 665 453L698 549Q681 559 688 579Q685 591 701 604L711 620Q698 630 708 643L730 660L727 671L704 691C669 731 637 780 624 824L610 859L594 887L632 881C638 947 686 1006 698 1013C731 1037 807 1054 863 1049L871 1070L874 1093L928 1155L937 1105L931 1080L946 1061L938 1043C992 1008 1033 954 1045 890L1045 837L1063 784L1007 758C964 709 899 681 842 680L808 663L802 644L816 637Q810 622 793 620L783 602Q793 584 781 568L760 548L720 448Q719 435 706 427L703 414Q713 408 702 394L674 330Q674 318 659 313L650 285Q653 271 640 259Z'


def story(tracks, **extra):
    values = {'data-am':'story', 'data-frames':json.dumps(tracks,separators=(',',':')),'data-ease':'smooth', **extra}
    return ' '.join(f'{key}="{escape(str(value), quote=True)}"' for key,value in values.items())


crossings = [[0,0],[.92,0],[1.2,.78],[1.48,0],[3.32,0],[3.6,.78],[3.88,0],[4.8,0]]
left_turn = [[0,.05],[1.9,.05],[2.4,.8],[2.9,.05],[4.8,.05]]
right_turn = [[0,.8],[.5,.05],[4.3,.05],[4.8,.8]]
parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" data-story-duration="4.8" aria-hidden="true" focusable="false">',
    '<defs><image id="rhythm-source-paint" href="/assets/masterworks-v2/025.webp" width="1254" height="1254"/>',
    f'<clipPath id="whole-pendulum-cut"><path d="{PENDULUM}"/></clipPath>',
    '<linearGradient id="cadence-guide" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e71932" stop-opacity=".1"/><stop offset=".5" stop-color="#ffe778" stop-opacity=".65"/><stop offset="1" stop-color="#e71932" stop-opacity=".1"/></linearGradient>',
    '</defs>',
    '<rect width="1254" height="1254" fill="#080808" stroke="none"/>',
    '<image href="/assets/art-motion/rhythm-frame-clean.png" width="1254" height="1254"/>',
    # The guide is behind the moving weight: one axis and one arc, never a
    # sequence of stationary bob copies. The finite turn points read as return.
    '<path d="M627 363V1155" fill="none" stroke="#ffe768" stroke-width="1.5" stroke-dasharray="4 12" opacity=".23"/>',
    '<path d="M307 1090Q627 1220 947 1090" fill="none" stroke="url(#cadence-guide)" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M310 1075 301 1091 319 1093M944 1075 953 1091 935 1093" fill="none" stroke="#ffd600" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>',
    f'<g {story({"opacity":left_turn})}><circle cx="307" cy="1090" r="11" fill="#ffd600" stroke="none"/><circle cx="307" cy="1090" r="22" fill="none" stroke="#ffe68a" stroke-width="2"/></g>',
    f'<g {story({"opacity":right_turn})}><circle cx="947" cy="1090" r="11" fill="#ffd600" stroke="none"/><circle cx="947" cy="1090" r="22" fill="none" stroke="#ffe68a" stroke-width="2"/></g>',
    f'<g {story({"opacity":crossings})} opacity="0"><circle cx="627" cy="1155" r="22" fill="none" stroke="#fff0ac" stroke-width="3"/><path d="M627 1120V1135M627 1175V1190M592 1155H607M647 1155H662" fill="none" stroke="#ffe57d" stroke-width="3" stroke-linecap="round"/></g>',
    # Constant registration belongs to the parent, so the runtime's rotation
    # updates cannot overwrite the frame/source coordinate alignment.
    '<g transform="translate(627 335) scale(.86) translate(-627 -251)">',
    '<g data-am="pendulum" data-cx="627" data-cy="251" data-offset="19.3" data-amp="23" data-period="4.8" data-phase="-1.5707963267948966" data-pendulum-part="whole-rod-bob-and-finial">',
    '<use href="#rhythm-source-paint" clip-path="url(#whole-pendulum-cut)"/>',
    '</g></g>',
    # A stationary pin covers the join and makes the single physical pivot clear.
    '<circle cx="627" cy="335" r="8" fill="#f6cf42" stroke="#090805" stroke-width="2"/><circle cx="625" cy="332" r="2.6" fill="#fff7ce" stroke="none"/>',
    f'<g {story({"opacity":crossings})} opacity="0"><circle cx="627" cy="193" r="71" fill="none" stroke="#fff0ac" stroke-width="3"/><circle cx="627" cy="335" r="18" fill="none" stroke="#fff0ac" stroke-width="2.5"/></g>',
    '</svg>'
]
svg = '\n'.join(parts)+'\n'
ET.fromstring(svg)
(OUT/'rhythm.svg').write_text(svg)

descriptor = {
    'id':'rhythm', 'title':'Rhythm', 'poster':'/assets/masterworks-v2/025.webp',
    'svg':'/assets/art-motion/rhythm.svg', 'width':1254, 'height':1254,
    'assets':['/assets/art-motion/rhythm-frame-clean.png'],
    'motionSummary':'The entire painted rod, faceted bob and finial swing as one rigid pendulum through 46 degrees; the fixed pivot, return points and centre-crossing pulse make the repeating rhythm visible.',
    'story':{'duration':PERIOD,'phases':[
        {'at':0,'label':'OUTWARD — THE RIGHT EXTREME'},
        {'at':1.05,'label':'RETURN — CROSSING THE CENTRE'},
        {'at':2.4,'label':'OPPOSITE — THE LEFT EXTREME'},
        {'at':3.45,'label':'RETURN — THE RHYTHM REPEATS'}]},
    'construction':{'sourcePivot':list(SOURCE_PIVOT),'framePivot':list(FRAME_PIVOT),'registrationScale':SCALE,'offsetDegrees':OFFSET,'swingAmplitudeDegrees':AMPLITUDE,'movingParts':'One rigid original-painted rod, bob and finial. Stationary frame is a restored clean plate.'}
}
(OUT/'rhythm-story.json').write_text(json.dumps(descriptor,ensure_ascii=False,indent=2)+'\n')
print('Built Rhythm: one entire rigid pendulum, ±23° physical swing, 4.8-second cycle.')

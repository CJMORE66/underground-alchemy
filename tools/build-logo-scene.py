"""Author native SVG motion masks around the approved raster lettering.

These are conservative shared motion regions, not recovered hidden glyph strokes.
The approved PNG stays intact; all final rendering and animation happens in SVG.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/logo'
W, H = 1942, 809
boundaries = [
    [(600,0),(600,100),(590,230),(590,305),(514,380),(400,415),(570,480),(690,565),(690,625),(690,809)],
    [(820,0),(820,120),(830,260),(845,390),(900,470),(950,560),(965,625),(965,809)],
    [(980,0),(990,120),(958,250),(970,370),(1025,440),(995,530),(1000,625),(1000,809)],
    [(1225,0),(1220,180),(1250,260),(1270,390),(1295,500),(1250,625),(1250,809)],
    [(1400,0),(1400,130),(1410,260),(1405,390),(1405,500),(1400,625),(1400,809)]
]
regions = []
for i in range(6):
    left = [(0,0),(0,H)] if i == 0 else [(x-.7,y) for x,y in boundaries[i-1]]
    right = [(W,0),(W,H)] if i == 5 else [(x+.7,y) for x,y in boundaries[i]]
    regions.append('M'+' '.join(f'{x:g},{y:g}' for x,y in left+list(reversed(right)))+'Z')

almond = 'M599 386C622 365 646 341 674 342C709 342 732 362 750 384C724 400 698 411 675 411C644 410 617 400 599 386Z'
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -28 1998 865" aria-hidden="true" focusable="false"><defs>',
    f'<image id="logo-paint" href="/assets/logo/caisik-signature.webp" width="{W}" height="{H}"/>',
    '<mask id="logo-word" maskUnits="userSpaceOnUse" x="0" y="0" width="1942" height="809" style="mask-type:luminance"><rect width="1942" height="809" fill="white"/><rect x="425" y="623" width="1095" height="74" fill="black"/></mask>',
    '<mask id="logo-light-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1942" height="809" style="mask-type:luminance"><use href="#logo-paint"/>'+f'<path d="{almond}" fill="black"/></mask>',
    '<filter id="logo-red-ink" color-interpolation-filters="sRGB"><feFlood flood-color="#e71932"/><feComposite in2="SourceAlpha" operator="in"/></filter>',
    '<linearGradient id="logo-sweep"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fffbd8" stop-opacity=".2"/><stop offset=".55" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
    '<linearGradient id="logo-sclera" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6d5a26"/><stop offset=".45" stop-color="#f0e2b4"/><stop offset="1" stop-color="#b99b3b"/></linearGradient>',
    f'<clipPath id="logo-eye-aperture"><path d="{almond}"/></clipPath>',
    '<clipPath id="logo-iris-cut"><circle cx="676" cy="373" r="39"/></clipPath>',
    '<clipPath id="logo-tagline-cut"><rect x="425" y="623" width="1095" height="74"/></clipPath>']
parts.extend(f'<clipPath id="logo-region-{i}"><path d="{d}"/></clipPath>' for i,d in enumerate(regions))
parts.append('</defs><g data-logo-shadow="" opacity="0" filter="url(#logo-red-ink)"><use href="#logo-paint"/></g>')
centers = [(295,370),(676,365),(888,360),(1130,370),(1330,365),(1620,400)]
for i,(cx,cy) in enumerate(centers):
    parts.append(f'<g data-logo-letter="{i}" data-logo-cx="{cx}" data-logo-cy="{cy}"><use href="#logo-paint" clip-path="url(#logo-region-{i})" mask="url(#logo-word)"/>')
    if i == 1:
        parts.extend([
            f'<path d="{almond}" fill="#090805"/>',
            '<g clip-path="url(#logo-eye-aperture)"><g data-logo-eye-content="">',
            f'<path d="{almond}" fill="url(#logo-sclera)"/>',
            '<g data-logo-iris=""><use href="#logo-paint" clip-path="url(#logo-iris-cut)"/></g>',
            '</g></g>',
            '<path data-logo-closed-lid="" d="M601 386Q675 403 748 384" fill="none" stroke="#d6b930" stroke-width="3.5" stroke-linecap="round" opacity="0"/>'
        ])
    parts.append('</g>')
parts.extend([
    '<g data-logo-tagline=""><use href="#logo-paint" clip-path="url(#logo-tagline-cut)"/></g>',
    '<g mask="url(#logo-light-mask)"><g data-logo-shine="" opacity="0"><path d="M0 -60H150L-70 870H-220Z" fill="url(#logo-sweep)"/></g></g>',
    '<g data-logo-trace="" fill="none" stroke="#fff4aa" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="100" stroke-dashoffset="100" opacity="0">'
])
traces = [
    'M136 184Q286 142 480 247Q225 162 147 386Q124 527 368 534L300 459 543 534',
    'M430 432 665 35 796 162 734 145 558 458M536 462 704 482 905 603',
    'M860 121 918 190 876 239 883 462 936 513',
    'M962 150Q1151 172 1241 278L1114 297Q1046 312 1118 341Q1297 402 1228 492Q1168 558 1006 557',
    'M1294 150 1346 216 1304 258 1313 485 1358 524',
    'M1380 65 1512 109 1460 161 1449 362 1762 239 1684 278 1914 245M1449 362 1711 529 1799 683'
]
parts.extend(f'<path pathLength="100" d="{d}"/>' for d in traces)
parts.append('</g><g data-logo-wave="" opacity="0"><circle cx="676" cy="373" r="0" fill="none" stroke="#ffe35c" stroke-width="3"/><circle cx="676" cy="373" r="0" fill="none" stroke="#e71932" stroke-width="1.5"/></g><g data-logo-sparks="" fill="#fff0a0" stroke="none">')
parts.extend('<path d="M0 -6 2 -1 6 0 2 2 0 7-2 2-6 0-2 -1Z" opacity="0"/>' for _ in range(8))
parts.append('</g></svg>')
(OUT/'caisik-signature.svg').write_text('\n'.join(parts)+'\n')
(OUT/'motion-parts.json').write_text(json.dumps({'sourceSize':[W,H],'viewBox':[-28,-28,1998,865],'eye':{'center':[676,373],'irisRadius':39,'aperture':almond},'regions':regions,'subtitle':[425,623,1095,74],'relativeMotionLimitSourcePixels':4,'note':'Shared conservative motion regions preserve the approved interlocking raster at rest. Hidden letter strokes are not recovered vector glyphs.'},indent=2)+'\n')

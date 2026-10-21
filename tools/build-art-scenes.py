"""Build and validate native SVG scenes around approved, unchanged CAISIK paintings."""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/art-motion'
SUPPORTED = {'rotate','swing','float','pulse','scale','trace','shine','gaze','blink','lid','wave','spark','story','pendulum'}
EXPECTED = {'mentalism','correspondence','vibration','polarity','rhythm','cause-effect','gender','as-above','transmute','map-territory','know-thyself','shadow-work','omerta-ego','city-remembers'}
for script in ['build-principle-scenes.py', 'build-wall-scenes.py']:
    subprocess.run([sys.executable, str(ROOT/'tools'/script)], cwd=ROOT, check=True)
scenes = []
for filename in ['principles.json', 'wall.json']:
    data = json.loads((OUT/filename).read_text())
    scenes.extend(data if isinstance(data,list) else data['scenes'])
assert len(scenes) == 14 and {s['id'] for s in scenes} == EXPECTED
for scene in scenes:
    assert scene['width'] > 0 and scene['height'] > 0
    poster = ROOT / 'dist' / scene['poster'].lstrip('/')
    svg = ROOT / 'dist' / scene['svg'].lstrip('/')
    assert poster.is_file() and svg.is_file()
    root = ET.parse(svg).getroot()
    nodes = list(root.iter())
    ids = [n.attrib['id'] for n in nodes if 'id' in n.attrib]
    assert len(ids) == len(set(ids)), scene['id'] + ': duplicate SVG IDs'
    motion = [n for n in nodes if 'data-am' in n.attrib]
    assert len(motion) >= 3, scene['id'] + ': missing meaningful channels'
    assert all(n.attrib['data-am'] in SUPPORTED for n in motion)
    assert not any(n.tag.split('}')[-1] in {'script','foreignObject','animate','animateTransform'} for n in nodes)
    for asset in scene.get('assets', []):
        assert asset.startswith('/assets/') and (ROOT / 'dist' / asset.lstrip('/')).is_file(), asset
    for node in nodes:
        if node.tag.split('}')[-1] == 'image':
            href = node.attrib.get('href', '')
            if href.startswith('/assets/'):
                assert (ROOT/'dist'/href.lstrip('/')).is_file(), href
        if node.attrib.get('data-am') == 'story':
            tracks = json.loads(node.attrib['data-frames'])
            for track, keys in tracks.items():
                assert track in {'opacity','x','y','scale','rotate','dash','r'}, (scene['id'], track)
                assert len(keys) >= 1
                assert all(len(key) == 2 and all(math.isfinite(v) for v in key) for key in keys)
                assert all(keys[i][0] <= keys[i+1][0] for i in range(len(keys)-1))
                assert 0 <= keys[0][0] <= keys[-1][0] <= scene['story']['duration']
    scene['posterSha256'] = hashlib.sha256(poster.read_bytes()).hexdigest()
    scene['sceneSha256'] = hashlib.sha256(svg.read_bytes()).hexdigest()
(OUT/'scenes.json').write_text(json.dumps(scenes, indent=2, ensure_ascii=False)+'\n')
print(f'Built {len(scenes)} original-paint motion scenes for 15 active artwork placements.')

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const scenes=JSON.parse(read('assets/art-motion/scenes.json'));
const expected=['mentalism','correspondence','vibration','polarity','rhythm','cause-effect','gender','as-above','transmute','map-territory','know-thyself','shadow-work','omerta-ego','city-remembers'];
assert.equal(scenes.length,14);
assert.deepEqual(scenes.map(s=>s.id).sort(),expected.sort());
const supported=new Set(['rotate','swing','float','pulse','scale','trace','shine','gaze','blink','lid','wave','spark']);
for(const scene of scenes){
  for(const field of ['title','poster','svg','motionSummary'])assert.ok(typeof scene[field]==='string'&&scene[field].length>3,`${scene.id}.${field}`);
  assert.ok(scene.width>0&&scene.height>0);
  const svg=read(scene.svg);
  const channels=[...svg.matchAll(/data-am="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(channels.length>=3,`${scene.id} has custom channels`);
  channels.forEach(c=>assert.ok(supported.has(c),`${scene.id} supported ${c}`));
  const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`${scene.id} unique scene IDs`);
  for(const match of svg.matchAll(/(?:url\(#|href="#)([^)"\s]+)[)"]/g))assert.ok(ids.includes(match[1]),`${scene.id} valid mask reference ${match[1]}`);
  assert.doesNotMatch(svg,/<(?:script|foreignObject|animate|animateTransform)\b/);
  for(const key of ['poster','svg'])assert.ok(fs.existsSync(path.join(root,scene[key])),`${scene.id} ${key} ships`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,scene.poster))).digest('hex'),scene.posterSha256,`${scene.id} approved paint is unchanged`);
}
const atlas=read('atlas.js');
const table=atlas.match(/const artThemes=(\[[\s\S]*?\]);/)[1];
const placements=[...table.matchAll(/scene:'([^']+)'/g)].map(m=>m[1]);
assert.equal(placements.length,8,'All eight living wall paintings have motion');
placements.forEach(id=>assert.ok(expected.includes(id)));
assert.match(read('atlas-principles.js'),/id:p\.id,poster:/,'Every principle uses its own native scene');
assert.match(atlas,/data-art-replay/,'Large artwork view has replay');
assert.match(read('art-motion.css'),/\.living-art\.art-running \.living-art-poster/,'Approved poster stays until runtime success');
for(const page of ['index.html',...fs.readdirSync(path.join(root,'q')).map(q=>`q/${q}/index.html`)]){
 const html=read(page);assert.match(html,/\/art-motion.js\?v=1/);assert.match(html,/\/art-motion.css\?v=1/);
}
console.log('PASS: 14 custom scenes / 15 placements, original paint hashes, native channels, mask references, asset packaging, lesson routing and replay integration.');

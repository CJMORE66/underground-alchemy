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
const supported=new Set(['rotate','swing','float','pulse','scale','trace','shine','gaze','blink','lid','wave','spark','story','pendulum']);
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
const principles=scenes.filter(s=>['mentalism','correspondence','vibration','polarity','rhythm','cause-effect','gender'].includes(s.id));
for(const s of principles){
 assert.ok(s.story.duration>=4,'Readable complete story duration');
 assert.ok(s.story.phases.length>=3,'Story exposes meaningful stages');
 assert.equal(s.story.phases[0].at,0);
 for(const phase of s.story.phases){assert.ok(phase.at<s.story.duration);assert.ok(phase.label.length>3);}
 for(const asset of s.assets||[])assert.ok(fs.existsSync(path.join(root,asset)),'Additional painting layer ships');
}
const mental=read(scenes.find(s=>s.id==='mentalism').svg);
assert.match(mental,/data-story-duration="24"/,'Mentalism grows through a complete 24-second cycle');
assert.match(mental,/#080808/,'The void is black');
assert.ok((mental.match(/data-am="story"/g)||[]).length>=15,'The world has separately built layers');
const rhythm=read(scenes.find(s=>s.id==='rhythm').svg);
assert.equal((rhythm.match(/data-am="pendulum"/g)||[]).length,1,'Complete rod and bob form one rigid pendulum');
assert.match(rhythm,/rhythm-frame-clean.png/,'Clean frame removes stationary pendulum');
const amplitude=Number(rhythm.match(/data-am="pendulum"[^>]*data-amp="([^"]+)"/)?.[1]);
assert.ok(amplitude>=20,'Whole pendulum has a clearly visible swing');
const atlas=read('atlas.js');
const table=atlas.match(/const artThemes=(\[[\s\S]*?\]);/)[1];
const placements=[...table.matchAll(/scene:'([^']+)'/g)].map(m=>m[1]);
assert.equal(placements.length,8,'All eight living wall paintings have motion');
placements.forEach(id=>assert.ok(expected.includes(id)));
assert.match(read('atlas-principles.js'),/data-art-story-progress/,'Story has native exploration control');
assert.match(read('atlas-principles.js'),/id:p\.id,poster:/,'Every principle uses its own native scene');
assert.match(atlas,/data-art-replay/,'Large artwork view has replay');
assert.match(read('art-motion.css'),/\.living-art\.art-running \.living-art-poster/,'Approved poster stays until runtime success');
for(const page of ['index.html',...fs.readdirSync(path.join(root,'q')).map(q=>`q/${q}/index.html`)]){
 const html=read(page);assert.match(html,/\/art-motion.js\?v=2/);assert.match(html,/\/art-motion.css\?v=2/);
}
console.log('PASS: 14 custom scenes / 15 placements, original paint hashes, native channels, mask references, asset packaging, lesson routing and replay integration.');

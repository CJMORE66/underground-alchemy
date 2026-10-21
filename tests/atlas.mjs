import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const atlas=JSON.parse(read('locations-data.json'));
const learning=JSON.parse(read('principles-data.json'));
const source=read('atlas.js');
const html=read('index.html');
const expectedPrinciples=['mentalism','correspondence','vibration','polarity','rhythm','cause-effect','gender'];
const ids=new Set(atlas.locations.map(p=>p.id));
assert.equal(ids.size,atlas.locations.length,'Location IDs must be unique');
assert.equal(atlas.locations.length,12,'Initial atlas has 12 researched Paris discoveries');
const meaningful=(value,label)=>assert.ok(typeof value==='string'&&value.trim().length>3,label);
const https=(url,label)=>assert.equal(new URL(url).protocol,'https:',label);
for(const p of atlas.locations){
  assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for(const field of ['name','address','coordinateStatus','history','symbols','interpretation','observe','reflection','challenge','access','accessibility','period'])meaningful(p[field],`${p.id}.${field}`);
  assert.ok(Number.isFinite(p.lat)&&p.lat>48.7&&p.lat<49.0,`${p.id} latitude is in Paris region`);
  assert.ok(Number.isFinite(p.lng)&&p.lng>2.1&&p.lng<2.6,`${p.id} longitude is in Paris region`);
  assert.equal(typeof p.accessVerified,'boolean');
  assert.ok(p.categories.length>0);
  assert.ok(p.sources.length>0,`${p.id} has historical and access sources`);
  p.sources.forEach(s=>{meaningful(s.title,`${p.id} source title`);https(s.url,`${p.id} source URL`);});
  if(p.photo){
    for(const field of ['author','credit','note','license'])meaningful(p.photo[field],`${p.id} photo ${field}`);
    https(p.photo.sourcePage);https(p.photo.licenseUrl);
    assert.ok(/^(commons\.wikimedia\.org|upload\.wikimedia\.org)$/.test(new URL(p.photo.sourcePage).hostname),'Documentary photo source must be an identified Commons file');
    if(p.photo.localUrl)assert.ok(fs.existsSync(path.join(root,p.photo.localUrl)),`${p.id} local photo exists`);
    else assert.ok(/^(commons\.wikimedia\.org|upload\.wikimedia\.org)$/.test(new URL(p.photo.remoteUrl).hostname),'No unregistered documentary image host');
  }
}
assert.equal(new Set(atlas.routes.map(r=>r.id)).size,atlas.routes.length,'Route IDs unique');
for(const route of atlas.routes){
  meaningful(route.title,'Route title');meaningful(route.description,'Route description');
  assert.ok(route.stops.length>=2,'A route has at least two stops');
  assert.equal(new Set(route.stops).size,route.stops.length,'No accidentally repeated stop');
  route.stops.forEach(id=>assert.ok(ids.has(id),`Route ${route.id} references known stop ${id}`));
}
assert.deepEqual(learning.principles.map(p=>p.id),expectedPrinciples,'All seven principles in requested order');
assert.match(learning.provenance,/1908/);assert.match(learning.provenance,/not authenticated ancient Egyptian/i);
for(const [index,p]of learning.principles.entries()){
  assert.equal(p.number,index+1);
  for(const field of ['name','subtitle','doctrine','context','explanation','urban','observe','exercise','freestyle','deeper'])meaningful(p[field],`${p.id}.${field}`);
  assert.ok(p.related.length>0);
  assert.ok(fs.existsSync(path.join(root,`assets/masterworks/${String(index+21).padStart(3,'0')}.webp`)),`${p.id} artwork exists`);
}
assert.ok(learning.freestyleExercises.length>=7,'Lab includes the prepared freestyle exercises');
learning.freestyleExercises.forEach(e=>['title','duration','instruction'].forEach(k=>meaningful(e[k],`Exercise ${k}`)));
learning.sources.forEach(s=>https(s.url));

// Evaluate only the literal content table, never app/DOM side effects.
const themesMatch=source.match(/const artThemes=(\[[\s\S]*?\]);/);
assert.ok(themesMatch,'Gallery theme table found');
const themes=vm.runInNewContext(themesMatch[1],{}, {timeout:1000});
const requiredThemes=['AS ABOVE / SO BELOW','TRANSMUTE','THE MAP IS NOT THE TERRITORY','KNOW THYSELF','SHADOW WORK','OMERTÀ WITH THE EGO','THE CITY REMEMBERS','FREQUENCY OF THE UNDERGROUND'];
assert.deepEqual(Array.from(themes,a=>a.title),requiredThemes);
for(const theme of themes){
  const image=theme.image||`/assets/masterworks/${theme.asset}.webp`;
  assert.ok(fs.existsSync(path.join(root,image)),`Gallery image exists: ${image}`);
  if(theme.download)assert.ok(fs.existsSync(path.join(root,theme.download)),`Download exists: ${theme.download}`);
}

// Every non-dynamic local asset in the new page, JS, and styles must ship.
const checked=new Set();
for(const file of ['index.html','atlas.js','atlas-principles.js','atlas-frequency.js','atlas.css','atlas-principles.css','atlas-frequency.css','fonts-v7.css']){
  const text=read(file);
  for(const match of text.matchAll(/(?:src|href)=["'](\/[^"'<>]+)["']/g)){
    const asset=match[1].split(/[?#]/)[0];
    if(asset.includes('${'))continue;
    assert.ok(fs.existsSync(path.join(root,asset)),`${file} references present local file ${asset}`);checked.add(asset);
  }
  for(const match of text.matchAll(/url\(\s*["']?(\/[^"')\s]+)["']?\s*\)/g)){
    assert.ok(fs.existsSync(path.join(root,match[1])),`${file} CSS asset exists ${match[1]}`);checked.add(match[1]);
  }
}
const htmlIds=new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
const rootSelectors=Array.from(source.matchAll(/\$\('([^']+)'\)/g),m=>m[1]);
const dynamicIds=new Set(Array.from(source.matchAll(/\bid="([^"$]+)"/g),m=>m[1]));
rootSelectors.forEach(id=>assert.ok(htmlIds.has(id)||dynamicIds.has(id),`Atlas DOM target exists: ${id}`));
for(const file of ['atlas.js','atlas-principles.js','atlas-frequency.js']){
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  assert.equal(result.status,0,`${file} syntax: ${result.stderr}`);
}
console.log(`PASS: 12 location records and sources; ${atlas.routes.length} valid ordered routes; seven principles and artworks; eight gallery themes; ${checked.size} local asset references; DOM target integrity and JS syntax.`);
console.log('This is static data/packaging verification. Browser layout, permissions, microphone capture and rendered interactions require browser QA.');

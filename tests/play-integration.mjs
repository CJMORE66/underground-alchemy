/* Cross-module contracts and retained atlas boundaries, not a visual/browser substitute. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createStore,STORAGE_KEY} from '../dist/play/store.js';
import {buildQuest,deriveProgress,artifactEvidence,disciplineConfigs} from '../dist/play/quests.js';
import {normalizePlaces,navigationUrl} from '../dist/play/field.js';
import {renderPortableNotebook,notebookText} from '../dist/play/journal.js';
import {markedText,normalizeStrokes,validateWork} from '../dist/play/workshops.js';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('dist/play/index.html');
const attrs=[...html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map(m=>m[1]);
for(const url of attrs){if(!url.startsWith('/'))continue;const pathname=url.split(/[?#]/)[0],local=path.join(root,'dist',pathname);assert.ok(fs.existsSync(local)||fs.existsSync(path.join(local,'index.html')),`Missing /play asset or link ${url}`);}
assert.match(html,/<html[^>]+lang="cs"/);
assert.match(html,/<noscript>/);
for(const id of ['base','quests','workshop','field','journal'])assert.match(html,new RegExp(`id="${id}"`));
assert.doesNotMatch(html,/<(?:audio|video)[^>]+autoplay|navigator\.geolocation/);
for(const file of ['app.js','store.js','quests.js','workshops.js','field.js','journal.js','practice.js','sound.js'])execFileSync(process.execPath,['--check',path.join(root,'dist/play',file)],{stdio:'pipe'});
for(const file of ['selfmade-motion.js'])execFileSync(process.execPath,['--check',path.join(root,'dist',file)],{stdio:'pipe'});
const home=read('dist/index.html');
for(const id of ['hidden-city','principles','frequency','living-wall'])assert.match(home,new RegExp(`id="${id}"`));
assert.match(home,/href="\/play\//,'Homepage must link to new RPG');
for(const id of ['dj','mc','writer','breaking','knowledge'])assert.ok(fs.existsSync(path.join(root,`dist/expeditions/${id}/index.html`)));
for(const [id,config] of Object.entries(disciplineConfigs)){assert.equal(config.steps.length,7);assert.equal(config.href,`/expeditions/${id}/`);assert.ok(fs.existsSync(path.join(root,`dist${config.href}index.html`)));}
const atlas=JSON.parse(read('dist/locations-data.json')),exp=JSON.parse(read('dist/expeditions/data/expeditions.json'));
assert.equal(atlas.locations.length,12);assert.equal(exp.chapters.length,5);assert.equal(exp.lessons.length,15);assert.equal(exp.places.length,23);
const places=normalizePlaces(atlas,exp);assert.equal(places.length,32);assert.equal(places.find(p=>p.id==='univers-sons').coordinates,null);assert.ok(!navigationUrl(places.find(p=>p.id==='univers-sons')).includes('query=0%2C0'));
const map=new Map([['atlas-saved-places','["notre-dame"]'],['caisik-expeditions-v1','unchanged']]);
const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>{assert.equal(k,STORAGE_KEY);map.set(k,v);}};
const store=createStore({storage,eventTarget:null});
const now='2026-10-26T00:00:00.000Z';
assert.equal(store.update(s=>{s.profile.alias='<script>own()</script>';s.quests.push(buildQuest('writer',{id:'quest-integration',artifactId:'art-integration'}));s.artifacts.push({id:'art-integration',discipline:'writer',title:'Own <img src=x onerror=evil()>',createdAt:now,updatedAt:now,versions:[{id:'v1',createdAt:now,text:'první',decision:'osa',nextStep:'upravit',palette:[],strokes:[]},{id:'v2',createdAt:now,text:'druhá',decision:'čitelnost',nextStep:'měřítko',palette:[],strokes:[]} ]});}),true);
const state=store.get();assert.equal(artifactEvidence(state.artifacts[0]).evidenceReady,true);assert.equal(deriveProgress(state).completedQuests,1);
const portable=renderPortableNotebook(state);assert.ok(portable.startsWith('<!doctype html>'));assert.doesNotMatch(portable,/<script>|<img src=x onerror=/);assert.match(portable,/&lt;script&gt;/);assert.match(portable,/default-src 'none'/);assert.match(notebookText(state),/první[\s\S]*druhá/);
assert.doesNotMatch(markedText('|<img src=x onerror=evil()>|'),/<img/);assert.equal(normalizeStrokes([{color:'" onload="evil()',width:10,points:[[0,0],[2,2]]}])[0].color,'#FFD600');
assert.ok(validateWork('mc',{text:'x',decision:'x',nextStep:'x'}));
assert.equal(map.get('atlas-saved-places'),'["notre-dame"]');assert.equal(map.get('caisik-expeditions-v1'),'unchanged');store.destroy();
const coverage=JSON.parse(read('docs/selfmade/coverage.json'));assert.deepEqual(coverage.features.map(f=>f.number),Array.from({length:200},(_,i)=>i+1));assert.equal(new Set(coverage.features.map(f=>f.id)).size,200);
for(const feature of coverage.features){assert.ok(['implemented','partial','external','planned'].includes(feature.status));if(feature.status==='implemented')assert.ok(feature.evidence.length>0,`${feature.id} lacks evidence`);for(const evidence of feature.evidence)assert.ok(fs.existsSync(path.join(root,evidence)),`${feature.id} missing evidence ${evidence}`);}
console.log('PASS: /play assets/module syntax; original routes and data retained; 5×7 pedagogy;32 real places/nullpins; artifact→quest→portablejournal contract; hostile text/strokes escaped; legacy storage untouched;200 unique feature coverage entries.');
console.log('Browser rendering, actual permissions/media, real mobile devices and semantic expert review require separate QA.');

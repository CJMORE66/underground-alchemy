import assert from 'node:assert/strict';
import {CHAPTERS,segment,lerp3,qualityProfile} from '../src/cinematic/scene-config.js';
assert.equal(CHAPTERS.length,6);
assert.equal(new Set(CHAPTERS.map(c=>c.id)).size,6);
for(const progress of [-2,0,.25,1,2.75,4.8,5,8]){const {a,b,t}=segment(progress);assert(a>=0&&b<6&&t>=0&&t<=1);assert(lerp3(CHAPTERS[a].camera,CHAPTERS[b].camera,t).every(Number.isFinite));}
assert(!qualityProfile({width:390}).enabled);
assert(!qualityProfile({reduced:true}).enabled);
assert(!qualityProfile({saveData:true}).enabled);
assert.equal(qualityProfile({cores:4}).fps,30);
assert.equal(qualityProfile({width:1363,cores:8,memory:8}).fps,60);
console.log('PASS: six scene poses, bounded interpolation, mobile/reduced/save-data fallback and adaptive quality.');

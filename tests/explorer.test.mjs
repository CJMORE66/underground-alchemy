import assert from 'node:assert/strict';
import { filterLocations, readSaved, writeSaved, nearestLocations } from '../dist/explorer.js';
import { locations, routes } from '../dist/paris-locations.js';

assert.equal(locations.length, 11);
assert.equal(nearestLocations(locations,48.8530,2.3499)[0].id,'notre-dame');
assert.equal(nearestLocations(locations,48.8653,2.3793)[0].id,'le-mur');
assert.deepEqual(filterLocations(locations, {query:'Nicolas Flamel'}).map(p=>p.id), ['flamel']);
assert.ok(filterLocations(locations, {query:'pere lachaise'}).some(p=>p.id==='pere-lachaise'));
assert.equal(filterLocations(locations, {query:'no-such-city'}).length, 0);
assert.ok(filterLocations(locations, {topic:'graffiti'}).every(p=>p.topics.includes('graffiti')));
assert.deepEqual(filterLocations(locations, {savedOnly:true}, new Set(['bastille'])).map(p=>p.id), ['bastille']);
assert.deepEqual(readSaved({getItem(){throw Error('disabled')}}), {places:[],routes:[]});
assert.deepEqual(readSaved({getItem(){return '{'}}), {places:[],routes:[]});
assert.deepEqual(readSaved({getItem(){return '{"places":["bastille",12,"missing"],"routes":null}'}}), {places:['bastille'],routes:[]});
assert.equal(writeSaved({setItem(){throw Error('quota')}}, {places:[],routes:[]}), false);
assert.equal(writeSaved({setItem(){}}, {places:[],routes:[]}), true);
for (const route of routes) {
  assert.ok(route.stops.length >= 3);
  assert.equal(new Set(route.stops).size, route.stops.length);
  assert.ok(route.stops.every(id=>locations.some(p=>p.id===id)));
}
for (const p of locations) {
  assert.ok(p.lat > 48 && p.lat < 49 && p.lng > 2 && p.lng < 3);
  assert.ok(p.sources.length && p.sources.every(s=>s.url.startsWith('https://')));
  assert.ok(p.history && p.interpretation && p.access && p.challenge && p.symbol && p.look && p.reflection);
  assert.ok(['verified','unknown'].includes(p.accessibility));
}
console.log('PASS: Paris search, filters, saved-data failures, routes, and 11 complete profiles');

import assert from 'node:assert/strict';
import {principles,compositionSvg} from '../dist/play/practice.js';
assert.equal(principles.length,7);
const svg=compositionSvg(['a','b','c','d','e','f','g'],'<script>x</script>');
assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.equal((svg.match(/<title>/g)||[]).length,7);assert.ok(svg.includes('SOuČASNÁ'.toUpperCase()));
assert.ok(compositionSvg([]).includes('SELFMADE'));
console.log('PASS seven-part composition:7 actual exercises, hostilealias escaped, boundedvector content and static meaningfulfallback.');

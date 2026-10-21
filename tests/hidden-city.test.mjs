import test from 'node:test';
import assert from 'node:assert/strict';
import { principles, contextualConnections, cleanJournal } from '../dist/principles.js';

test('all seven studies contain usable demonstrations and urban/creative context', () => {
  assert.equal(principles.length, 7);
  assert.equal(new Set(principles.map(p => p.id)).size, 7);
  for (const p of principles) for (const key of ['name', 'idea', 'urban', 'reflection', 'rap', 'control', 'related']) assert.ok(p[key]?.length, `${p.id}: ${key}`);
  assert.equal(principles[6].name, 'Gender');
});

test('deeper connections follow actual study reflections, with no arbitrary lock', () => {
  assert.deepEqual(contextualConnections([]), []);
  assert.equal(contextualConnections(['mentalism', 'mentalism', 'unknown']).length, 1);
  assert.equal(contextualConnections(principles.map(p => p.id)).length, 7);
});

test('journal import rejects corrupted shapes and bounds text', () => {
  assert.equal(cleanJournal(null), '');
  assert.equal(cleanJournal({ text: 'hello' }), '');
  assert.equal(cleanJournal('a'.repeat(6000)).length, 4000);
  assert.equal(cleanJournal('<script>not executed</script>'), '<script>not executed</script>');
});

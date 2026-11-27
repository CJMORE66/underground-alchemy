// Snapshot of the user-approved film, published as Sites v70 (e3268212).
// Regenerate these digests only for an explicitly approved change to the film.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const dist = new URL('../dist/', import.meta.url);
const read = name => readFileSync(new URL(name, dist));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('the complete 27-shot prologue markup, module, graphics and soundtrack remain identical to v70', () => {
  const html = read('index.html').toString();
  const block = html.match(/<section id="alchemy-prologue"[\s\S]*?<\/section>/)?.[0];
  assert.ok(block, 'the original scroll section must still be present');
  assert.equal(digest(block), '8ee559f67b84a1e89af06326efc3943109056743ad7677ada8e671274cff7821', 'film markup including controls');
  assert.equal(digest(read('alchemy-prologue.js')), '7c270608a6f08d768aa7de02e4a7501efadc2a7ccd61aa435f9074999bdca1e8', 'film runtime');

  const files = new Set(['alchemy-prologue.js', 'alchemy-prologue.css', 'assets/alchemy-motion/iris-guide-detail.webp']);
  for (const asset of readdirSync(new URL('assets/alchemy-prologue/', dist))) files.add('assets/alchemy-prologue/' + asset);
  // Iteration also visits newly discovered dependency modules.
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const imports = read(file).toString().matchAll(/from\s*['"]\.\/([A-Za-z0-9_.-]+\.js)(?:\?[^'"\s]*)?['"]/g);
    for (const match of imports) files.add(match[1]);
  }
  const manifest = [...files].sort().map(file => file + '\0' + digest(read(file)) + '\n').join('');
  assert.equal(digest(manifest), '74745cb50c4bf434cce862ff0ec2612842a0a33df6eaa9fc9defd941eb4dd568', 'the complete approved film dependency set');
});

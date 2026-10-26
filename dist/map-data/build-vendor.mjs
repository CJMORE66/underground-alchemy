// Run with Node from the repository: npm run build:map-vendor
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {validateStyleMin} from '@maplibre/maplibre-gl-style-spec';

const project = new URL('../../', import.meta.url);
const local = path => fileURLToPath(new URL(path, project));
await fs.mkdir(local('dist/vendor/'), {recursive: true});
await build({
  entryPoints: [local('dist/map-data/vendor-entry.mjs')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  outfile: local('dist/vendor/maplibre-gl.js'),
  legalComments: 'eof'
});
await fs.copyFile(local('node_modules/maplibre-gl/dist/maplibre-gl.css'), local('dist/vendor/maplibre-gl.css'));
await fs.copyFile(local('node_modules/maplibre-gl/LICENSE.txt'), local('dist/vendor/maplibre-gl-LICENSE.txt'));
const worker = (await fs.readFile(local('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'), 'utf8'))
  .replace(/\/\/# sourceMappingURL=.*\n?/g, '');
await fs.writeFile(local('dist/vendor/maplibre-gl-worker.mjs'), worker);
const style = JSON.parse(await fs.readFile(local('dist/map-data/caisik-style.json'), 'utf8'));
const errors = validateStyleMin(style);
if (errors.length) throw new Error(errors.map(error => error.message).join('\n'));
console.log('MapLibre vendor rebuilt; CAISIK map style valid.');

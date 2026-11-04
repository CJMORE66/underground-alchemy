import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sites } from './vite/sites-vite-plugin.ts';

// Build server behavior without transforming the retained HTML/ES-module UI.
// The build wrapper owns this temporary root and snapshots public assets first.
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = process.env.CAISIK_COMMERCE_BUILD_ROOT;
if (!buildRoot) throw new Error('Run scripts/build-commerce-worker.mjs.');
const hosting = JSON.parse(readFileSync(resolve(buildRoot, '.openai/hosting.json'), 'utf8'));
if (hosting.static != null) throw new Error('Worker hosting must omit static configuration.');

export default defineConfig({
  root: buildRoot,
  publicDir: resolve(buildRoot, 'public'),
  plugins: [
    sites({ mockAuth: false }),
    cloudflare({
      viteEnvironment: { name: 'server' },
      inspectorPort: false,
      config: {
        name: 'caisik-underground-alchemy',
        main: resolve(projectRoot, 'server/worker.js'),
        compatibility_date: '2026-10-31',
        compatibility_flags: ['nodejs_compat'],
        assets: {
          binding: 'ASSETS',
          run_worker_first: ['/api/*'],
          not_found_handling: '404-page',
        },
        d1_databases: hosting.d1 ? [{
          binding: hosting.d1,
          database_name: 'site-creator-d1',
          // Sites provisions the actual resource from .openai/hosting.json.
          database_id: '00000000-0000-4000-8000-000000000000',
        }] : [],
        r2_buckets: hosting.r2 ? [{
          binding: hosting.r2,
          bucket_name: 'site-creator-r2',
        }] : [],
      },
    }),
  ],
});

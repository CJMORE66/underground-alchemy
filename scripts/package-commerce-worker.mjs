import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// dist/ is maintained source as well as the parent of ignored build output.
// Give the official Sites packager only the output; otherwise every large
// authored image is archived twice and exceeds the native 256 MiB limit.
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [helper, destination, ...extra] = process.argv.slice(2);
if (!helper || !destination || extra.length || !isAbsolute(helper) || !isAbsolute(destination)) {
  throw new Error('Usage: node scripts/package-commerce-worker.mjs ABSOLUTE_SITES_PACKAGE_HELPER ABSOLUTE_ARCHIVE');
}
if (destination === project || destination.startsWith(`${project}/`)) {
  throw new Error('Keep the release archive outside the source checkout.');
}
const hosting = JSON.parse(readFileSync(join(project, '.openai/hosting.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(project, 'dist/server/wrangler.json'), 'utf8'));
if (!hosting.project_id || hosting.static != null || hosting.d1 !== 'COMMERCE_DB' ||
    config.assets?.binding !== 'ASSETS' || config.assets?.directory !== '../client') {
  throw new Error('Build the native commerce Worker before packaging.');
}
function digestTree(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(root, name);
      if (entry.isSymbolicLink()) throw new Error('Release output must not contain symlinks.');
      if (entry.isDirectory()) return digestTree(root, name);
      if (!entry.isFile() || !lstatSync(path).isFile()) throw new Error('Unexpected release output.');
      return [{ name, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }];
    });
}
const stage = mkdtempSync(join(tmpdir(), 'ua-worker-output-'));
try {
  mkdirSync(join(stage, '.openai'));
  cpSync(join(project, '.openai/hosting.json'), join(stage, '.openai/hosting.json'), { dereference: false });
  for (const name of ['client', 'server', '.openai']) {
    const input = join(project, 'dist', name);
    const before = digestTree(input);
    cpSync(input, join(stage, 'dist', name), { recursive: true, dereference: false });
    if (JSON.stringify(before) !== JSON.stringify(digestTree(join(stage, 'dist', name)))) {
      throw new Error('Release staging changed build bytes.');
    }
  }
  if (!existsSync(join(project, 'drizzle'))) throw new Error('Missing native D1 migrations.');
  cpSync(join(project, 'drizzle'), join(stage, 'drizzle'), { recursive: true, dereference: false });
  const { packageSite } = await import(pathToFileURL(helper).href);
  await packageSite(stage, destination);
  const bytes = statSync(destination).size;
  if (bytes > 256 * 1024 * 1024) throw new Error('Release archive exceeds the native 256 MiB limit.');
  console.log(JSON.stringify({ archive: destination, bytes, outputOnly: true, originalFrontendPreserved: true }));
} finally {
  rmSync(stage, { recursive: true, force: true });
}

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// dist/ remains the maintained static source. Only these generated, ignored
// subdirectories are replaced. Sites' native packager still receives dist/.
const project = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const frontend = join(project, 'dist');
const runtime = join(project, '.sites-commerce-build');
const statePath = join(runtime, 'state.json');
const generatedNames = ['client', 'server', '.openai'];
const generated = new Set(generatedNames);
const privateNames = new Set(['node_modules', 'secrets', 'credentials', 'private', 'drizzle']);
const privateFiles = /(?:^|[._-])(?:secret|credentials?|private[_-]?key)(?:[._-]|$)|\.(?:pem|key|p12|pfx)$/i;
const maxAssets = 20_000;
const maxAssetBytes = 25 * 1024 * 1024;

if (process.argv.length !== 2) throw new Error('This build takes no arguments.');
const hosting = JSON.parse(readFileSync(join(project, '.openai/hosting.json'), 'utf8'));
if (!hosting.project_id || hosting.static != null) {
  throw new Error('Configure the existing Site for Worker hosting (omit static) before building.');
}
if (!existsSync(join(project, 'server/worker.js'))) throw new Error('Missing server/worker.js.');

function regularDirectory(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Expected regular directory: ${relative(project, path)}`);
}
regularDirectory(frontend);
if (existsSync(runtime)) regularDirectory(runtime);
mkdirSync(runtime, { recursive: true });

const priorState = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : null;
for (const name of generatedNames) {
  const target = join(frontend, name);
  if (existsSync(target)) {
    regularDirectory(target);
    if (priorState?.version !== 1 || !priorState.generated?.includes(name)) {
      throw new Error(`Refusing to replace unowned dist/${name}. Preserve it before configuring the build.`);
    }
  }
}
// Generated directories must never hide any repository-owned frontend source.
const tracked = spawnSync('git', ['ls-files', '--', ...generatedNames.map(name => `dist/${name}`)], {
  cwd: project, encoding: 'utf8',
});
if (tracked.status === 0 && tracked.stdout.trim()) {
  throw new Error('Generated output collides with tracked frontend files.');
}

function files(directory, prefix = '') {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = join(directory, entry.name);
    // Never follow a symlink, including a hidden or excluded one.
    if (entry.isSymbolicLink()) throw new Error(`Symlink in frontend: ${name}`);
    if (!prefix && generated.has(entry.name)) continue;
    if (entry.name.startsWith('.') || privateNames.has(entry.name.toLowerCase()) || privateFiles.test(entry.name)) continue;
    if (entry.isDirectory()) result.push(...files(path, name));
    else if (entry.isFile()) {
      const stat = lstatSync(path);
      if (stat.size > maxAssetBytes) throw new Error(`Asset exceeds 25 MiB: ${name}`);
      result.push({ name, size: stat.size, hash: createHash('sha256').update(readFileSync(path)).digest('hex') });
    } else throw new Error(`Special file in frontend: ${name}`);
  }
  return result;
}
const before = files(frontend);
if (!before.some(file => file.name === 'index.html')) throw new Error('Missing frontend index.html.');
if (before.length > maxAssets) throw new Error('Frontend exceeds the conservative 20,000-asset limit.');

const stage = mkdtempSync(join(runtime, 'stage-'));
const moved = [];
try {
  for (const file of before) {
    const target = join(stage, 'public', file.name);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(frontend, file.name), target, { dereference: false });
  }
  mkdirSync(join(stage, '.openai'), { recursive: true });
  writeFileSync(join(stage, '.openai/hosting.json'), `${JSON.stringify(hosting, null, 2)}\n`);
  const migrations = join(project, 'drizzle');
  if (existsSync(migrations)) {
    // Native Sites integration copies migrations; do not put them in public/.
    cpSync(migrations, join(stage, 'drizzle'), { recursive: true, dereference: false });
  }
  const built = spawnSync(process.execPath, [
    join(project, 'node_modules/vite/bin/vite.js'), 'build',
    '--config', join(project, 'scripts/commerce-vite.config.ts'),
  ], {
    cwd: project,
    stdio: 'inherit',
    env: { ...process.env, CAISIK_COMMERCE_BUILD_ROOT: stage },
  });
  if (built.error) throw built.error;
  if (built.status !== 0) throw new Error('Commerce Worker build failed. Original frontend is unchanged.');
  const output = join(stage, 'dist');
  const worker = join(output, 'server/index.js');
  const wrangler = JSON.parse(readFileSync(join(output, 'server/wrangler.json'), 'utf8'));
  if (!existsSync(worker) || wrangler.assets?.binding !== 'ASSETS' || wrangler.assets?.directory !== '../client') {
    throw new Error('Cloudflare build did not emit the expected Worker/assets contract.');
  }
  for (const file of before) {
    const actual = createHash('sha256').update(readFileSync(join(output, 'client', file.name))).digest('hex');
    if (actual !== file.hash) throw new Error(`Build changed frontend asset: ${file.name}`);
  }
  if (JSON.stringify(files(frontend)) !== JSON.stringify(before)) {
    throw new Error('Frontend changed during the build. Freeze source edits and rebuild.');
  }

  // Swap generated outputs only after a successful build and byte checks.
  mkdirSync(join(stage, 'previous'), { recursive: true });
  for (const name of generatedNames) {
    const target = join(frontend, name);
    const backup = join(stage, 'previous', name);
    const hadPrevious = existsSync(target);
    if (hadPrevious) renameSync(target, backup);
    const record = { name, target, backup, hadPrevious, installed: false };
    moved.push(record);
    renameSync(join(output, name), target);
    record.installed = true;
  }
  writeFileSync(statePath, `${JSON.stringify({ version: 1, generated: generatedNames }, null, 2)}\n`);
  const report = {
    assets: before.length,
    assetBytes: before.reduce((sum, file) => sum + file.size, 0),
    frontendHash: createHash('sha256').update(JSON.stringify(before)).digest('hex'),
    preservedFrontend: true,
    entrypoint: 'dist/server/index.js',
    assetsDirectory: 'dist/client',
    generatedBy: 'Cloudflare Vite plugin and Sites sites() integration',
  };
  writeFileSync(join(runtime, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} catch (error) {
  for (const record of moved.reverse()) {
    if (record.installed) rmSync(record.target, { recursive: true, force: true });
    if (record.hadPrevious) renameSync(record.backup, record.target);
  }
  throw error;
} finally {
  rmSync(stage, { recursive: true, force: true });
}

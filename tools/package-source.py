"""Package public source and deployment assets; never include Git/runtime credentials."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
output = root / 'dist/downloads/caisik-cinematic-source.zip'
output.parent.mkdir(parents=True, exist_ok=True)
files = [root / name for name in ('README.md', 'package.json', 'package-lock.json', 'motion-source.js')]
files += [p for folder in ('src', 'tests', 'tools', 'docs', 'dist') for p in (root / folder).rglob('*') if p.is_file() and 'downloads' not in p.relative_to(root).parts]
files.append(root / '.openai/hosting.json')
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(set(files)):
        archive.write(path, 'caisik-underground-alchemy/' + path.relative_to(root).as_posix())
print(f'{output}: {output.stat().st_size} bytes / {len(set(files))} files')

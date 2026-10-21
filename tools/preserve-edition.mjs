import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const commit='e159616e564d8bb5904c5af55f58fdc91afe8db3';
const prefix='/editions/atlas-v13/';
const files=['index.html','atlas.js','atlas.css','atlas-principles.js','atlas-principles.css','atlas-frequency.js','atlas-frequency.css','locations-data.json','principles-data.json'];
const destination=path.join(root,'dist',prefix);mkdirSync(destination,{recursive:true});
for(const file of files){
  const result=spawnSync('git',['show',`${commit}:dist/${file}`],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
  if(result.status!==0)throw new Error(`Could not preserve ${file}: ${result.stderr}`);
  let source=result.stdout;
  for(const target of files.filter(f=>f!=='index.html')){
    source=source.replaceAll(`"/${target}"`,`"${prefix}${target}"`).replaceAll(`'/${target}'`,`'${prefix}${target}'`);
  }
  if(file==='index.html')source=source.replace('</title>',' / Edition 13</title>').replace('</head>','<meta name="robots" content="noindex"></head>').replace('<body>','<body><aside style="padding:10px 4%;background:#18160f;color:#e6dfce;font:11px/1.6 sans-serif;border-bottom:1px solid #c5a45d">PRESERVED EDITION 13 · 21 OCTOBER 2026 · <a href="/" style="color:#c5a45d;text-decoration:underline">Open the current atlas ↗</a></aside>');
  writeFileSync(path.join(destination,file),source);
}
console.log(`Preserved published version 13 from ${commit} at ${prefix}`);

import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist/assets/atlas-art');mkdirSync(output,{recursive:true});
const works=[['as-above-so-below',72,22],['transmute',2,36],['map-territory',50,41],['know-thyself',5,71],['shadow-work',39,32],['omerta-ego',33,38],['city-remembers',48,69],['underground-frequency',49,19]];
for(const [slug,first,second] of works){
  const asset=n=>'data:image/webp;base64,'+readFileSync(path.join(root,`dist/assets/masterworks/${String(n).padStart(3,'0')}.webp`)).toString('base64');
  const spokes=Array.from({length:24},(_,i)=>`<path d="M300 54V65" transform="rotate(${i*15} 300 300)"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="1200" viewBox="0 0 600 600"><title>CAISIK / ${slug.replaceAll('-',' ')} / original archive composition</title><g stroke="#c5a45d" fill="none" stroke-width=".8" opacity=".45"><circle cx="300" cy="300" r="245"/><circle cx="300" cy="300" r="210" stroke-dasharray="1 6"/><path d="M300 86L493 420H107ZM300 514L107 180H493Z" opacity=".35"/>${spokes}<path d="M20 300H75M525 300H580M300 20V75M300 525V580"/></g><image x="70" y="65" width="460" height="340" preserveAspectRatio="xMidYMid meet" href="${asset(first)}"/><image x="205" y="330" width="190" height="195" preserveAspectRatio="xMidYMid meet" href="${asset(second)}"/><path d="M260 560H340" stroke="#c5a45d" stroke-width="1"/></svg>`;
  writeFileSync(path.join(output,`${slug}.svg`),svg);
}
copyFileSync(path.join(root,'src/atlas.html'),path.join(root,'dist/index.html'));
copyFileSync(path.join(root,'src/atlas-recorder.js'),path.join(root,'dist/freestyle.js'));
function updateIncomingLinks(dir){
  for(const item of readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,item.name);
    if(item.isDirectory())updateIncomingLinks(file);
    else if(item.name.endsWith('.html')){
      const original=readFileSync(file,'utf8');
      const updated=original.replaceAll('href="/#drops"','href="/collections/underground-originals/"').replaceAll('href="/#film-portal"','href="/#living-wall"');
      if(updated!==original)writeFileSync(file,updated);
    }
  }
}
updateIncomingLinks(path.join(root,'dist'));
console.log('Built atlas homepage and eight self-contained transparent SVG compositions.');

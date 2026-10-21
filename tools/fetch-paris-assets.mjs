import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist/assets/paris');
mkdirSync(out,{recursive:true});
const entries=[
 ['notre-dame','Notre Dame Paris front facade lower.jpg'],
 ['sainte-chapelle','Sainte Chapelle Interior Stained Glass.jpg'],
 ['flamel','Détail de la façade de la Maison Nicolas Flamel.jpg'],
 ['bastille','Colonne de Juillet 972.jpg'],
 ['pere-lachaise','Père-Lachaise - Avenue latérale du Nord 02.jpg'],
 ['observatoire','Observatoire de Paris - facade nord.jpg'],
 ['guimard','Paris Metro 2 Porte Dauphine Libellule.JPG'],
 ['le-mur','TrusOne Smurfnobs Le Mur Paris.jpg'],
 ['la-villette','Grande halle de la Villette, Paris 12 March 2016.jpg'],
 ['la-place','Paris - Centre culturel La Place - 20170623 (1).jpg'],
 ['victor-hugo','Maison de Victor Hugo, place des Vosges à Paris.jpg']
];
const api=new URL('https://commons.wikimedia.org/w/api.php');
api.search=new URLSearchParams({action:'query',titles:entries.map(([,name])=>'File:'+name).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'1280',format:'json'});
const options={headers:{'User-Agent':'CAISIK-HiddenCity/1.0 (educational atlas; photo attribution)'},signal:AbortSignal.timeout(45000)};
const response=await fetch(api,options);if(!response.ok)throw new Error(`Commons metadata HTTP ${response.status}`);
const data=await response.json(),pages=Object.values(data.query.pages),credits=[];
const strip=s=>String(s||'').replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&#039;',"'").replaceAll('&quot;','"');
for(const [id,name] of entries){
 const page=pages.find(p=>p.title==='File:'+name),info=page?.imageinfo?.[0];
 if(!info)throw new Error(`No verified image metadata for ${id}`);
 const image=await fetch(info.thumburl||info.url,{...options,signal:AbortSignal.timeout(45000)});
 if(!image.ok)throw new Error(`${id}: image HTTP ${image.status}`);
 const bytes=Buffer.from(await image.arrayBuffer());if(bytes.length<1000||bytes[0]!==255||bytes[1]!==216)throw new Error(`${id}: expected JPEG photograph`);
 writeFileSync(path.join(out,id+'.jpg'),bytes);
 const meta=info.extmetadata;
 credits.push({id,name:name.replace(/\.jpg$/i,''),title:page.title,author:strip(meta.Artist?.value),license:strip(meta.LicenseShortName?.value),licenseUrl:meta.LicenseUrl?.value||'',sourceUrl:info.descriptionurl,imageUrl:info.thumburl||info.url,description:strip(meta.ImageDescription?.value),note:id==='le-mur'?'Archival 2015 photograph; wall artworks change. Depicted artwork by TrusOne / Smurfnobs.':'Resized photographic source; presentation may crop or desaturate the image.',checkedAt:'2026-10-21'});
 writeFileSync(path.join(out,'credits.json'),JSON.stringify(credits,null,2)+'\n');
 console.log(`${id}: ${bytes.length} bytes / ${strip(meta.LicenseShortName?.value)}`);
}

/* Optional, source-backed field research. Never manufacture a map point. */
export const CULTURE_CATEGORIES={graffiti:'Graffiti',artshop:'Graffiti shop',hiphop:'Music',recordshop:'Record shop',philosophy:'Philosophy'};
const text=(value,max=6000)=>typeof value==='string'&&value.trim().length>2&&value.length<=max;
const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function parseCultureData(data,knownIds=[]){
 const places=[],warnings=[],seen=new Set(knownIds);
 if(data?.version!==1||!Array.isArray(data.places))return {places,warnings:['Kulturní průvodce nemá podporovaný formát.']};
 for(const raw of data.places){
  const id=raw?.id;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id||'')||seen.has(id)||!Object.hasOwn(CULTURE_CATEGORIES,raw.category)||!['writer','mc','dj','knowledge'].includes(raw.relatedExpedition)||!['name','address','access','coordinateStatus'].every(k=>text(raw[k]))||!date(raw.checkedAt)||!Array.isArray(raw.facts)||!raw.facts.length||!raw.facts.every(v=>text(v))||!Array.isArray(raw.sources)||!raw.sources.length||!raw.sources.every(s=>text(s?.title)&&https(s?.url))||!['question','observe','try','review','output'].every(k=>text(raw.task?.[k]))){warnings.push(`Záznam ${id||'bez ID'} nelze bezpečně načíst.`);continue;}
  const mapped=typeof raw.lat==='number'&&typeof raw.lng==='number'&&Number.isFinite(raw.lat)&&Number.isFinite(raw.lng)&&raw.lat>48.7&&raw.lat<49.1&&raw.lng>2.1&&raw.lng<2.7&&https(raw.coordinateSource);
  const entry=Object.fromEntries(['id','name','address','category','access','coordinateStatus','checkedAt','relatedExpedition'].map(k=>[k,raw[k]]));
  for(const k of ['legacy','interpretation','accessibility'])if(text(raw[k]))entry[k]=raw[k];
  places.push({...entry,lat:mapped?raw.lat:null,lng:mapped?raw.lng:null,coordinateSource:mapped?raw.coordinateSource:null,outdoorViewing:raw.outdoorViewing===true,facts:[...raw.facts],sources:raw.sources.map(s=>({title:s.title,url:s.url})),task:Object.fromEntries(['question','observe','try','review','output'].map(k=>[k,raw.task[k]]))});seen.add(id);
 }
 return {places,warnings};
}
export function culturePlace(p){
 return {...p,culture:true,categories:[CULTURE_CATEGORIES[p.category],...(p.category==='artshop'?['Graffiti']:p.category==='recordshop'?['Music']:[])],period:'Současná kulturní místa',accessVerified:false,outdoorViewing:p.outdoorViewing===true,history:p.facts.join(' '),symbols:'Doložený kulturní kontext: '+p.facts[0],interpretation:p.interpretation||'Autorská perspektiva CAISIK: místo je podnětem k vlastní tvorbě a pozornému poslouchání. Nejde o tvrzení provozovatele.',observe:p.task.observe,reflection:p.task.question,challenge:p.task.try+' Výstup: '+p.task.output,accessibility:p.accessibility||'Podrobnou bezbariérovou trasu a vybavení ověř přímo u provozovatele. Přístup nebyl osobně prověřen.'};
}
export function cultureRoutes(entries){
 const ids=new Set(entries.map(p=>p.id));
 return [
  {id:'culture-letters-memory',title:'PÍSMENO / PAMĚŤ / VLASTNÍ STOPA',description:'Blackbook v Le Grand Jeu, kurátorský M.U.R. a knižní archiv Lavo//Matik. Výběr samostatných zastávek; rozlož si jej podle otevírání. Není to povolení k malování.',stops:['le-grand-jeu','mur-oberkampf','le-lavomatik']},
  {id:'culture-record-voice',title:'OD DESKY K VLASTNÍMU HLASU',description:'Poslech v Superfly Records, hip-hopové centrum La Place a program FGO-Barbara. Přenes jednu konkrétní zvukovou volbu do vlastní sloky; účast na akci ověř v programu.',stops:['superfly-records','la-place','fgo-barbara']},
  {id:'culture-question-answer',title:'MYŠLENKA MUSÍ OBSTÁT',description:'Čtení u Shakespeare and Company, veřejná debata Café des Phares a rozmanitý program Forum104. Zastávky jsou podněty ke třem verzím vlastní otázky, nikoli rezervované setkání.',stops:['shakespeare-company','cafe-des-phares','forum104']}
 ].filter(r=>r.stops.every(id=>ids.has(id)||['mur-oberkampf','la-place','shakespeare-company'].includes(id)));
}

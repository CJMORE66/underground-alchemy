import {locations,routes} from './paris-locations.js';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function filterLocations(items,filters={},saved=new Set()) {
  const query=normalize(filters.query).trim();
  return items.filter(p=>(!query || normalize(`${p.name} ${p.neighborhood} ${p.concepts} ${p.address}`).includes(query)) && (!filters.topic || p.topics.includes(filters.topic)) && (!filters.period || p.period===filters.period) && (!filters.accessibility || p.accessibility===filters.accessibility) && (!filters.savedOnly || saved.has(p.id)));
}
export function readSaved(storage) {
  try {
    const data=JSON.parse(storage.getItem('caisik-explorer-v1')) || {};
    return {places:Array.isArray(data.places)?[...new Set(data.places.filter(id=>locations.some(p=>p.id===id)))]:[],routes:Array.isArray(data.routes)?[...new Set(data.routes.filter(id=>routes.some(r=>r.id===id)))]:[]};
  } catch {return {places:[],routes:[]};}
}
export function writeSaved(storage,data) {try {storage.setItem('caisik-explorer-v1',JSON.stringify(data));return true;}catch{return false;}}
export function nearestLocations(items,latitude,longitude) {
  const rad=Math.PI/180;
  return items.map(p=>{const a=Math.sin((p.lat-latitude)*rad/2)**2+Math.cos(latitude*rad)*Math.cos(p.lat*rad)*Math.sin((p.lng-longitude)*rad/2)**2;return {...p,distanceKm:6371*2*Math.asin(Math.sqrt(Math.min(1,a)))};}).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,3);
}
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function mountExplorer(root) {
  const photoCredits=fetch('/assets/paris/credits.json').then(response=>response.ok?response.json():[]).catch(()=>[]);
  let storage;try {storage=window.localStorage;}catch{}
  const saved=readSaved(storage), placeSaves=new Set(saved.places),routeSaves=new Set(saved.routes);
  let map,markers,routeLine,selectedRoute='',lastOpener,restorePlaceId,suppressFocusRestore=false;
  root.innerHTML=`<div class="ex-toolbar"><label class="ex-search">SEARCH THE CITY<input id="ex-search" type="search" placeholder="Flamel, Gothic, hip-hop, Marais…" autocomplete="off"></label><label>LAYER<select id="ex-topic"><option value="">Every layer</option>${['symbolism','architecture','geometry','graffiti','music','history','philosophy','art'].map(t=>`<option>${t}</option>`).join('')}</select></label><label>PERIOD<select id="ex-period"><option value="">Every period</option>${[...new Set(locations.map(p=>p.period))].map(t=>`<option>${t}</option>`).join('')}</select></label><label>ACCESSIBILITY<select id="ex-access"><option value="">All access notes</option><option value="verified">Step-free verified</option><option value="unknown">Check venue guidance</option></select></label></div>
  <div class="ex-actions"><label class="ex-check"><input id="ex-saved-only" type="checkbox"> Saved discoveries only</label><button type="button" id="ex-locate">◎ Locate me</button><button type="button" id="ex-reset">Reset filters</button><span id="ex-count" role="status" aria-live="polite"></span></div>
  <p class="ex-status" id="ex-status" role="status" aria-live="polite">Map points orient your visit; they are not surveyed entrances. No location permission is requested until you choose “Locate me”.</p>
  <div class="ex-layout"><div class="ex-list" id="ex-list" aria-label="Paris discoveries"></div><div class="ex-map-wrap"><div id="ex-map" class="ex-map" role="region" aria-label="Interactive map of Paris discoveries"></div><p class="ex-map-note">PARIS · 48°51′ N / 2°21′ E <span>Choose any marker or use the complete list.</span></p></div></div>
  <div class="ex-routes"><div><span class="ex-kicker">FOLLOW A THREAD</span><h3>Three ways through the city.</h3></div><label>THEMATIC ROUTE<select id="ex-route"><option value="">Choose an ordered itinerary</option>${routes.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select></label><div id="ex-route-detail"></div></div>
  <dialog class="ex-dialog" id="ex-profile" aria-labelledby="ex-profile-title"><div id="ex-profile-content"></div></dialog>`;
  const $=selector=>root.querySelector(selector), status=message=>{$('#ex-status').textContent=message;};
  const dialog=$('#ex-profile');
  function persist(){const success=writeSaved(storage,{places:[...placeSaves],routes:[...routeSaves]});if(!success)status('Saved for this visit only. Browser storage is unavailable or full.');updateSavedCount();return success;}
  function updateSavedCount(){const counter=document.querySelector('#saved-count');if(counter)counter.textContent=String(placeSaves.size+routeSaves.size);}
  function filters(){return {query:$('#ex-search').value,topic:$('#ex-topic').value,period:$('#ex-period').value,accessibility:$('#ex-access').value,savedOnly:$('#ex-saved-only').checked};}
  function render(){
    const visible=filterLocations(locations,filters(),placeSaves);
    $('#ex-count').textContent=`${visible.length} / ${locations.length} discoveries`;
    $('#ex-list').innerHTML=visible.length?visible.map((p,i)=>`<article class="ex-card"><span class="ex-card-index">${String(locations.indexOf(p)+1).padStart(2,'0')}</span><div><p class="ex-kicker">${escapeHTML(p.neighborhood)}</p><button class="ex-open" type="button" data-place="${p.id}">${escapeHTML(p.name)} <span aria-hidden="true">↗</span></button><p class="ex-tags">${p.topics.map(escapeHTML).join(' / ')}</p></div><button type="button" class="ex-save" data-save="${p.id}" aria-label="${placeSaves.has(p.id)?'Unsave':'Save'} ${escapeHTML(p.name)}" aria-pressed="${placeSaves.has(p.id)}">${placeSaves.has(p.id)?'★':'☆'}</button></article>`).join(''):'<div class="ex-empty"><h3>No discoveries match.</h3><p>Try another word or reset the filters. Step-free access has not been individually verified for these profiles.</p><button type="button" data-reset>Reset filters</button></div>';
    if(map){markers.clearLayers();visible.forEach(p=>{const marker=L.marker([p.lat,p.lng],{title:p.name,alt:p.name,icon:L.divIcon({className:'ex-marker',html:`<span>${String(locations.indexOf(p)+1).padStart(2,'0')}</span>`,iconSize:[34,34],iconAnchor:[17,17]})}).addTo(markers);marker.on('click',()=>openProfile(p.id));});}
  }
  function reset(){['#ex-search','#ex-topic','#ex-period','#ex-access'].forEach(s=>$(s).value='');$('#ex-saved-only').checked=false;render();}
  function toggleSave(id){placeSaves.has(id)?placeSaves.delete(id):placeSaves.add(id);persist();render();if(dialog.open){const b=dialog.querySelector('[data-profile-save]');if(b){b.textContent=placeSaves.has(id)?'★ Saved discovery':'☆ Save discovery';b.setAttribute('aria-pressed',String(placeSaves.has(id)));}}}
  function openProfile(id){
    const p=locations.find(p=>p.id===id);if(!p)return;
    if(!dialog.open){lastOpener=document.activeElement;restorePlaceId=id;}
    const nearby=locations.filter(n=>n.id!==id).sort((a,b)=>(a.lat-p.lat)**2+(a.lng-p.lng)**2-((b.lat-p.lat)**2+(b.lng-p.lng)**2)).slice(0,3);
    $('#ex-profile-content').innerHTML=`<button class="ex-close" type="button" data-close aria-label="Close location profile">Close ×</button><img class="ex-profile-image" src="/assets/paris/${p.id}.jpg" alt="${escapeHTML(p.name)}" loading="lazy"><div class="ex-profile-body"><p class="ex-kicker">PARIS FIELD NOTE · ${escapeHTML(p.neighborhood)}</p><h2 id="ex-profile-title">${escapeHTML(p.name)}</h2><p class="ex-address">${escapeHTML(p.address)}<br><small>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)} · approximate orientation point</small></p><div class="ex-profile-actions"><button type="button" data-profile-save="${p.id}" aria-pressed="${placeSaves.has(p.id)}">${placeSaves.has(p.id)?'★ Saved discovery':'☆ Save discovery'}</button><a href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}" target="_blank" rel="noopener noreferrer">Open street map ↗</a></div><section class="ex-evidence"><span class="ex-label">01 / DOCUMENTED HISTORY</span><p>${escapeHTML(p.history)}</p><h3>Symbols in context</h3><p>${escapeHTML(p.symbol)}</p></section><section class="ex-interpretation"><span class="ex-label">02 / ORIGINAL SYMBOLIC INTERPRETATION</span><p>${escapeHTML(p.interpretation)}</p></section><section><span class="ex-label">03 / LOOK CLOSER</span><p>${escapeHTML(p.look)}</p><h3>A question to carry</h3><p>${escapeHTML(p.reflection)}</p><h3>Street-to-sound challenge</h3><p>${escapeHTML(p.challenge)}</p><button type="button" data-challenge="${p.id}">Take this to the freestyle lab ↗</button></section><section class="ex-access-note"><span class="ex-label">04 / ACCESS · CHECKED 21 OCTOBER 2026</span><p>${escapeHTML(p.access)}</p><p><strong>Accessibility: not individually verified.</strong> ${escapeHTML(p.accessNote)}</p></section><section><span class="ex-label">05 / OFFICIAL SOURCES</span><ul>${p.sources.map(s=>`<li><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.label)} ↗</a></li>`).join('')}</ul><p class="ex-credit" id="ex-photo-credit">Photograph: see <a href="/assets/paris/credits.json" target="_blank" rel="noopener">image credits</a>. Images show a particular moment; current conditions may differ.</p></section><section><span class="ex-label">NEARBY IN THIS ARCHIVE</span><div class="ex-nearby">${nearby.map(n=>`<button type="button" data-place="${n.id}">${escapeHTML(n.name)} ↗</button>`).join('')}</div></section></div>`;
    photoCredits.then(credits=>{const credit=credits.find(c=>c.id===id),element=$('#ex-photo-credit');if(credit&&element&&dialog.querySelector('[data-profile-save]')?.dataset.profileSave===id){element.innerHTML=`Photo: ${escapeHTML(credit.author)} · ${credit.licenseUrl?`<a href="${escapeHTML(credit.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(credit.license)}</a>`:escapeHTML(credit.license)} · <a href="${escapeHTML(credit.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original photograph ↗</a><br>${escapeHTML(credit.note)}${/crop|desaturat/i.test(credit.note)?'':' Presentation may crop or desaturate the photograph.'}`;}});
    if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('[data-close]').focus({preventScroll:true});
    if(map)map.panTo([p.lat,p.lng]);
  }
  function renderRoute(){
    const route=routes.find(r=>r.id===selectedRoute);
    if(routeLine&&map){map.removeLayer(routeLine);routeLine=null;}
    $('#ex-route-detail').innerHTML=route?`<p>${escapeHTML(route.description)}</p><p class="ex-route-disclaimer">The line connects stops in order; it is not turn-by-turn pedestrian navigation. Use public streets and check individual opening times.</p><ol>${route.stops.map(id=>{const p=locations.find(p=>p.id===id);return `<li><button type="button" data-place="${id}">${escapeHTML(p.name)} ↗</button></li>`;}).join('')}</ol><button type="button" id="ex-save-route" aria-pressed="${routeSaves.has(route.id)}">${routeSaves.has(route.id)?'★ Saved route':'☆ Save route'}</button>`:'';
    if(route&&map){routeLine=L.polyline(route.stops.map(id=>{const p=locations.find(p=>p.id===id);return [p.lat,p.lng];}),{color:'#C5A45D',weight:2,dashArray:'5 8'}).addTo(map);map.fitBounds(routeLine.getBounds(),{padding:[35,35],maxZoom:14});}
  }
  root.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.place)openProfile(target.dataset.place);
    if(target.dataset.save){const id=target.dataset.save;toggleSave(id);(root.querySelector(`[data-save="${id}"]`)||$('#ex-search')).focus();}
    if(target.dataset.profileSave)toggleSave(target.dataset.profileSave);
    if(target.hasAttribute('data-close'))dialog.close();
    if(target.hasAttribute('data-reset')||target.id==='ex-reset')reset();
    if(target.id==='ex-save-route'){routeSaves.has(selectedRoute)?routeSaves.delete(selectedRoute):routeSaves.add(selectedRoute);persist();renderRoute();$('#ex-save-route').focus();}
    if(target.dataset.challenge){const p=locations.find(p=>p.id===target.dataset.challenge);suppressFocusRestore=true;dialog.close();window.dispatchEvent(new CustomEvent('caisik-challenge',{detail:{location:p.name,prompt:p.challenge}}));document.querySelector('#frequency, #freestyle-lab, #lab')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  });
  dialog.addEventListener('close',()=>{if(suppressFocusRestore){suppressFocusRestore=false;return;}const opener=lastOpener?.isConnected?lastOpener:root.querySelector(`.ex-list [data-place="${restorePlaceId}"]`)||$('#ex-search');opener.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  $('#ex-search').addEventListener('input',render);
  ['#ex-topic','#ex-period','#ex-access','#ex-saved-only'].forEach(s=>$(s).addEventListener('change',render));
  $('#ex-route').addEventListener('change',event=>{selectedRoute=event.target.value;renderRoute();});
  $('#ex-locate').addEventListener('click',()=>{
    if(!navigator.geolocation){status('Geolocation is not available in this browser. You can still explore every place in the list.');return;}
    const button=$('#ex-locate');button.disabled=true;status('Waiting for your location permission…');
    navigator.geolocation.getCurrentPosition(position=>{button.disabled=false;const nearby=nearestLocations(locations,position.coords.latitude,position.coords.longitude);status(`Nearest archive entries: ${nearby.map(p=>`${p.name} (${p.distanceKm.toFixed(1)} km)`).join(' · ')}. Straight-line distances, not walking routes. Coordinates were used only in this browser; the map was not moved.`);},error=>{button.disabled=false;status(error.code===1?'Location permission was declined. Search or browse the list instead.':error.code===3?'Location request timed out. Try again or use the map manually.':'Your location could not be determined. Browse the map or list instead.');},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  });
  updateSavedCount();render();
  window.addEventListener('caisik-clear-discoveries',event=>{placeSaves.clear();routeSaves.clear();if(!persist()&&event.detail)event.detail.persistent=false;render();renderRoute();if(dialog.open)dialog.close();});
  const css=document.createElement('link');css.rel='stylesheet';css.href='/vendor/leaflet.css';document.head.append(css);
  const script=document.createElement('script');script.src='/vendor/leaflet.js';
  script.onload=()=>{map=L.map($('#ex-map'),{scrollWheelZoom:false}).setView([48.862,2.35],12);markers=L.layerGroup().addTo(map);const tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);let warned=false;tiles.on('tileerror',()=>{if(!warned){status('Some map tiles could not load. All locations and source links remain available in the discovery list.');warned=true;}});render();renderRoute();new ResizeObserver(()=>map.invalidateSize()).observe($('#ex-map'));};
  script.onerror=()=>{status('The interactive map could not load. Use the complete discovery list and the street-map links in each profile.');$('#ex-map').innerHTML='<p class="ex-map-fallback">The map is unavailable.<br>Explore all 11 places in the list.</p>';};document.head.append(script);
}
if(typeof document!=='undefined'){const root=document.querySelector('#explorer-app');if(root)mountExplorer(root);}

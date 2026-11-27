/* The location is the address of a room. Creative work stays in its original store. */
const tabs = document.getElementById('edition-tabs');
const aliases = {
  'needle-street':'#story/continue', 'street-trails':'#story/trails', 'metro-quest':'#story/dj',
  'metro-platform':'#story/dj', 'revizor-panel':'#story/mc', 'writer-quest':'#story/writer',
  'shadow-quest':'#story/breaking', 'corner-quest':'#story/knowledge', 'corner-recall':'#story/knowledge',
  'hidden-city':'#atlas/places', routes:'#atlas/routes', principles:'#atlas/principles/mentalism',
  frequency:'#workshop/frequency', 'living-wall':'#atlas/gallery', methodology:'#atlas/sources',
  manifesto:'#atlas/manifesto', 'alchymista-entry':'#workshop/guide', 'alchemist-practice':'#workshop/guide',
  'culture-district':'#atlas/places?view=culture', studios:'#atlas/places?view=studios',
  'alchemy-prologue':'#film', expeditions:'#atlas/expeditions',
};
const sections = new Set(['story','atlas','workshop','blackbook']);
const titles = {story:'Příběh',atlas:'Atlas Paříže',workshop:'Dílna',blackbook:'Můj Blackbook'};
let route;
function parse(hash) {
  const raw = (hash || '').slice(1);
  if (!raw || ['home','film'].includes(raw)) {
    return {section:'entry',parts:[raw || 'film'],params:new URLSearchParams(),hash:hash || ''};
  }
  const translated = aliases[raw] || hash;
  const split = translated.indexOf('?');
  const path = translated.slice(1, split < 0 ? undefined : split);
  const [section,...parts] = path.split('/').filter(Boolean);
  if (!sections.has(section)) return null;
  return {section,parts,params:new URLSearchParams(split < 0 ? '' : translated.slice(split + 1)),hash:translated};
}

function visibleRooms({section,parts}) {
  const [page] = parts;
  if (section === 'entry' || section === 'story') return new Set(['story']);
  if (section === 'blackbook') return new Set(['blackbook']);
  if (section === 'workshop') {
    const view = page === 'frequency' ? 'frequency' : page === 'guide' ? 'guide' : 'workshop';
    return new Set([view]);
  }
  const views = {places:'atlas-places', routes:'atlas-places', principles:'atlas-principles', gallery:'gallery',
    manifesto:'manifesto', sources:'sources', expeditions:'expeditions'};
  return new Set(['atlas-nav',views[page] || 'zin']);
}

function sourceHash(value) {
  if (typeof value !== 'string' || value.length > 1200 || !/^#(atlas|story|blackbook)\b/.test(value)) return '';
  return parse(value)?.hash || '';
}
const key='caisik-edition-v1';
function remember(hash) {
  try { localStorage.setItem(key,JSON.stringify({version:1,hash})); } catch { /* The current URL still works. */ }
}

function apply(hash, options = {}) {
  const next = parse(hash);
  if (!next) return;
  const previous = route;
  route = next;
  document.documentElement.dataset.editionSection = next.section;
  const views = visibleRooms(next);
  for (const el of document.querySelectorAll('[data-edition-room]')) el.toggleAttribute('data-edition-closed', !views.has(el.dataset.editionRoom));
  const entry = next.section === 'entry';
  for (const id of ['home','alchemy-prologue']) document.getElementById(id)?.toggleAttribute('data-edition-closed', !entry);
  tabs.hidden = entry;
  for (const link of document.querySelectorAll('[data-room-tab]')) {
    if (link.dataset.roomTab === next.section) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  for (const link of document.querySelectorAll('#edition-atlas-nav a')) {
    const group = link.hash.split('/')[1];
    const current = next.parts[0] || 'zin';
    if (next.section === 'atlas' && (group === current || (group === 'places' && current === 'routes'))) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  const back = document.querySelector('[data-source-back]');
  const origin = sourceHash(next.params.get('from'));
  back.hidden = !origin;
  if (origin) back.setAttribute('href',origin); else back.removeAttribute('href');
  if (!entry) remember(next.hash);
  document.title = entry ? 'CAISIK — The Hidden City / Underground Alchemy' : titles[next.section]+' · CAISIK Underground Alchemy';
  // Restore the scroll origin before each specialized layer focuses its exact destination.
  if (!options.quiet && (!previous || previous.section !== next.section || previous.parts[0] !== next.parts[0])) {
    if (!entry || next.parts[0] === 'film') window.scrollTo?.({top:0,behavior:'instant'});
    if (!entry && next.section !== 'story') {
      const targets = { 'atlas-places':'hidden-city','atlas-principles':'principles',zin:'paris-zin',
        gallery:'living-wall',manifesto:'manifesto',sources:'methodology',expeditions:'expeditions',
        frequency:'frequency',workshop:'ed-workshop-title',guide:'alchymista-entry',blackbook:'edition-blackbook' };
      const view = [...views].find(id=>targets[id]);
      const target = document.getElementById(targets[view]);
      if (target) { target.setAttribute('tabindex','-1');target.focus({preventScroll:true}); }
    }
  }
  window.dispatchEvent(new CustomEvent('ua:route',{detail:next}));
}

function navigate(hash,options = {}) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || !parse(hash)) return false;
  const next = parse(hash).hash;
  if (location.hash !== next) history[options.replace ? 'replaceState':'pushState'](null,'',next);
  apply(next,{quiet:options.replace});
  return true;
}
window.UAEdition = {navigate,current:()=>route,sourceHash};
window.addEventListener('hashchange',()=>apply(location.hash));
// Native hash navigation and back/forward are preserved for the unchanged film controls.
document.addEventListener('click',event=>{
  if (event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link=event.target.closest('a[href]');
  if (!link || link.closest('[data-film-prologue]') || link.target || link.hasAttribute('download')) return;
  const target=new URL(link.href,location.href);
  if (target.origin!==location.origin || target.pathname!==location.pathname || !parse(target.hash) || !target.hash) return;
  event.preventDefault();
  navigate(target.hash);
});
apply(location.hash);

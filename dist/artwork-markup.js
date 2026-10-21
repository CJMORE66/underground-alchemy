/* Shared accessible-host markup; the enclosing native control names the artwork. */
const attr=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function artworkMarkup({id,poster,width=1254,height=1254}) {
  return `<span class="living-art" data-art-scene="${attr(id)}" style="--art-ratio:${Number(width)}/${Number(height)}" aria-hidden="true"><img class="living-art-poster" src="${attr(poster)}" alt="" width="${Number(width)}" height="${Number(height)}" loading="lazy" decoding="async"><span class="living-art-stage"></span></span>`;
}

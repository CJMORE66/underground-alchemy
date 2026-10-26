/* Small, interruptible workspace transitions. Native navigation owns the state. */
export function createPanelMotion(root, {allowed} = {}) {
  const doc = root.ownerDocument;
  const view = doc.defaultView || globalThis;
  const preference = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const fine = view.matchMedia?.('(hover: hover) and (pointer: fine)');
  const permitted = allowed || (() => !doc.hidden && !preference?.matches &&
    fine?.matches && doc.documentElement.dataset.motion !== 'off' &&
    !['reduced', 'quiet', 'calm', 'off'].includes(doc.documentElement.dataset.selfmadeMotion));
  let epoch = 0, destroyed = false;
  const animations = new Set();
  function stop() {
    for (const animation of animations) animation.cancel();
    animations.clear();
  }
  function animate(node, frames, options) {
    if (typeof node.animate !== 'function') return null;
    try {
      const animation = node.animate(frames, options);
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
      return animation;
    } catch { return null; }
  }
  async function show(id) {
    const request = ++epoch;
    stop();
    if (destroyed) return false;
    const panels = [...root.querySelectorAll('.play-panel')];
    const target = panels.find(panel => panel.id === id);
    if (!target) return false;
    const previous = panels.find(panel => !panel.hidden && panel !== target);
    if (previous && permitted()) {
      const outgoing = animate(previous, [
        {opacity: 1, transform: 'translateY(0px)'},
        {opacity: 0.18, transform: 'translateY(-7px)'}
      ], {duration: 145, easing: 'cubic-bezier(.45,0,.75,.4)', fill: 'none'});
      if (outgoing) await outgoing.finished.catch(() => {});
    }
    if (destroyed || request !== epoch) return false;
    for (const panel of panels) panel.hidden = panel !== target;
    if (previous && permitted()) animate(target, [
      {opacity: 0.28, transform: 'translateY(9px)'},
      {opacity: 1, transform: 'translateY(0px)'}
    ], {duration: 290, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'none'});
    return true;
  }
  const refresh = () => { if (!permitted()) stop(); };
  preference?.addEventListener?.('change', refresh);
  fine?.addEventListener?.('change', refresh);
  doc.addEventListener('visibilitychange', refresh);
  const observer = typeof view.MutationObserver === 'function' ? new view.MutationObserver(refresh) : null;
  observer?.observe(doc.documentElement, {attributes: true, attributeFilter: ['data-motion', 'data-selfmade-motion']});
  return {
    show,
    destroy() {
      destroyed = true;
      epoch++;
      stop();
      observer?.disconnect();
      preference?.removeEventListener?.('change', refresh);
      fine?.removeEventListener?.('change', refresh);
      doc.removeEventListener('visibilitychange', refresh);
    }
  };
}

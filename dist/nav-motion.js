/* CAISIK signature disclosure and native chapter navigation. */
(() => {
  const header = document.querySelector('[data-primary-header]');
  const toggle = header?.querySelector('#menu-toggle');
  const nav = header?.querySelector('#main-nav');
  if (!nav || !toggle) return;

  const root = document.documentElement;
  function applyStoredMotion() {
    try {
      const saved = localStorage.getItem('atlas-motion');
      const paused = saved === '"off"' || saved === 'off';
      if (header.dataset.brandRoute === 'shop') {
        root.dataset.motion = paused ? 'off' : 'on';
      } else if (paused) {
        root.dataset.motion = 'off';
      }
    } catch { /* Motion preferences work without persistent storage. */ }
  }
  applyStoredMotion();

  const languageMount = header.querySelector('[data-brand-language]');
  const languageDock = document.querySelector('body > [data-language-dock]');
  if (languageDock && languageMount) languageMount.append(languageDock);

  const words = {
    cs: ['Hlavní navigace', 'Úvod', 'Košík'],
    en: ['Main navigation', 'Home', 'Cart'],
    fr: ['Navigation principale', 'Accueil', 'Panier'],
  };
  const homeLabel = nav.querySelector('[data-brand-home]');
  const cartLabel = header.querySelector('[data-brand-cart]');
  function localize(language = root.lang) {
    const [navigation, home, cart] = words[language] || words.en;
    nav.setAttribute('aria-label', navigation);
    if (homeLabel) homeLabel.textContent = home;
    if (cartLabel) cartLabel.textContent = cart;
  }
  localize();
  window.addEventListener('caisik:languagechange', event => localize(event.detail?.language));

  const chapters = [...nav.querySelectorAll('a[href^="#"]')].flatMap(link => {
    const href = link.getAttribute('href');
    const target = document.getElementById(href.slice(1));
    return target ? [{ href, target, link }] : [];
  });
  let open = false;
  let current = null;
  let frame = 0;

  const inside = node => !!node && (toggle.contains(node) || nav.contains(node) || node.closest?.('dialog[open]'));
  function setOpen(next, restore = false) {
    open = next;
    if (restore && !open) toggle.focus({ preventScroll: true });
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    nav.hidden = !open;
    if (open) nav.scrollTop = 0;
  }

  function setCurrent(next) {
    if (next === current) return;
    current?.removeAttribute('aria-current');
    next?.setAttribute('aria-current', 'location');
    current = next;
  }

  function trackSection() {
    frame = 0;
    const padding = Number.parseFloat(window.getComputedStyle(root).scrollPaddingTop) || 0;
    const line = Math.max(header.getBoundingClientRect().bottom + 26, padding + 2);
    const chapter = chapters.find(({ target }) => {
      const { top, bottom } = target.getBoundingClientRect();
      return top <= line && bottom > line;
    });
    setCurrent(chapter?.link ?? null);
  }

  function scheduleTrack() {
    if (!frame && !document.hidden && chapters.length) frame = window.requestAnimationFrame(trackSection);
  }

  function trackHash() {
    setCurrent(chapters.find(chapter => chapter.href === window.location.hash)?.link ?? null);
    scheduleTrack();
  }

  function syncVisibility(sleep = document.hidden) {
    header.toggleAttribute('data-nav-sleeping', sleep);
    if (sleep && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else if (!sleep) {
      scheduleTrack();
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));
  nav.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!open || !link || event.defaultPrevented || event.button > 0 ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

    const target = chapters.find(chapter => chapter.link === link)?.target;
    if (!target) {
      setOpen(false, nav.contains(document.activeElement));
      return;
    }
    // Native fragments keep scroll and history, while focus follows the destination.
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    setOpen(false);
    target.focus({ preventScroll: true });
  });
  document.addEventListener('focusin', event => {
    if (open && !inside(event.target)) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (open && !inside(event.target)) setOpen(false, nav.contains(document.activeElement));
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !open || event.defaultPrevented || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    setOpen(false, true);
  });
  window.addEventListener('hashchange', trackHash);
  window.addEventListener('scroll', scheduleTrack, { passive: true });
  window.addEventListener('resize', scheduleTrack, { passive: true });
  window.addEventListener('storage', event => {
    if (header.dataset.brandRoute === 'shop' && (event.key === 'atlas-motion' || event.key === null)) applyStoredMotion();
  });
  document.addEventListener('visibilitychange', () => syncVisibility());
  window.addEventListener('pagehide', () => syncVisibility(true));
  window.addEventListener('pageshow', () => syncVisibility());
  setOpen(false);
  toggle.hidden = false;
  header.setAttribute('data-nav-ready', '');
  trackHash();
  syncVisibility();
})();

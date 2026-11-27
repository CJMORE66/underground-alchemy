// Shared by the directly served edition and its existing quest modules.
(() => {
  const drafts = new Map();
  const controllers = new Map();
  let temporary = false;
  const storage = {
    getItem(key) {
      if (drafts.has(key)) return drafts.get(key);
      try { return localStorage.getItem(key); } catch { return null; }
    },
    setItem(key, value) {
      const raw = String(value);
      try {
        localStorage.setItem(key, raw);
        drafts.delete(key);
      } catch {
        drafts.set(key, raw);
        if (!temporary) {
          temporary = true;
          window.dispatchEvent(new Event('ua:temporary-storage'));
        }
      }
    },
    removeItem(key) {
      try { localStorage.removeItem(key); drafts.delete(key); }
      catch { drafts.set(key, null); }
    },
  };
  const draftKey = scene => 'caisik-story-draft-v1:' + scene;
  function read(key) {
    try { return JSON.parse(storage.getItem(key)); } catch { return null; }
  }
  const state = {
    storage, read,
    get temporary() { return temporary; },
    getDraft(scene) { return read(draftKey(scene)) || {}; },
    saveDraft(scene, value) {
      const record = JSON.stringify(value);
      if (record !== storage.getItem(draftKey(scene))) storage.setItem(draftKey(scene), record);
    },
    hasDJMix() {
      const steps = read('caisik-metro-dj-v1')?.steps;
      return Array.isArray(steps) && steps.length === 8 && steps.every(v => typeof v === 'boolean') && steps.includes(true);
    },
    register(scene, controller) { controllers.set(scene, controller); },
    get(scene) { return controllers.get(scene); },
    last() { return read('caisik-story-checkpoint-v1'); },
    remember(value) { storage.setItem('caisik-story-checkpoint-v1', JSON.stringify(value)); },
  };
  window.UAStoryState = state;
})();

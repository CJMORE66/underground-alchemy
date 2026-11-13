(() => {
  const exhibit = document.querySelector('.iris-hero');
  if (!exhibit) return;
  const board = exhibit.querySelector('.iris-board');
  const switches = [...exhibit.querySelectorAll('[data-iris-mode]')];
  const fields = [...exhibit.querySelectorAll('[data-iris-copy]')];
  const en = Object.fromEntries(fields.map(node => [node.dataset.irisCopy, node.textContent]));
  const messages = {
    en,
    cs: {
      foundry: 'UNDERGROUND ALCHEMY', series: 'STROJ Z PÍSMEN',
      lede: 'A se dívá. S se prohne. K otevře cestu.',
      body: 'Spusť pohon. Clona v A odjistí oba písty, páteř písmene S se napne a K se rozevře v kloubu. Stejným mechanismem nahoře otevřeš menu.',
      cycle: 'Animace', vector: 'Vektor', alpha: 'Průhledné', view: 'BIOMECHANICKÝ LETTERING', lens: 'CLONA V A', arms: 'KLOUB PÍSMENE K',
      position: 'Ovládání stroje', rest: 'V klidu', open: 'Spustit pohon', archive: 'PŮVODNÍ LETTERING'
    },
    fr: {
      foundry: 'UNDERGROUND ALCHEMY', series: 'LA MACHINE DE LETTRES',
      lede: 'Le A observe. Le S se déploie. Le K ouvre le passage.',
      body: 'Actionne le mécanisme. L’iris libère les deux pistons, la colonne du S se tend et le K pivote sur son axe. En haut du site, ce même mouvement ouvre le menu.',
      cycle: 'Animation', vector: 'Vectoriel', alpha: 'Transparent', view: 'LETTRES BIOMÉCANIQUES', lens: 'IRIS DU A', arms: 'ARTICULATION DU K',
      position: 'Actionner le mécanisme', rest: 'Au repos', open: 'Actionner', archive: 'LE LETTRAGE D’ORIGINE'
    }
  };
  function displayLanguage(lang) {
    const strings = messages[lang] || en;
    for (const node of fields) node.textContent = strings[node.dataset.irisCopy];
  }
  for (const button of switches) {
    button.addEventListener('click', () => {
      board.dataset.open = String(button.dataset.irisMode === 'open');
      for (const other of switches) other.setAttribute('aria-pressed', String(other === button));
    });
  }
  displayLanguage(window.CaisikI18n?.getLanguage() || document.documentElement.lang);
  window.addEventListener('caisik:languagechange', event => displayLanguage(event.detail?.language));
})();

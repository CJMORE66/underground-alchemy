// Metal-like pigments on the original wildstyle silhouettes. All output is
// clipped by the caller's accumulated paint masks, including the edge facets.
const finishes = [
  { flash: '#fff5c9', pearl: '#ffe296', gold: '#e8a234', ochre: '#9b4d22', rust: '#57301b', dark: '#201315' },
  { flash: '#fff9c5', pearl: '#ffe471', gold: '#e5a91e', ochre: '#a7611f', rust: '#613819', dark: '#231516' },
  { flash: '#fff0ca', pearl: '#ffd497', gold: '#d99042', ochre: '#9c4f32', rust: '#612d23', dark: '#25141a' },
  { flash: '#ffface', pearl: '#ffe992', gold: '#f0b42a', ochre: '#a75f24', rust: '#60381d', dark: '#211413' },
];

const round = value => Number(value.toFixed(2));

function stops(values) {
  return values.map(([offset, color, opacity = 1]) =>
    `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('');
}

export function writerFinishDefs(id, car) {
  const paint = `${id}-pigment-${car}`;
  const { flash, pearl, gold, ochre, rust, dark } = finishes[car];
  return `
    <linearGradient id="${paint}-face" x1="12%" y1="0%" x2="67%" y2="100%">
      ${stops([[0, flash], [.19, pearl], [.36, gold], [.48, ochre], [.502, flash], [.544, pearl], [.65, gold], [.77, ochre], [.9, rust], [1, gold]])}
    </linearGradient>
    <linearGradient id="${paint}-body" x1="15%" y1="0%" x2="77%" y2="100%">
      ${stops([[0, rust], [.38, ochre], [.6, dark], [.85, dark], [1, ochre]])}
    </linearGradient>
    <linearGradient id="${paint}-edge" x1="11%" y1="0%" x2="88%" y2="100%">
      ${stops([[0, flash], [.34, pearl, .92], [.58, gold, .33], [.76, ochre, .55], [1, dark, .87]])}
    </linearGradient>
    <linearGradient id="${paint}-sheen" x1="0%" y1="0%" x2="90%" y2="100%">
      ${stops([[0, flash, 0], [.28, flash, .52], [.57, pearl, .13], [.91, pearl, 0]])}
    </linearGradient>
    <radialGradient id="${paint}-star">
      ${stops([[0, flash, .94], [.22, flash, .42], [1, gold, 0]])}
    </radialGradient>`;
}

export function writerLetterFinish(id, car, shape, bounds, letterIndex) {
  const { x, y, width, height } = bounds;
  const paint = `${id}-pigment-${car}`;
  const clip = `${paint}-letter-${letterIndex}`;
  const { flash, pearl, gold, ochre, rust, dark } = finishes[car];
  const skew = ((car + letterIndex * 3) % 5) * .025;
  const position = (px, py) => `${round(x + width * px)} ${round(y + height * py)}`;
  const face = `d="${shape}" fill-rule="evenodd"`;
  // The offset steps follow the same path so enclosed counters stay open.
  return `
    <defs><clipPath id="${clip}"><path ${face} clip-rule="evenodd"/></clipPath></defs>
    <path ${face} transform="translate(9.2 11)" fill="${dark}" stroke="${dark}" stroke-width="1.2" stroke-linejoin="round"/>
    <path ${face} transform="translate(6.6 8.4)" fill="url(#${paint}-body)" stroke="${rust}" stroke-width="1.25"/>
    <path ${face} transform="translate(3.7 5.5)" fill="${ochre}" opacity=".9"/>
    <path ${face} fill="url(#${paint}-face)"/>
    <g clip-path="url(#${clip})">
      <path d="M${position(-.12,.34)} ${position(.3+skew,.015)} ${position(.94,.02)} ${position(.7,.21)} ${position(.29,.37)} ${position(.06,.6)}Z"
        fill="url(#${paint}-sheen)"/>
      <path d="M${position(.04,.88)} ${position(.36,.68)} ${position(.61,.67-skew)} ${position(1.03,.42)} ${position(.95,.58)} ${position(.64,.88)} ${position(.41,.99)}Z"
        fill="${rust}" opacity=".37"/>
      <path d="M${position(-.08,.55+skew)} ${position(.24,.43+skew)} ${position(.66,.30)} ${position(1.03,.12)}
               M${position(.21,.88)} ${position(.53,.73+skew)} ${position(.95,.58)}"
        fill="none" stroke="${pearl}" stroke-width="1.45" opacity=".37"/>
      <path ${face} fill="none" stroke="url(#${paint}-edge)" stroke-width="2.8" stroke-linejoin="round"/>
      <path ${face} fill="none" stroke="${flash}" stroke-width=".75" stroke-linejoin="round" opacity=".53"/>
      <path d="M${position(.11,.15+skew)} ${position(.31,.094)} ${position(.43,.067)}
               M${position(.59,.29-skew)} ${position(.72,.25-skew)}"
        fill="none" stroke="${flash}" stroke-width="1.65" stroke-linecap="round" opacity=".7"/>
      <path d="M${position(.24,.62)} ${position(.21,.66)}m3.4-5 .5-1.4
               M${position(.78,.75)} ${position(.75,.78)}m3-4 1-.7"
        fill="none" stroke="${dark}" stroke-width=".75" stroke-linecap="round" opacity=".36"/>
      <circle cx="${round(x + width * (.37 + skew))}" cy="${round(y + height * .21)}" r="1.3" fill="${pearl}" opacity=".53"/>
      <circle cx="${round(x + width * .31)}" cy="${round(y + height * .23)}" r=".7" fill="${flash}" opacity=".64"/>
    </g>`;
}

export function writerWordAccents(id, car, bounds) {
  const { x, y, width, height } = bounds;
  const { flash, pearl } = finishes[car];
  const paint = `${id}-pigment-${car}`;
  const glints = [[.14,.17,7], [.85,.18,9], [.28,.13,6], [.83,.26,7]];
  const [a, b, size] = glints[car];
  const gx = round(x + width * a), gy = round(y + height * b);
  return `<g transform="translate(${gx} ${gy})" data-writer-finish-accent="">
    <circle r="${size * 1.8}" fill="url(#${paint}-star)"/>
    <path d="M-${size} 0 ${size} 0M0 -${size * 1.4} 0 ${size * 1.4}" fill="none" stroke="${flash}" stroke-width="1" stroke-linecap="round" opacity=".85"/>
    <circle r="1.5" fill="${pearl}"/>
  </g>`;
}

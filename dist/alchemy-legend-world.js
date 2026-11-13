/* Original engraved plates for the house and its street. */
const SVG = 'http://www.w3.org/2000/svg';
let nextPlate = 0;

const clamp = value => Math.max(0, Math.min(1, value));
const fmt = value => value.toFixed(3);
function ease(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function rain(seed, count, size, width) {
  const strokes = Array.from({ length: count }, (_, index) => {
    const x = (index * 247 + seed * 111) % 2090 - 110;
    const y = (index * 171 + seed * 73) % 1160 - 60;
    const length = (index % 6 + 3) * size;
    return `M${x} ${y}l-${Math.round(length * .27)} ${length}`;
  }).join('');
  return `<g fill="none" stroke="#e0a45e" stroke-width="${width}" stroke-linecap="round">
    <path d="${strokes}"/><path d="${strokes}" transform="translate(313.2 -1160)"/>
  </g>`;
}

function masonry(x, y, columns, rows, width, height) {
  return Array.from({ length: rows }, (_, row) => {
    const top = y + row * height;
    const shift = (row % 2) * width * .45;
    const joints = Array.from({ length: columns }, (_, column) => {
      const left = x + column * width + shift;
      const notch = ((column * 3 + row * 7) % 11) - 5;
      return `M${left} ${top}l${notch} ${height - 2}`;
    });
    return `M${x} ${top}h${columns * width}${joints.join('')}`;
  }).join('');
}

function arch(x, y, w, h, id = '') {
  const inset = w * .14;
  const spring = w * .48;
  const mouth = `M0 ${h}V${spring}Q0 0 ${w / 2} 0T${w} ${spring}V${h}Z`;
  const inner = `M${inset} ${h - inset}V${spring}Q${inset} ${inset} ${w / 2} ${inset}T${w - inset} ${spring}V${h - inset}Z`;
  return `<g transform="translate(${x} ${y})">
    <path d="${mouth}" fill="#170e0b" stroke="#6b472b" stroke-width="2.8"/>
    <path d="${inner}" fill="#0a090b" stroke="#65492e" stroke-width="1.5"/>
    ${id ? `<g data-legend-lamp=""><path d="${inner}" fill="url(#${id}-glass)"/>
      <path d="M${w * .2} ${spring + 12}l${w * .22} -16v${h * .48}l-${w * .22} 8Z" fill="#c57532" opacity=".25"/>
      <path d="M${w * .54} ${spring + 15}q${w * .14} -10 ${w * .25} 6m-${w * .22} 20 ${w * .19} -10" fill="none" stroke="#fff6be" stroke-width="1.3" opacity=".45"/>
      <path d="M${w * .62} ${h - inset}v-${h * .26}l${w * .14} -12v${h * .39}Z" fill="#201009" opacity=".65"/>
      </g>` : ''}
    <path d="M${w / 2} ${inset}V${h}M${inset} ${spring + 8}h${w - 2 * inset}M${inset} ${h * .76}h${w - 2 * inset}" fill="none" stroke="#20140e" stroke-width="4"/>
    <path d="M-6 ${h}h${w + 12}v7H-6ZM-2 ${h + 11}h${w + 4}" fill="#372318" stroke="#6b472b" stroke-width="1.5"/>
    <path d="M-5 ${spring}Q-5 -6 ${w / 2} -6T${w + 5} ${spring}M${w / 2} -10v13" fill="none" stroke="#9f6c43" stroke-width="1.7" opacity=".65"/>
  </g>`;
}

function balcony(x, y, w) {
  const spokes = Array.from({ length: 9 }, (_, index) => {
    const offset = 9 + index * (w - 18) / 8;
    return `M${offset} 0q-8 8 0 15t0 14m0-29v30`;
  }).join('');
  return `<g transform="translate(${x} ${y})" fill="none" stroke="#95613b" stroke-width="1.4" opacity=".6">
    <path d="M0 0H${w}l-4 33H4ZM0 3H${w}M4 27h${w - 8}${spokes}"/>
    <path d="M4 33h${w - 8}v9H4Z" fill="#160f0b" stroke="#68462f" stroke-width="2"/>
  </g>`;
}

function cobbles() {
  const rows = [802, 822, 847, 877, 918, 968, 1022];
  const paving = rows.map((y, index) => {
    const dx = (y - 680) * .31;
    const joints = Array.from({ length: 25 }, (_, joint) => {
      const x = 1050 + (joint - 13 + (index % 2) * .47) * dx;
      return `M${Math.round(x)} ${y}l${Math.round((x - 1050) * .065)} ${Math.round(dx * .53)}`;
    }).join('');
    return `M0 ${y}Q930 ${y - 7} 1536 ${y + 2}${joints}`;
  }).join('');
  return `<path d="${paving}" fill="none" stroke="#95613b" stroke-width="1.2" opacity=".18"/>`;
}

function facade(id) {
  const windows = [272, 412, 566].map((y, floor) =>
    [786, 892, 1006, 1134, 1246].map((x, column) => {
      const width = column === 2 ? 91 : 61;
      const height = floor === 2 ? 123 : 93;
      const light = floor === 1 && column === 2;
      return arch(x, y, width, height, light ? id : '') +
        (floor === 2 ? balcony(x - 14, y + 78, width + 28) : '');
    }).join('')
  ).join('');
  return `<g data-legend-exterior="" opacity="0">
    <rect width="1536" height="1024" fill="url(#${id}-sky)"/>
    <ellipse cx="1045" cy="367" rx="645" ry="600" fill="url(#${id}-smog)"/>
    <path d="M0 240 67 209 125 221 135 180l66 12 62 61 49-8 19 64 62-13 68 41 31-32 57 51 55 27 25 89v328H0ZM1536 108l-60 51-20 51-68 23-72 130v425h220Z" fill="#100c10"/>
    <path d="M0 317 187 247l83 58 38 465L0 879Zm270 76 201-65 80 59 43 364-291 49Zm220 18 146-67 82 83 10 308-146 32Z" fill="#191215" stroke="#342523" stroke-width="2"/>
    <path d="M0 385 187 305l89 65M0 489l192-70 92 61M0 600l196-58 104 51M282 482l188-82 90 48m-271 89 184-63 89 50m-260 74 175-53 93 53M504 489l126-72 94 56m-206 70 119-47 91 45" fill="none" stroke="#775038" opacity=".23" stroke-width="3"/>
    <path d="m127 380 34-13 2 45-35 15Zm51-19 19-7v45l-18 7Zm177 136 19-6 3 28-19 8Zm65-22 24-11 2 29-24 9Zm133 10 18-10v26l-17 9Zm76 49 18-10 2 25-19 8Z" fill="#090709" stroke="#4b3429" stroke-width="1.4"/>
    <path d="m1384 251 152-81v657l-169-71Z" fill="#171014" stroke="#4b3027" stroke-width="2"/>
    <path d="M1380 348l156-65m-164 184 164-39m-168 167 168 2m-172 71 172 31" fill="none" stroke="#8a5836" stroke-width="3" opacity=".2"/>
    <path d="M697 234l109-99 43-2 35-39 260-8 57 40 61 3 87 110v525H719Z" fill="url(#${id}-stone)" stroke="#573c2c" stroke-width="4"/>
    <path d="M683 238l112-107 50 3 37-47 265-8 58 43 63 4 91 114-48 5H732Z" fill="#110c0e" stroke="#775338" stroke-width="3"/>
    <path d="M749 220 861 123l290-11 114 110M788 217l95-74 257-9 86 85M834 213l65-51 222-8 64 62M879 210l35-28 185-7 37 38M925 213l11-12 138-6 21 20" fill="none" stroke="#69452d" stroke-width="1.8" opacity=".6"/>
    <path d="m803 128 9-70 18-3 10 74Zm389-11-9-53 13-4 17 60Zm42 12-10-97 20-4 12 101Z" fill="#221613" stroke="#573a2b" stroke-width="2"/>
    <path d="M738 247h585m-586 6h589m-596 146h594m-592 8h590m-587 145h593m-591 9h587m-581 144h580m-579 10h584" fill="none" stroke="#926442" stroke-width="2" opacity=".55"/>
    <path d="${masonry(726, 261, 9, 22, 66, 20)}" fill="none" stroke="#8e6143" stroke-width="1" opacity=".18"/>
    <path d="M756 247v497m572-501v513M866 255v459m105-461v463m140-461v464m112-469v489" fill="none" stroke="#170e0c" stroke-width="6" opacity=".7"/>
    <path d="M755 248v499m572-502v513M868 255v459m104-461v463m141-461v464m112-469v489" fill="none" stroke="#9a6d49" stroke-width="1.5" opacity=".4"/>
    <path d="M977 405 994 391l9-9 45-15 48 15 12 14 14 9Z" fill="#332018" stroke="#77543b" stroke-width="2.5"/>
    <path d="M993 400q55-31 108 0m-52-25-12 13 12 9 13-10Z" fill="none" stroke="#b37c48" stroke-width="1.4" opacity=".5"/>
    ${windows}
    <ellipse data-legend-window-aura="" cx="1052" cy="467" rx="156" ry="158" fill="url(#${id}-aura)" opacity=".19"/>
    ${arch(995, 700, 114, 75)}
    <g data-legend-graffiti="" opacity="0">
      <g clip-path="url(#${id}-stencil)">
        <g transform="translate(794 537) rotate(-2)" fill="#e3aa51">
          <path d="M-12 2 199-8m-174 31 169-6m-191-4 203-10M-11 4l14-11m183 4 12-8" fill="none" stroke="#ad6831" stroke-width="1.1" opacity=".75"/>
          <text font-family="Barlow Condensed, sans-serif" font-size="29" font-weight="900" letter-spacing="2">TRANSMUTE</text>
          <text y="21" font-family="Barlow Condensed, sans-serif" font-size="14" font-weight="800" letter-spacing="1">AS WITHIN SO WITHOUT</text>
          <path d="m179-21 14 15h-26Z" fill="none" stroke="#e3aa51" stroke-width="1.9"/>
        </g>
      </g>
    </g>
    <g data-legend-apprentice="" opacity="0">
      <path d="M850 706q40-18 79 1l-30 7-53 1Z" fill="#090608" opacity=".7"/>
      <path d="M863 625l18-26 27 4 10 24-11 34 10 40-17 5-11-38-12 36-18-4 14-44Z" fill="#0e0a0b" stroke="#83502e" stroke-width="2.3"/>
      <path d="M869 603q-12-28 14-45 21 9 22 24l-8 22-15 7Z" fill="#0a0809" stroke="#a56837" stroke-width="2.5"/>
      <path d="m875 596 7-22 13 8-3 13Z" fill="#49301f" opacity=".65"/>
      <g data-legend-spray-arm="">
      <path d="M887 617q15-15 26-31l18-26 11 5-19 39-28 24Z" fill="#100b0c" stroke="#996136" stroke-width="2.5"/>
      <path d="M928 566l4-14 9 3-3 14Z" fill="#ad733c" stroke="#2a1712" stroke-width="1.5"/>
      <path data-legend-spray="" d="M933 549q7-25 40-27m-32 18 35-10m-27 15 19-4m-27-6 16-10" fill="none" stroke="#ffbc52" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    </g>
    <path d="M0 875 317 803 684 761 930 759l53 16h125l52-18 376 61v206H0Z" fill="url(#${id}-ground)"/>
    <path d="M0 885 321 816 682 772l256-6m189 0 194 24 215 41" fill="none" stroke="#9c633c" stroke-width="3" opacity=".34"/>
    ${cobbles()}
    <g data-legend-puddle="">
      <path d="M1026 777q24-7 50 0l-14 9 36 10-24 6 47 21-42 2 60 20-35 11 65 26-69 3 91 34-42 10 63 20-168 3 39-17-115 9 52-31-61 8 48-25-47-2 52-29-18-5 50-22-30-4Z" fill="url(#${id}-spill)" opacity=".58"/>
      <path d="M1002 785h83m-124 50h60m30 7h67m-108 44h103m-146 24h105m-18 18h98m-186 17h66" fill="none" stroke="#edaa53" stroke-width="2.6" opacity=".35"/>
    </g>
    <rect width="1536" height="1024" fill="url(#${id}-vignette)"/>
    <g data-legend-rain-back="">${rain(2, 101, 7, 1.2)}</g>
    <g data-legend-rain-front="">${rain(3, 47, 11, 1.8)}</g>
  </g>`;
}

function streetPlate(id) {
  const lamps = [
    [538, 542, 197], [735, 593, 161], [854, 634, 130], [1178, 597, 190], [1333, 493, 292],
  ].map(([x, y, h]) => `<g transform="translate(${x} ${y})">
    <ellipse rx="79" ry="101" fill="url(#${id}-aura)" opacity=".65"/>
    <path d="M18 ${h}V24q0-25-14-24h-18M10 ${h}h15" fill="none" stroke="#4c3026" stroke-width="5"/>
    <path d="M-22-5h18l-4 17h-10Zm0-1 9-8 9 8" fill="#ffd578" stroke="#9b582a" stroke-width="2"/>
    <path d="M-20 15h14" stroke="#f3ae49" stroke-width="2"/>
  </g>`).join('');
  const windows = Array.from({ length: 11 }, (_, index) => {
    const x = 68 + 72 * index;
    const y = 344 + 31 * index;
    const w = 39 - 1.9 * index;
    const h = 74 - 4 * index;
    return `<path d="M${x} ${y}l${w} 9v${h}l-${w} -7Zm${w / 2} 5v${h}m-${w / 2} -${h * .57}l${w} 8" fill="#0d0a0c" stroke="#8a5537" stroke-width="1.3" opacity="${index % 3 ? '.46' : '.67'}"/>`;
  }).join('');
  return `<g data-legend-street="" opacity="0">
    <rect width="1536" height="1024" fill="url(#${id}-street-sky)"/>
    <ellipse cx="1036" cy="550" rx="349" ry="388" fill="url(#${id}-smog)" opacity=".82"/>
    <path d="M704 643v-72l51-13 46 19 55-33 28 13 16-30 37 1 26 24 18 1v-44l18-20 17 9 17-45 15 43 21-6 16 16v49l28-27 28 5 40 63v166H700Z" fill="#25161a" stroke="#784931" stroke-width="2"/>
    <path d="M1025 485V463m-17 75v53m45-51v45m-74-5v29m101-26v43" fill="none" stroke="#c47f3a" stroke-width="2" opacity=".49"/>
    <path d="M0 269l239 50 173 69 133 44 114 58 128 65 135 100v150L0 907Z" fill="url(#${id}-left-street)" stroke="#493123" stroke-width="3"/>
    <path d="M1536 196l-197 144-79 75-81 87-72 113v188l429 128Z" fill="url(#${id}-right-street)" stroke="#523329" stroke-width="3"/>
    <path d="M0 399 367 451 580 519 789 603 927 669M0 517l347 28 236 68 219 74 125 40m609-404-247 136-143 91-32 58m422-68-234 45-132 53-48 45" fill="none" stroke="#a06e41" stroke-width="2.4" opacity=".24"/>
    <path d="M0 628l355 17 240 53 321 83m-916-60 341-6 253 48 299 55m643-153-281 53-139 45m420-7-262 46-145 37" fill="none" stroke="#c38247" stroke-width="2.3" opacity=".37"/>
    <path d="M114 379v339m135-313 11 301m131-267 6 294m125-254 8 282m139-219 2 252m101-208 3 224m627-443-16 343m-82-278-11 305m-83-249-5 273m-60-218-6 239" fill="none" stroke="#976744" stroke-width="2.5" opacity=".25"/>
    ${windows}
    <path d="M1490 308l24-17v119l-24 14Zm-65 61 20-12v84l-20 11Zm-62 53 18-13v73l-18 9Zm-55 50 14-11v65l-14 5Zm-56 51 11-12v51l-11 3Zm-46 53 8-9v41l-8 3Z" fill="#0d0a0c" stroke="#8a5537" stroke-width="1.4" opacity=".64"/>
    <path d="M1279 736v-91q48-84 123-91l9 159m-116 16V651q37-65 91-73v138m-78 7v-72q30-53 64-55v118" fill="none" stroke="#74462f" stroke-width="3"/>
    <path d="M1295 725V651q37-65 91-73v138Z" fill="#100c0e" stroke="#9d5b31" stroke-width="2.4"/>
    <path d="M1327 713v-65q14-23 31-30v85Zm-26 18 90-13m-87 19 97-11m-94 16 104-12" fill="none" stroke="#a06439" stroke-width="2"/>
    <path d="M710 759v-73q23-39 66 2v94m-56-23v-67q21-26 44 1v78m21 10v-61q13-17 27 8v61" fill="#100c0e" stroke="#74462f" stroke-width="2.4"/>
    <path d="M0 907 368 867l314-36 209-39 139-81 102 62 404 119v132H0Z" fill="url(#${id}-ground)"/>
    <path d="m0 925 395-54 307-38 190-31 137-83m507 194-266-77-127-52-114-65m-656 305 635-290m315 290-265-285" fill="none" stroke="#b97a45" stroke-width="3" opacity=".33"/>
    ${cobbles()}
    <ellipse cx="1065" cy="886" rx="345" ry="139" fill="url(#${id}-ground-aura)" opacity=".69"/>
    <path d="M902 845h67m90-54h26m132 65h98m-358 29h64m96 10h86m-308 50h119m22 30h194m-526 21h129" fill="none" stroke="#d2813a" stroke-width="2" opacity=".3"/>
    ${lamps}
    <path d="M593 818q117-28 142-29m-282 54 90-18m771 7 130 33" fill="none" stroke="#efbd67" stroke-width="1.2" opacity=".27"/>
    <path d="M122 747q153-74 290-18m-261 21q95-32 140-23m1017 14 61-17m-64 25 107-24" fill="none" stroke="#ab5f35" stroke-width="1.4" opacity=".38"/>
    <rect width="1536" height="1024" fill="url(#${id}-vignette)" opacity=".68"/>
  </g>`;
}

const cable = 'M1051 784c-19 26-58 33-35 52s111 11 153 39l84 45q61 22 162 11';
const cableLength = 492;

function art(id) {
  return `<defs>
    <clipPath id="${id}-stencil"><rect data-legend-stencil="" x="774" y="502" width="0" height="65"/></clipPath>
    <linearGradient id="${id}-sky" x2="0" y2="1">
      <stop stop-color="#08070b"/><stop offset=".58" stop-color="#1b1118"/><stop offset="1" stop-color="#3d221b"/>
    </linearGradient>
    <linearGradient id="${id}-street-sky" x2="0" y2="1">
      <stop stop-color="#10080d"/><stop offset=".6" stop-color="#34191b"/><stop offset="1" stop-color="#6f3720"/>
    </linearGradient>
    <linearGradient id="${id}-stone" x2=".94" y2=".82">
      <stop stop-color="#190f11"/><stop offset=".42" stop-color="#37251e"/><stop offset=".63" stop-color="#281b19"/><stop offset="1" stop-color="#1b1112"/>
    </linearGradient>
    <linearGradient id="${id}-glass" x2=".74" y2="1">
      <stop stop-color="#ffdb81"/><stop offset=".38" stop-color="#efac47"/><stop offset=".75" stop-color="#c97431"/><stop offset="1" stop-color="#6f351f"/>
    </linearGradient>
    <linearGradient id="${id}-ground" x2="0" y2="1">
      <stop stop-color="#302018"/><stop offset=".61" stop-color="#170e0e"/><stop offset="1" stop-color="#0b080b"/>
    </linearGradient>
    <linearGradient id="${id}-left-street" x2="1" y2=".65">
      <stop stop-color="#100b11"/><stop offset=".58" stop-color="#26161a"/><stop offset="1" stop-color="#3b201e"/>
    </linearGradient>
    <linearGradient id="${id}-right-street" x2="1" y2=".85">
      <stop stop-color="#38201c"/><stop offset=".48" stop-color="#221417"/><stop offset="1" stop-color="#100a0f"/>
    </linearGradient>
    <linearGradient id="${id}-spill" x2="0" y2="1">
      <stop stop-color="#fabb57" stop-opacity=".58"/><stop offset=".55" stop-color="#e48742" stop-opacity=".28"/><stop offset="1" stop-color="#a84c28" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-smog">
      <stop stop-color="#774023" stop-opacity=".68"/><stop offset=".46" stop-color="#4a2622" stop-opacity=".37"/><stop offset="1" stop-color="#230f16" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-aura">
      <stop stop-color="#ffbd5b" stop-opacity=".64"/><stop offset=".38" stop-color="#e88430" stop-opacity=".24"/><stop offset="1" stop-color="#bb461b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-ground-aura">
      <stop stop-color="#db8a41" stop-opacity=".5"/><stop offset=".53" stop-color="#ab4d26" stop-opacity=".19"/><stop offset="1" stop-color="#5b171a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-vignette" cx=".67" cy=".51" r=".63">
      <stop offset=".34" stop-color="#0a0708" stop-opacity="0"/><stop offset=".78" stop-color="#0a0708" stop-opacity=".47"/><stop offset="1" stop-color="#080609" stop-opacity=".91"/>
    </radialGradient>
  </defs>
  ${facade(id)}
  ${streetPlate(id)}
  <g data-legend-route="" opacity="0">
    <g data-legend-route-ink="" stroke-dasharray="${cableLength} ${cableLength}" stroke-dashoffset="${cableLength}" stroke-linecap="round">
      <path d="${cable}" fill="none" stroke="#ee8c2f" stroke-width="17" opacity=".13"/>
      <path d="${cable}" fill="none" stroke="#ffe498" stroke-width="3.6"/>
    </g>
    <g data-legend-route-end="" opacity="0" transform="translate(1415 931)">
      <circle r="8" fill="#0c0809" stroke="#ffda79" stroke-width="1.6"/><circle r="2" fill="#fff1ad"/>
      <path d="M-16 0h6M10 0h6M0-15v5m0 20v5" stroke="#ffb64c" stroke-width="1.4"/>
    </g>
  </g>`;
}

/** Stage coordinates stay aligned with the throne plate and actor. */
export function createLegendWorld(document) {
  const parser = new document.defaultView.DOMParser();
  const markup = `<svg xmlns="${SVG}" viewBox="0 0 1536 1024">${art(`legend-world-${++nextPlate}`)}</svg>`;
  const element = document.importNode(parser.parseFromString(markup, 'image/svg+xml').documentElement, true);
  element.setAttribute('class', 'alchemy-legend-world');
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('focusable', 'false');

  const find = part => element.querySelector(`[data-legend-${part}]`);
  const exteriorLayer = find('exterior');
  const streetLayer = find('street');
  const routeLayer = find('route');
  const routeInk = find('route-ink');
  const routeEnd = find('route-end');
  const lamp = find('lamp');
  const apprentice = find('apprentice');
  const graffiti = find('graffiti');
  const stencil = find('stencil');
  const spray = find('spray');
  const sprayArm = find('spray-arm');
  const aura = find('window-aura');
  const puddle = find('puddle');
  const rainBack = find('rain-back');
  const rainFront = find('rain-front');
  const cached = new WeakMap();
  function opacity(node, value) {
    const next = fmt(clamp(value));
    if (cached.get(node) === next) return;
    cached.set(node, next);
    node.setAttribute('opacity', next);
  }

  function render({ exterior = 0, street = 0, route = 0, progress = 0, time = 0 } = {}) {
    opacity(exteriorLayer, exterior);
    opacity(streetLayer, street);
    opacity(routeLayer, route * 2.8);
    if (route > 0) {
      routeInk.setAttribute('stroke-dashoffset', fmt((1 - clamp(route)) * cableLength));
      opacity(routeEnd, (route - .83) * 5.88);
    }
    if (exterior <= 0) return;

    const paint = ease(.038, .069, progress);
    opacity(apprentice, ease(.027, .041, progress) * (1 - ease(.059, .083, progress)));
    opacity(graffiti, paint * (1 - ease(.082, .104, progress)));
    opacity(spray, Math.sin(paint * Math.PI) * .92);
    if (progress > .027 && progress < .104) {
      const turn = 8 - paint * 25 + Math.sin(paint * Math.PI * 4) * 3;
      stencil.setAttribute('width', fmt(paint * 239));
      sprayArm.setAttribute('transform', `rotate(${fmt(turn)} 887 619)`);
    }

    const gust = .5 + .5 * Math.sin(time * 1.1 + Math.sin(time * .37));
    const flicker = .5 + .5 * Math.sin(time * 2.4 + .45 * Math.sin(time * 5.2));
    const pulse = .59 + .24 * gust + .08 * flicker + .15 * clamp(progress * 6);
    opacity(lamp, pulse);
    opacity(aura, pulse * .62);
    opacity(puddle, .35 + pulse * .46);
    opacity(rainBack, .12 + gust * .11);
    opacity(rainFront, .1 + gust * .09);
    const backFall = (time * 384) % 1160;
    const frontFall = (time * 710) % 1160;
    rainBack.setAttribute('transform', `translate(${fmt(gust * 21 - backFall * .27)} ${fmt(backFall)})`);
    rainFront.setAttribute('transform', `translate(${fmt(gust * 33 - frontFall * .27)} ${fmt(frontFall)})`);
  }

  return { element, render };
}

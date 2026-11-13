// The air is derived from the same nozzle contact and pressure as the paint.
// No random draws or wall clock: seeking backward redraws the identical plume.
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const number = value => Number(value.toFixed(2));
const fract = value => value - Math.floor(value);
const hash = seed => fract(Math.sin(seed * 147.731 + 11.54) * 39751.821);
const drops = Array.from({ length: 50 }, (_, index) => ({
  offset: hash(index * 7 + 1),
  speed: .8 + hash(index * 7 + 2) * .4,
  spread: hash(index * 7 + 3) * 2 - 1,
  size: .24 + hash(index * 7 + 4) ** 2 * 1.25,
  phase: hash(index * 7 + 5) * Math.PI * 2,
  density: .18 + hash(index * 7 + 6) * .5,
}));
const banks = [.12, .25, .40, .57, .73, .87, .96];
const pigmentByPhase = { fill: '#ffcb61', flare: '#ffdd82', outline: '#402c28' };
const lead = .0025;

export function sprayPlumeMarkup(id) {
  return `<g data-finale="spray" id="${id}-aerosol" opacity="0" pointer-events="none">
    <defs>
      <radialGradient id="${id}-air-pigment">
        <stop stop-color="currentColor" stop-opacity=".55"/>
        <stop offset=".35" stop-color="currentColor" stop-opacity=".26"/>
        <stop offset=".72" stop-color="currentColor" stop-opacity=".09"/>
        <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}-air-light">
        <stop stop-color="#fff0be" stop-opacity=".41"/>
        <stop offset=".52" stop-color="#ffe0a1" stop-opacity=".13"/>
        <stop offset="1" stop-color="#ffe0a1" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id}-air-core">
        <stop stop-color="#fff0bd" stop-opacity=".59"/>
        <stop offset=".40" stop-color="currentColor" stop-opacity=".36"/>
        <stop offset=".85" stop-color="currentColor" stop-opacity=".12"/>
        <stop offset="1" stop-color="currentColor" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g data-spray-flight="">
      <path data-spray-core="" fill="url(#${id}-air-core)"/>
      <g data-spray-cloud="" fill="url(#${id}-air-pigment)">
        ${banks.map(() => '<ellipse/>').join('')}
      </g>
      <ellipse data-spray-wall-haze="" fill="url(#${id}-air-pigment)"/>
      <ellipse data-spray-rim="" fill="url(#${id}-air-light)"/>
      <g data-spray-drops="">
        ${drops.map((drop, i) => `<circle r="${number(drop.size)}" fill="${i % 5 ? 'currentColor' : '#ffe7a6'}"/>`).join('')}
      </g>
    </g>
  </g>`;
}

export function createSprayPlume(element) {
  const root = element.matches('[data-finale="spray"]') ? element : element.querySelector('[data-finale="spray"]');
  const part = name => root.querySelector(`[data-spray-${name}]`);
  const flight = part('flight');
  const core = part('core');
  const cloud = [...part('cloud').children];
  const wall = part('wall-haze');
  const rim = part('rim');
  const particles = [...part('drops').children];
  const set = (node, name, value) => node.setAttribute(name, typeof value === 'number' ? number(value) : value);
  let shown = false;

  function ellipse(node, x, y, rx, ry, opacity) {
    set(node, 'cx', x);
    set(node, 'cy', y);
    set(node, 'rx', rx);
    set(node, 'ry', ry);
    set(node, 'opacity', opacity);
  }

  return ({ p = 0, action, nozzle, sampleAction } = {}) => {
    const pressure = clamp(action?.spray || 0);
    const before = sampleAction?.(Math.max(0, p - lead));
    const trail = clamp(before?.spray || 0);
    const strength = Math.max(pressure, trail * .45);
    if (!nozzle || !action?.contact || strength < .015) {
      if (shown) {
        set(root, 'opacity', 0);
        set(root, 'data-spray-state', 'idle');
        shown = false;
      }
      return;
    }

    const emitting = pressure >= .015;
    const source = emitting ? action : before;
    const [impactX, impactY] = source.contact;
    // On release, let the last particles finish their flight to their own point.
    const [tipX, tipY] = emitting ? nozzle : [
      nozzle[0] + impactX - action.contact[0], nozzle[1] + impactY - action.contact[1],
    ];
    const dx = impactX - tipX, dy = impactY - tipY;
    const distance = Math.hypot(dx, dy);
    if (distance < .5) {
      set(root, 'opacity', 0);
      set(root, 'data-spray-state', 'idle');
      shown = false;
      return;
    }
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const outline = source.phase === 'outline';
    const fan = clamp(source.fan || 0);
    const halfWidth = clamp(
      source.radius ?? (outline ? 1.8 + distance * .075 : 5 + distance * (.16 + fan * .52)),
      1.4, 74,
    );
    const envelope = distance * (emitting ? clamp(.45 + trail * .55 + pressure * .50, .45, 1) : 1);
    const floor = emitting ? 0 : distance * .56;
    const opacity = clamp(strength * (outline ? .93 : .91) + .055);
    set(root, 'opacity', opacity);
    set(root, 'data-spray-state', emitting ? 'press' : 'release');
    set(root, 'color', source.paintColor || source.color || pigmentByPhase[source.phase] || '#f3b44e');
    set(flight, 'transform', `translate(${number(tipX)} ${number(tipY)}) rotate(${number(angle)})`);
    shown = true;

    const throat = halfWidth * .33;
    set(core, 'd', `M0 0Q${number(envelope * .28)} ${number(-throat * .14)} ${number(envelope)} ${number(-throat)}
      Q${number(envelope * .67)} ${number(throat * .76)} 0 0Z`);
    set(core, 'opacity', emitting ? pressure * (outline ? .76 : .93) : 0);
    cloud.forEach((node, index) => {
      const u = banks[index], x = floor + (envelope - floor) * u;
      const width = Math.max(.65, halfWidth * (x / distance) ** .88);
      const turbulence = Math.sin(p * 1930 + index * 1.78) * width * .12;
      const available = Math.max(.2, Math.min(distance - x + 2, distance * (.15 + u * .1)));
      ellipse(node, x, turbulence, available, width * (.61 + u * .33), .43 + u * .38);
    });
    const contact = clamp((envelope / distance - .83) * 6);
    ellipse(wall, distance - Math.min(3, distance * .08), 0, Math.max(.9, distance * .11), halfWidth * 1.08, contact * .67);
    ellipse(rim, envelope * .68, -halfWidth * .19, Math.max(.75, envelope * .30), Math.max(.65, halfWidth * .43), outline ? .81 : .62);

    particles.forEach((node, index) => {
      const drop = drops[index];
      const u = fract(p * 235 * drop.speed + drop.offset);
      const x = floor + (envelope - floor) * u;
      const cross = halfWidth * (x / distance) ** .91;
      const drift = Math.sin(drop.phase + p * 870 + u * 4) * cross * .16;
      const y = drop.spread * cross + drift;
      // A speck fades as it lands. The accumulated paint belongs to the surface.
      const age = clamp(u * 11) * clamp((1 - u) * 14);
      const light = index % 5 ? 1 : 1.22;
      set(node, 'cx', x);
      set(node, 'cy', y);
      set(node, 'opacity', age * drop.density * light * (outline ? .62 : .89));
    });
  };
}

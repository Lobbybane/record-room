// The people in each room: a casual group that fits the theme, all watching the TV on the
// left wall. Everyone is drawn from a short description (pose, outfit, extras, what they're
// holding) by the little SVG builders below, so a group is just data in js/groups.js.
// CSS reacts to the stage: heads bob while music plays, dozers nod off when it stops,
// the studier swaps to a book or tea with the study timer, and holiday hats show by data-hat.

import { GROUPS } from './groups.js';

const SKIN = ['#F6D6C2', '#E8B896', '#C98E67', '#9C6646', '#6E4430'];

// The listener's old hats, mirrored to face left and shrunk onto these smaller heads.
// Only the one matching data-hat shows (see .hat in css/style.css).
const HOLIDAY_HATS = "<g class=\"hat hat-santa\"> <path d=\"M660 556 Q668 522 650 504 Q690 508 711 550 Z\" fill=\"#E04848\"/> <rect x=\"655\" y=\"545\" width=\"60\" height=\"12\" rx=\"6\" fill=\"#F4F4FA\" transform=\"rotate(-6 685 551)\"/><circle cx=\"650\" cy=\"504\" r=\"6.5\" fill=\"#F4F4FA\"/> </g><g class=\"hat hat-witch\"> <path d=\"M665 546 Q676 520 680 500 Q684 490 696 488 Q688 500 690 514 Q693 530 706 543 Z\" fill=\"#2A2040\"/> <path d=\"M666 541 Q686 536 705 538 L706 545 Q686 542 665 547 Z\" fill=\"#B79CFF\"/> <ellipse cx=\"686\" cy=\"547\" rx=\"38\" ry=\"7\" fill=\"#2A2040\" transform=\"rotate(-6 686 547)\"/> </g><g class=\"hat hat-party\"> <path d=\"M668 549 L688 504 L707 545 Z\" class=\"hat-a\"/> <path d=\"M674 536 L700 530 M679 524 L697 520 M684 513 L692 511\" class=\"hat-b-stroke\" stroke-width=\"3\"/> <circle cx=\"688\" cy=\"503\" r=\"5\" class=\"hat-b\"/> </g><g class=\"hat hat-leprechaun\"> <rect x=\"667\" y=\"512\" width=\"36\" height=\"34\" rx=\"2\" fill=\"#3EAE6E\" transform=\"rotate(-6 685 546)\"/> <rect x=\"667\" y=\"536\" width=\"36\" height=\"7\" fill=\"#15132B\" transform=\"rotate(-6 685 546)\"/> <rect x=\"680\" y=\"534\" width=\"10\" height=\"10\" fill=\"none\" stroke=\"#FFD38A\" stroke-width=\"2\" transform=\"rotate(-6 685 546)\"/> <ellipse cx=\"685\" cy=\"548\" rx=\"31\" ry=\"6\" fill=\"#2E8E5A\" transform=\"rotate(-6 685 548)\"/> </g><g class=\"hat hat-bunny\"> <ellipse cx=\"672\" cy=\"520\" rx=\"7\" ry=\"22\" fill=\"#F4F0FF\" transform=\"rotate(-16 672 540)\"/><ellipse cx=\"672\" cy=\"522\" rx=\"3.5\" ry=\"15\" fill=\"#F7A9C8\" transform=\"rotate(-16 672 540)\"/> <ellipse cx=\"696\" cy=\"516\" rx=\"7\" ry=\"22\" fill=\"#F4F0FF\" transform=\"rotate(12 696 538)\"/><ellipse cx=\"696\" cy=\"518\" rx=\"3.5\" ry=\"15\" fill=\"#F7A9C8\" transform=\"rotate(12 696 538)\"/> <path d=\"M660 558 Q684 534 708 554\" fill=\"none\" stroke=\"#F4F0FF\" stroke-width=\"3\"/> </g><g class=\"hat hat-hearts\"> <path d=\"M660 558 Q684 534 708 554\" fill=\"none\" stroke=\"#FF5A7A\" stroke-width=\"3\"/> <path d=\"M672 544 Q668 530 670 520 M696 542 Q700 528 698 516\" fill=\"none\" stroke=\"#FF5A7A\" stroke-width=\"1.5\"/> <path d=\"M670 520 c-3-5-11-3-9 3 l9 8 9-8 c2-6-6-8-9-3z M698 516 c-3-5-11-3-9 3 l9 8 9-8 c2-6-6-8-9-3z\" fill=\"#FF5A7A\"/> </g><g class=\"hat hat-beanie\"> <path d=\"M659 560 Q658 530 684 527 Q710 527 711 556 Z\" class=\"hat-a\"/> <path d=\"M658 556 Q684 546 712 552 L712 562 Q684 556 658 566 Z\" class=\"hat-b\"/> <circle cx=\"684\" cy=\"526\" r=\"6.5\" class=\"hat-b\"/> </g><g class=\"hat hat-flower\"> <g fill=\"#FF9A3C\"><circle cx=\"664\" cy=\"560\" r=\"5\"/><circle cx=\"672\" cy=\"556\" r=\"5\"/><circle cx=\"672\" cy=\"566\" r=\"5\"/><circle cx=\"664\" cy=\"570\" r=\"5\"/><circle cx=\"658\" cy=\"565\" r=\"5\"/></g> <circle cx=\"666\" cy=\"563\" r=\"3.5\" fill=\"#FFD34A\"/> </g>";
const holidayHats = () => `<g class="holiday-hats" transform="translate(-2 -64) scale(-.52 .52) translate(-684 -572)">${HOLIDAY_HATS}</g>`;

// Mix a colour toward black (amount < 0) or white (amount > 0).
function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* ---------- body parts (local units: hip at 0,0, facing left, head about 64 up) ---------- */

function legs(pose, color, shoe = '#F4ECFF') {
  const far = tint(color, -0.25);
  if (pose === 'floor') {
    return `<ellipse cx="-14" cy="4" rx="27" ry="9" fill="${far}"/>
      <path d="M-42 8 Q-18 18 8 8" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"/>
      <ellipse cx="-46" cy="8" rx="7" ry="5" fill="${shoe}"/>`;
  }
  if (pose === 'stand') {
    return `<path d="M-6 -2 L6 -2 L5 58 L-6 58 Z" fill="${far}"/><path d="M-14 -2 L0 -2 L-2 58 L-14 58 Z" fill="${color}"/>
      <path d="M-24 56 L-2 56 Q0 64 -6 64 L-24 64 Q-27 60 -24 56 Z" fill="${shoe}"/><path d="M-12 57 L6 57 Q8 64 2 64 L-14 64 Z" fill="${tint(shoe, -0.15)}"/>`;
  }
  if (pose === 'recline') {
    return `<path d="M6 -2 L-36 6 L-34 18 L8 12 Z" fill="${far}"/><path d="M2 -4 L-40 2 L-38 14 L4 10 Z" fill="${color}"/>
      <path d="M-40 2 L-66 22 L-58 30 L-34 12 Z" fill="${color}"/><path d="M-72 22 L-56 28 Q-56 36 -62 36 L-76 30 Q-78 25 -72 22 Z" fill="${shoe}"/>`;
  }
  // sitting on a seat, feet on the floor
  return `<path d="M8 -9 L-36 -9 Q-44 -9 -44 -1 Q-44 7 -36 7 L8 7 Z" fill="${far}" transform="translate(5 -3)"/>
    <path d="M6 -6 L-38 -6 Q-46 -6 -46 2 Q-46 10 -38 10 L6 10 Z" fill="${color}"/>
    <path d="M-48 0 L-36 0 L-37 40 L-49 40 Z" fill="${color}"/>
    <path d="M-58 38 L-37 38 Q-35 46 -41 47 L-60 47 Q-62 42 -58 38 Z" fill="${shoe}"/>`;
}

function torso(style, color, extra = {}) {
  const shade = tint(color, -0.22);
  const base = 'M-13 0 Q-17 -24 -9 -42 Q1 -50 13 -44 Q17 -22 15 0 Z';
  let out = `<path d="${base}" fill="${color}"/>`;
  if (style === 'puffer') {
    out = `<path d="M-16 2 Q-21 -24 -11 -44 Q1 -53 15 -46 Q20 -22 18 2 Z" fill="${color}"/>
      <path d="M-18 -10 Q0 -6 18 -10 M-18 -22 Q0 -18 18 -22 M-14 -34 Q0 -30 16 -34" fill="none" stroke="${shade}" stroke-width="2"/>
      <path d="M-2 -48 Q8 -54 16 -46 L14 -40 Q6 -46 -2 -42 Z" fill="${shade}"/>`;
  } else if (style === 'hoodie') {
    out += `<path d="M2 -46 Q14 -58 18 -42 Q10 -38 2 -46 Z" fill="${shade}"/>
      <path d="M-6 -44 L-7 -30 M-1 -45 L-1 -32" stroke="${shade}" stroke-width="1.6" stroke-linecap="round"/>`;
  } else if (style === 'sweater') {
    out += `<rect x="-8" y="-50" width="16" height="9" rx="4" fill="${shade}"/>
      <path d="M-10 -24 l5 5 5 -5 5 5 5 -5" fill="none" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="1.6"/>`;
  } else if (style === 'flannel') {
    out += `<g stroke="${shade}" stroke-width="2.4" opacity=".8"><path d="M-12 -12 H16 M-14 -28 H15 M-4 -46 V0 M7 -46 V0"/></g>
      <path d="M-8 -46 L-2 -38 L3 -46" fill="none" stroke="${tint(color, 0.4)}" stroke-width="2"/>`;
  } else if (style === 'apron') {
    out += `<path d="M-14 -30 Q-12 -14 -14 2 L4 2 Q4 -14 2 -30 Z" fill="${extra.apron || '#F4ECFF'}"/>
      <path d="M-12 -30 Q-4 -40 2 -30" fill="none" stroke="${extra.apron || '#F4ECFF'}" stroke-width="2"/>`;
  } else if (style === 'sundress') {
    out += `<path d="M-6 -46 L-4 -36 M6 -46 L4 -36" stroke="${tint(color, 0.35)}" stroke-width="2"/>
      <g fill="#FFFFFF" opacity=".35"><circle cx="-6" cy="-24" r="2"/><circle cx="6" cy="-14" r="2"/><circle cx="-2" cy="-8" r="2"/><circle cx="8" cy="-32" r="2"/></g>`;
  } else if (style === 'overalls') {
    out += `<path d="M-14 -24 L10 -24 L13 2 L-14 2 Z" fill="${extra.bib || '#4F6FA8'}"/>
      <path d="M-8 -24 L-4 -44 M8 -24 L9 -44" stroke="${extra.bib || '#4F6FA8'}" stroke-width="3"/>
      <circle cx="-6" cy="-24" r="1.6" fill="#F2B33D"/><circle cx="7" cy="-24" r="1.6" fill="#F2B33D"/>`;
  } else if (style === 'uniform') {
    out += `<path d="M-2 -46 L-6 0" stroke="${shade}" stroke-width="2"/>
      <g fill="#E0C068"><circle cx="-8" cy="-34" r="1.6"/><circle cx="-9" cy="-24" r="1.6"/><circle cx="-10" cy="-14" r="1.6"/></g>`;
  }
  return out;
}

// Skirt over the thighs for dresses (drawn after the legs).
const skirt = (style, color, pose) => (style === 'sundress' && pose !== 'stand'
  ? `<path d="M-16 -4 Q-30 0 -44 8 Q-20 16 10 10 L12 -2 Z" fill="${color}"/>`
  : style === 'sundress' ? `<path d="M-16 -4 L-22 26 L14 26 L12 -4 Z" fill="${color}"/>` : '');

function hair(style, color) {
  const hi = '<path d="M-14 -70 Q-8 -78 2 -78" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>';
  const back = {
    long: `<path d="M2 -78 Q16 -76 16 -60 Q18 -44 10 -38 Q4 -42 4 -52 Z" fill="${color}"/>`,
    ponytail: `<path d="M10 -72 Q24 -70 22 -54 Q20 -46 16 -44 Q14 -56 8 -62 Z" fill="${color}"/>`,
    bun: `<circle cx="10" cy="-80" r="7" fill="${color}"/>`,
    curly: `<g fill="${color}"><circle cx="8" cy="-72" r="8"/><circle cx="12" cy="-62" r="7"/><circle cx="8" cy="-52" r="6"/></g>`,
  }[style] || '';
  const top = {
    short: `<path d="M-14 -66 Q-14 -80 0 -80 Q12 -79 12 -64 Q8 -60 6 -66 Q2 -70 -6 -70 Q-10 -70 -14 -66 Z" fill="${color}"/>`,
    bob: `<path d="M-15 -64 Q-15 -80 0 -80 Q14 -79 14 -62 L13 -52 Q6 -54 4 -62 Q-2 -70 -10 -68 Q-14 -66 -15 -64 Z" fill="${color}"/>`,
    long: `<path d="M-15 -64 Q-15 -80 0 -80 Q14 -79 14 -62 Q8 -62 4 -66 Q-2 -70 -10 -68 Q-14 -66 -15 -64 Z" fill="${color}"/>`,
    ponytail: `<path d="M-15 -64 Q-15 -80 0 -80 Q14 -79 13 -64 Q6 -66 2 -68 Q-6 -71 -15 -64 Z" fill="${color}"/>`,
    bun: `<path d="M-15 -64 Q-15 -80 0 -80 Q14 -79 13 -64 Q6 -66 2 -68 Q-6 -71 -15 -64 Z" fill="${color}"/>`,
    curly: `<g fill="${color}"><circle cx="-10" cy="-72" r="6"/><circle cx="-2" cy="-77" r="7"/><circle cx="7" cy="-75" r="7"/><circle cx="-14" cy="-66" r="4.5"/></g>`,
    buzz: `<path d="M-14 -66 Q-13 -79 0 -79 Q12 -78 12 -64 Q2 -70 -14 -66 Z" fill="${color}" opacity=".9"/>`,
  }[style] || '';
  return { back, top: top + (style === 'buzz' ? '' : hi) };
}

const HEADWEAR = {
  beanie: (c) => `<g class="own-hat"><path d="M-16 -66 Q-16 -86 -1 -86 Q14 -86 14 -66 Z" fill="${c}"/><path d="M-17 -68 H15 V-62 H-17 Z" fill="${tint(c, -0.2)}"/><circle cx="-1" cy="-88" r="4.5" fill="${tint(c, 0.4)}"/></g>`,
  sunhat: (c) => `<g class="own-hat"><ellipse cx="-2" cy="-72" rx="25" ry="5" fill="${c}"/><path d="M-13 -72 Q-12 -86 -1 -86 Q10 -86 10 -72 Z" fill="${c}"/><path d="M-13 -74 H10" stroke="${tint(c, -0.3)}" stroke-width="2.4"/></g>`,
  scout: (c) => `<g class="own-hat"><ellipse cx="-2" cy="-73" rx="22" ry="4" fill="${c}"/><path d="M-12 -73 L-6 -88 L4 -88 L9 -73 Z" fill="${c}"/><path d="M-6 -86 L-1 -80 L4 -86" fill="none" stroke="${tint(c, -0.3)}" stroke-width="1.5"/></g>`,
  cap: (c) => `<g class="own-hat"><path d="M-14 -70 Q-13 -84 0 -84 Q12 -84 12 -70 Z" fill="${c}"/><path d="M-14 -71 L-26 -69 L-24 -66 L-12 -67 Z" fill="${tint(c, -0.3)}"/><rect x="-5" y="-80" width="7" height="5" rx="1" fill="#E0C068"/></g>`,
  earmuffs: (c) => `<path d="M-12 -72 Q-2 -86 10 -72" fill="none" stroke="#2B2440" stroke-width="2.4"/><circle cx="4" cy="-63" r="6" fill="${c}"/>`,
  goggles: (c) => `<path d="M-15 -74 Q-2 -80 13 -74" fill="none" stroke="#2B2440" stroke-width="3"/><rect x="-17" y="-80" width="16" height="8" rx="4" fill="${c}"/><rect x="-15" y="-78" width="5" height="3" rx="1.5" fill="#FFFFFF" opacity=".6"/>`,
  headphones: (c) => `<path d="M-14 -66 Q-12 -86 2 -84 Q14 -82 12 -64" fill="none" stroke="#2B2440" stroke-width="3"/><rect x="0" y="-70" width="9" height="13" rx="4" fill="${c}"/>`,
  sunglasses: () => '<path d="M-17 -66 H-4 L-5 -61 Q-11 -59 -16 -61 Z" fill="#15132B"/><path d="M-4 -65 L4 -64" stroke="#15132B" stroke-width="1.5"/>',
  glasses: () => '<circle cx="-10" cy="-64" r="4.6" fill="#FFFFFF" fill-opacity=".14" stroke="#2B2440" stroke-width="1.4"/><path d="M-5.5 -65 L4 -64" stroke="#2B2440" stroke-width="1.2"/>',
};

function head(p) {
  const skin = SKIN[p.skin ?? 1];
  const [style, color] = p.hair || ['bob', '#3A2A3A'];
  const h = hair(style, color);
  const wear = (p.extras || []).map((e) => {
    const [name, c = '#F28DB2'] = e.split(':');
    return HEADWEAR[name] ? HEADWEAR[name](c) : '';
  });
  return `<g class="head">
      ${h.back}
      <rect x="-5" y="-56" width="9" height="12" rx="3" fill="${tint(skin, -0.08)}"/>
      <circle cx="-2" cy="-64" r="13" fill="${skin}"/>
      <circle cx="5" cy="-63" r="3.4" fill="${tint(skin, -0.1)}"/>
      <path d="M-15 -62 q-3 2 0 4" fill="${skin}"/>
      ${h.top}
      <g class="eye-open"><ellipse cx="-9.5" cy="-64" rx="1.7" ry="2.1" fill="#15132B"/></g>
      <path class="eye-closed" d="M-12 -64 q2.5 2 5 0" fill="none" stroke="#15132B" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="-8" cy="-58.5" rx="3" ry="1.6" fill="#F28DB2" opacity=".55"/>
      <path d="M-13 -55.5 q1.8 1.2 3.6 0" fill="none" stroke="#8A4A4A" stroke-width="1.1" stroke-linecap="round"/>
      ${wear.join('')}
      ${holidayHats()}
    </g>`;
}

// Something held in the near hand (hand at about -24,-15).
function held(item) {
  switch (item) {
    case 'mug': return '<rect x="-33" y="-27" width="10" height="12" rx="2" fill="#F7A9C8"/><path d="M-23 -24 q4 0 4 3 t-4 3" fill="none" stroke="#F7A9C8" stroke-width="2"/>';
    case 'latte': return '<rect x="-33" y="-27" width="10" height="12" rx="2" fill="#F4ECFF"/><rect x="-33" y="-27" width="10" height="3" rx="1.5" fill="#C9956A"/><path d="M-23 -24 q4 0 4 3 t-4 3" fill="none" stroke="#F4ECFF" stroke-width="2"/>';
    case 'cocoa': return '<rect x="-34" y="-27" width="11" height="12" rx="2" fill="#C8443C"/><ellipse cx="-28.5" cy="-27" rx="5" ry="1.8" fill="#6E3A2A"/><circle cx="-30" cy="-28" r="1.8" fill="#FFFFFF"/><circle cx="-27" cy="-28.5" r="1.6" fill="#FFFFFF"/><path class="mug-steam" d="M-30 -32 q-2 -4 0 -8 M-26 -32 q-2 -4 0 -8" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.4"/>';
    case 'popcorn': return '<path d="M-38 -26 L-24 -26 L-26 -6 L-36 -6 Z" fill="#F4ECFF"/><path d="M-36 -26 L-35 -6 M-31 -26 L-31 -6 M-27 -26 L-27.5 -6" stroke="#E04848" stroke-width="2"/><g fill="#FFF3C4"><circle cx="-35" cy="-28" r="3"/><circle cx="-30" cy="-29" r="3.4"/><circle cx="-26" cy="-28" r="3"/></g>';
    case 'phone': return '<rect x="-31" y="-28" width="6" height="11" rx="1.5" fill="#15132B" transform="rotate(-18 -28 -22)"/><rect class="phone-glow" x="-30" y="-27" width="4" height="8" rx="1" fill="#9FD8FF" transform="rotate(-18 -28 -22)"/>';
    case 'book': return '<path d="M-40 -14 L-30 -34 L-18 -31 L-26 -10 Z" fill="#6FA6C8"/><path d="M-38 -15 L-29 -33 L-28 -32 L-36 -14 Z" fill="#F7F1E6"/><path d="M-28 -32 L-19 -30 L-26 -11 L-35 -13 Z" fill="#F7F1E6"/>';
    case 'laptop': return '<path d="M-44 -4 L-8 -4 L-10 0 L-46 0 Z" fill="#B9B1D6"/><path d="M-44 -4 L-36 -30 L-33 -29 L-40 -4 Z" fill="#8A84A8"/><path class="screen-glow" d="M-42 -6 L-35 -28" stroke="#9FD8FF" stroke-width="2" opacity=".7"/>';
    case 'lemonade': return '<path d="M-34 -32 L-24 -32 L-26 -12 L-32 -12 Z" fill="#FFF3A0" opacity=".9"/><path d="M-34 -32 L-24 -32" stroke="#FFFFFF" stroke-width="1.4"/><path d="M-27 -32 L-23 -40" stroke="#F28DB2" stroke-width="1.6"/><circle cx="-34" cy="-31" r="2.6" fill="#FFD34A"/>';
    case 'can': return '<path d="M-38 -26 L-24 -26 L-24 -12 L-38 -12 Z" fill="#4FA88E"/><path d="M-38 -24 L-50 -32" stroke="#4FA88E" stroke-width="3"/><path d="M-24 -26 q6 -8 0 -12" fill="none" stroke="#3E8E7E" stroke-width="2"/>';
    case 'plant': return '<path d="M-36 -20 L-24 -20 L-26 -8 L-34 -8 Z" fill="#C8746A"/><g fill="#4FA88E"><ellipse cx="-33" cy="-26" rx="3" ry="6" transform="rotate(-20 -33 -26)"/><ellipse cx="-27" cy="-27" rx="3" ry="7" transform="rotate(15 -27 -27)"/></g>';
    case 'marshmallow': return '<path d="M-22 -16 L-70 8" stroke="#8A5A3C" stroke-width="2"/><rect x="-76" y="5" width="8" height="7" rx="2" fill="#FFF3E6" transform="rotate(-26 -72 8)"/>';
    case 'lantern': return '<path d="M-28 -16 V-22" stroke="#2B2440" stroke-width="1.4"/><rect x="-34" y="-14" width="12" height="15" rx="3" fill="#2B2440"/><rect x="-32" y="-12" width="8" height="11" rx="2" fill="#FFD38A" class="lantern-light"/>';
    case 'ticket': return '<rect x="-34" y="-30" width="12" height="8" rx="1.5" fill="#F4ECFF" transform="rotate(-14 -28 -26)"/>';
    default: return '';
  }
}

function arm(color, pose, item) {
  const edge = tint(color, -0.22);
  const path = pose === 'stand' && !item ? 'M2 -42 L-2 -16 L-4 -2' : 'M2 -42 L-4 -18 L-22 -15';
  const hand = pose === 'stand' && !item ? [-4, 0] : [-24, -15];
  return `<path d="${path}" fill="none" stroke="${edge}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="${hand[0]}" cy="${hand[1]}" r="4" fill="__SKIN__"/>`;
}

const scarf = (c) => `<path d="M-10 -50 Q2 -42 12 -50 L13 -44 Q2 -36 -11 -44 Z" fill="${c}"/><path d="M-6 -44 L-10 -24 L-3 -23 L0 -42 Z" fill="${tint(c, -0.15)}"/>`;

/** One person as an SVG string. */
export function personSvg(p, i) {
  const pose = p.pose || 'sit';
  if (pose === 'lie') {
    // Tucked into a sleeping bag: just the head, resting on its side at the open end.
    const classes = ['person', p.core ? 'core' : 'extra', p.dozer ? 'dozer' : ''].join(' ');
    return `<g class="${classes}" transform="translate(${p.x} ${p.y}) scale(${p.s || 1.5})" style="--d: ${((i * 0.23) % 0.8).toFixed(2)}s">
      <g transform="translate(-30 -8) rotate(-80)">${head(p)}</g>
      <g class="zz"><text x="-100" y="-30">z</text><text x="-90" y="-42">z</text></g></g>`;
  }
  const [topStyle, topColor] = p.top || ['tee', '#F7A9C8'];
  const skin = SKIN[p.skin ?? 1];
  const extras = p.extras || [];
  const scarfColor = extras.find((e) => e.startsWith('scarf'))?.split(':')[1];
  const lean = pose === 'recline' ? 26 : pose === 'floor' ? -4 : 0;
  const classes = ['person', p.core ? 'core' : 'extra', p.dozer ? 'dozer' : '', p.studier ? 'studier' : ''].join(' ');
  const study = p.studier
    ? `<g class="study-book">${held('book')}</g><g class="study-tea">${held('mug')}</g>`
    : '';
  const upper = `<g transform="rotate(${lean})">
      ${torso(topStyle, topColor, p)}
      ${scarfColor ? scarf(scarfColor) : ''}
      ${head(p)}
      <g class="own-hold">${held(p.hold)}</g>${study}
      ${arm(topColor, pose, p.hold || p.studier).replace('__SKIN__', skin)}
    </g>`;
  const fx = `<g class="zz"><text x="10" y="-92">z</text><text x="20" y="-104">z</text></g>`
    + (p.core && i === 0 ? '<g class="huh"><circle cx="8" cy="-104" r="11" fill="#F4ECFF"/><text x="8" y="-99" text-anchor="middle">?</text></g>' : '');
  return `<g class="${classes}" transform="translate(${p.x} ${p.y}) scale(${p.s || 1.5})" style="--d: ${((i * 0.23) % 0.8).toFixed(2)}s">
    ${legs(pose, p.legs || '#3B3F78', p.shoes)}${skirt(topStyle, topColor, pose)}${upper}${fx}</g>`;
}

/* ---------- furniture (local units, seat at 0,0) ---------- */

const FURNITURE = {
  couch: (f) => {
    const c = f.color || '#6E4C8E';
    const d = tint(c, -0.2);
    return `<path d="M14 -40 Q14 -46 22 -46 L32 -46 Q38 -46 38 -38 L38 26 L14 26 Z" fill="${d}"/>
      <path d="M-48 -4 Q-48 -10 -40 -10 L30 -10 Q36 -10 36 -4 L36 28 L-48 28 Z" fill="${c}"/>
      <path d="M-46 -10 L30 -10" stroke="${tint(c, 0.2)}" stroke-width="4" stroke-linecap="round"/>
      ${f.arm ? `<path d="M-62 -26 Q-62 -32 -54 -32 Q-46 -32 -46 -26 L-46 28 L-62 28 Z" fill="${d}"/>` : ''}
      <rect x="-44" y="28" width="6" height="8" rx="2" fill="#15132B"/><rect x="28" y="28" width="6" height="8" rx="2" fill="#15132B"/>`;
  },
  armchair: (f) => FURNITURE.couch({ ...f, arm: true }).replace('M-48 -4 Q-48 -10 -40 -10 L30', 'M-40 -4 Q-40 -10 -32 -10 L30'),
  cushion: (f) => `<ellipse cx="-12" cy="14" rx="36" ry="11" fill="${tint(f.color || '#F28DB2', -0.25)}"/><ellipse cx="-12" cy="10" rx="34" ry="9" fill="${f.color || '#F28DB2'}"/>`,
  beanbag: (f) => `<path d="M-30 30 Q-44 6 -20 -14 Q0 -40 26 -30 Q44 -14 40 14 Q34 34 -30 30 Z" fill="${f.color || '#4F6FA8'}"/><path d="M-20 -10 Q0 -32 20 -26" fill="none" stroke="${tint(f.color || '#4F6FA8', 0.3)}" stroke-width="4" stroke-linecap="round"/>`,
  beachchair: (f) => `<path d="M-48 30 L20 -4 M30 30 L-10 6" stroke="#8A5A3C" stroke-width="4"/>
      <path d="M-30 4 L28 -56 L36 -50 L-20 12 Z" fill="${f.color || '#F28DB2'}"/><path d="M-26 0 L32 -53" stroke="#FFFFFF" stroke-width="4" opacity=".7"/>
      <path d="M-30 8 L-20 12 L-44 14 Z" fill="${f.color || '#F28DB2'}"/>`,
  towel: (f) => `<path d="M-90 14 L40 10 L46 24 L-84 28 Z" fill="${f.color || '#6FE3F2'}"/><path d="M-80 16 L42 13 M-78 22 L44 19" stroke="#FFFFFF" stroke-width="3" opacity=".7"/>`,
  bench: (f) => `<path d="M14 -56 L34 -56 L34 4 L14 4 Z" fill="none" stroke="${f.color || '#8A5A3C'}" stroke-width="4"/><path d="M16 -46 H32 M16 -34 H32 M16 -22 H32" stroke="${f.color || '#8A5A3C'}" stroke-width="3"/>
      <rect x="-50" y="-8" width="86" height="10" rx="3" fill="${f.color || '#8A5A3C'}"/><path d="M-44 2 Q-48 18 -44 36 M28 2 Q32 18 28 36" fill="none" stroke="#2B2440" stroke-width="4"/>`,
  stool: (f) => `<ellipse cx="0" cy="0" rx="18" ry="5" fill="${f.color || '#8A5A3C'}"/><path d="M-12 2 L-16 44 M12 2 L16 44 M0 4 L0 44 M-14 26 H14" stroke="#2B2440" stroke-width="3"/>`,
  log: (f) => `<rect x="-56" y="-2" width="96" height="26" rx="12" fill="#6E4430"/><ellipse cx="40" cy="11" rx="8" ry="13" fill="#C9956A"/><ellipse cx="40" cy="11" rx="4" ry="7" fill="none" stroke="#8A5A3C" stroke-width="1.5"/>
      <path d="M-46 6 H24 M-40 16 H10" stroke="#5A3626" stroke-width="2"/>`,
  sleepingbag: (f) => `<path d="M-96 6 Q-100 -14 -80 -16 L26 -16 Q46 -14 46 6 Q46 24 26 24 L-80 24 Q-98 22 -96 6 Z" fill="${f.color || '#D04858'}"/>
      <path d="M-70 -16 L-70 24" stroke="${tint(f.color || '#D04858', -0.25)}" stroke-width="3"/><path d="M-60 4 Q-10 -4 40 4" fill="none" stroke="${tint(f.color || '#D04858', 0.25)}" stroke-width="3"/>`,
  trainseat: (f) => `<path d="M12 -86 Q12 -94 22 -94 L30 -94 Q40 -94 40 -84 L40 26 L12 26 Z" fill="${f.color || '#3E6E8E'}"/>
      <rect x="16" y="-90" width="20" height="16" rx="5" fill="#F4ECFF" opacity=".8"/>
      <path d="M-46 -4 Q-46 -10 -38 -10 L34 -10 L34 28 L-46 28 Z" fill="${tint(f.color || '#3E6E8E', 0.1)}"/>
      <path d="M-56 -22 L-40 -22 L-40 28 L-56 28 Z" fill="${tint(f.color || '#3E6E8E', -0.2)}"/>`,
  cafetable: (f) => `<ellipse cx="0" cy="0" rx="28" ry="7" fill="${f.color || '#C9956A'}"/><path d="M0 4 V52 M-16 54 H16" stroke="#2B2440" stroke-width="4" stroke-linecap="round"/>
      ${(f.items || []).map(([item, dx]) => `<g transform="translate(${dx + 28} 13)">${held(item)}</g>`).join('')}`,
  skis: () => `<g transform="rotate(8)"><rect x="0" y="0" width="7" height="150" rx="3" fill="#D04858"/><rect x="11" y="4" width="7" height="150" rx="3" fill="#4F6FA8"/><path d="M-2 0 q5 -10 10 0 M9 4 q5 -10 10 0" fill="#D04858"/></g>
      <path d="M40 20 L44 150 M54 18 L56 150" stroke="#2B2440" stroke-width="2.5"/><circle cx="44" cy="140" r="4" fill="none" stroke="#2B2440" stroke-width="2"/><circle cx="56" cy="140" r="4" fill="none" stroke="#2B2440" stroke-width="2"/>`,
  surfboard: (f) => `<g transform="rotate(-10)"><path d="M0 0 Q14 -80 0 -150 Q-14 -80 0 0 Z" fill="${f.color || '#FFB38A'}"/><path d="M0 -6 L0 -144" stroke="#FFFFFF" stroke-width="3" opacity=".7"/></g>`,
  sandcastle: () => '<path d="M-20 0 L-20 -16 L-14 -16 L-14 -24 L-8 -24 L-8 -16 L4 -16 L4 -24 L10 -24 L10 -16 L16 -16 L16 0 Z" fill="#E6C88A"/>',
  plantpot: (f) => `<path d="M-16 0 L16 0 L12 30 L-12 30 Z" fill="#C8746A"/><g fill="#4FA88E"><ellipse cx="-8" cy="-14" rx="6" ry="16" transform="rotate(-20 -8 -14)"/><ellipse cx="4" cy="-20" rx="6" ry="20"/><ellipse cx="12" cy="-10" rx="5" ry="14" transform="rotate(25 12 -10)"/></g>`,
  luggage: (f) => `<rect x="-20" y="-40" width="40" height="40" rx="5" fill="${f.color || '#8A4A3C'}"/><rect x="-8" y="-48" width="16" height="8" rx="3" fill="none" stroke="${tint(f.color || '#8A4A3C', -0.3)}" stroke-width="3"/><path d="M-20 -20 H20" stroke="${tint(f.color || '#8A4A3C', -0.3)}" stroke-width="3"/>`,
};

/* ---------- drawing a room's group ---------- */

let svgRoot = null;

export function drawPeople(container, { room, crowd, season }) {
  const group = GROUPS[room] || GROUPS.bedroom;
  const show = (item) => crowd !== 'empty' && (crowd !== 'cozy' || item.core || item.always);
  const items = [
    ...(group.furniture || []).map((f) => ({ ...f, kind: 'f' })),
    ...(group.people || []).filter(show).map((p, i) => ({ ...p, kind: 'p', index: i })),
  ];
  // Back to front (higher y is nearer); furniture before people at the same depth.
  items.sort((a, b) => (a.z ?? a.y) - (b.z ?? b.y) || (a.kind === 'f' ? -1 : 1));
  const cold = season === 'winter' && !['beach'].includes(room);
  const parts = items.map((item) => {
    if (item.kind === 'f') {
      if (item.people && !show({ core: item.core })) return '';
      const draw = FURNITURE[item.type];
      return draw ? `<g class="furniture f-${item.type}" transform="translate(${item.x} ${item.y}) scale(${item.s || 1.5})">${draw(item)}</g>` : '';
    }
    const extras = [...(item.extras || [])];
    if (cold && !extras.some((e) => e.startsWith('scarf')) && item.top?.[0] !== 'puffer') extras.push('scarf:#E85A6A');
    return personSvg({ ...item, extras }, item.index);
  });
  if (!svgRoot) {
    svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgRoot.setAttribute('viewBox', '0 0 1280 820');
    svgRoot.setAttribute('class', 'layer people');
    svgRoot.setAttribute('aria-hidden', 'true');
    container.replaceChildren(svgRoot);
  }
  // The whole group grows from a point on the floor, so the room's numbers stay simple.
  const { scale = 1.2, ax = 560, ay = 800 } = group;
  svgRoot.innerHTML = `<g transform="translate(${ax} ${ay}) scale(${scale}) translate(${-ax} ${-ay})">${parts.join('')}</g>`;
}

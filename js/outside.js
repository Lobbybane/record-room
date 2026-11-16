// Life outside the window (city views only): people on the pavement below.
// Each passer-by is a tiny figure (about 13 px tall, the scale of the street far below),
// in a coat colour, sometimes carrying a bag or walking a dog; umbrellas open in the rain
// (css/style.css, "the street below").

const NS = 'http://www.w3.org/2000/svg';
const COATS = ['#C8728E', '#5E86B8', '#D9A95E', '#6FA08A', '#9A78C8', '#C8644A', '#4F5E8E', '#E0C9A0'];
const UMBRELLAS = ['#F28DB2', '#6FE3F2', '#FFD34A', '#B79CFF', '#F4ECFF', '#FF8A6E'];
const SKINS = ['#F6D6C2', '#E8B896', '#C98E67', '#9C6646', '#6E4430'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** One passer-by, drawn facing right with feet at (0, 0). */
export function passerbySvg({ coat = pick(COATS), umbrella = pick(UMBRELLAS), skin = pick(SKINS), dog = false, bag = false } = {}) {
  const legs = '#1E1A3A';
  return `<g class="legs"><path class="leg-a" d="M-0.8 -5.5 L-1.6 0" stroke="${legs}" stroke-width="1.7" stroke-linecap="round"/>`
    + `<path class="leg-b" d="M0.8 -5.5 L1.6 0" stroke="${legs}" stroke-width="1.7" stroke-linecap="round"/></g>`
    + `<rect x="-2.7" y="-12.5" width="5.4" height="7.6" rx="2.2" fill="${coat}"/>`
    + `<circle cx="0.2" cy="-14.6" r="2.1" fill="${skin}"/>`
    + `<path d="M-1.9 -15.6 Q0.2 -18.4 2.3 -15.8 Q0.2 -16.6 -1.9 -15.6 Z" fill="#2A1E2E"/>`
    + (bag ? '<rect x="2" y="-9" width="3" height="3.6" rx=".8" fill="#2A2440"/>' : '')
    + (dog ? '<g class="dog"><path d="M6 -4.6 H12 Q13.6 -4.6 13.6 -3.2 V-2.6 H6 Z" fill="#8A5A3C"/><circle cx="13.4" cy="-5.4" r="1.6" fill="#8A5A3C"/>'
      + '<path d="M7 -2.6 V0 M12 -2.6 V0" stroke="#8A5A3C" stroke-width="1.1"/><path d="M1.8 -8 Q5 -6 6.4 -4.2" fill="none" stroke="#2A2440" stroke-width=".5"/></g>' : '')
    + `<g class="umbrella"><path d="M0.3 -13 V-19.5" stroke="#2A2440" stroke-width=".7"/><path d="M-6.6 -19 Q0.3 -26.6 7.2 -19 Q0.3 -20.6 -6.6 -19 Z" fill="${umbrella}"/></g>`;
}

function place(container, x, look, face = 1) {
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('class', 'passerby');
  el.setAttribute('viewBox', '-16 -28 32 30');
  el.setAttribute('width', '36');
  el.setAttribute('height', '34');
  el.style.left = `${x - 18}px`;
  el.style.top = `${298 - 32}px`; // feet on the pavement, under the elevated train
  el.innerHTML = `<g transform="scale(${face} 1)">${passerbySvg(look)}</g>`;
  container.append(el);
  return el;
}

export function initOutside() {
  const street = document.getElementById('passersby');
  if (!street) return;
  // For now a few people stand along the street (they walk in the next step).
  street.replaceChildren();
  place(street, 70, { coat: '#C8728E', umbrella: '#6FE3F2' });
  place(street, 168, { coat: '#5E86B8', umbrella: '#FFD34A', bag: true }, -1);
  place(street, 300, { coat: '#D9A95E', umbrella: '#F28DB2', dog: true });
  place(street, 312 + 30, { coat: '#6FA08A', umbrella: '#B79CFF' }, -1);
  place(street, 470, { coat: '#9A78C8', umbrella: '#F4ECFF' });
}

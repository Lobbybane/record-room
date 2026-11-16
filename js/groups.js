// Who is in each room. Everyone faces left, toward the TV on the left wall.
// x, y: the person's seat (hip) in stage pixels; s: size. Poses: sit, floor, stand, recline, lie.
// ★ core people stay for "A cozy few"; extras appear when the room is "Busy".
// skin: 0-4; hair: [style, colour] (short, bob, long, ponytail, bun, curly, buzz);
// top: [style, colour] (tee, hoodie, sweater, puffer, flannel, apron, sundress, overalls, uniform);
// extras: 'name:colour' (beanie, sunhat, scout, cap, earmuffs, goggles, headphones, sunglasses, glasses, scarf);
// hold: mug, latte, cocoa, popcorn, phone, book, laptop, lemonade, can, plant, marshmallow, lantern, ticket.
// Each room can set scale / ax / ay: the whole group is scaled from that floor point (default 1.2 from 560, 800).
// Keep the right-most person left of the record crate (x 808 after scaling).

// The café's tables (people-group units): one at the front left in front of the TV
// console, the two front tables, and two little tables for one in the back row by the
// window bar, set in the gaps between the front customers so everyone stays in view.
// A table for two seats <id>1 on the left (facing right) and <id>2 on the right (facing
// left); a table for one (`solo`) has just <id>2, on its right.
export const CAFE_TABLES = [
  { id: 'P', x: 292.5, y: 640, s: 1, solo: true },
  { id: 'Q', x: 515, y: 640, s: 1, solo: true },
  { id: 'A', x: 468, y: 700, s: 1.15 },
  { id: 'L', x: 247.5, y: 718, s: 1.15 },
  { id: 'B', x: 668, y: 726, s: 1.15 },
];
export const CAFE_SEATS = CAFE_TABLES.flatMap((t) => [
  ...(t.solo ? [] : [{ id: `${t.id}1`, table: t.id, x: t.x - 55 * t.s, y: t.y, s: t.s, face: 'right' }]),
  { id: `${t.id}2`, table: t.id, x: t.x + 55 * t.s, y: t.y, s: t.s, face: 'left' },
]);
const atSeat = (id, look) => {
  const seat = CAFE_SEATS.find((s) => s.id === id);
  return { ...look, seat: id, x: seat.x, y: seat.y, s: seat.s, face: seat.face === 'right' ? 'right' : undefined, pose: 'chair' };
};

export const GROUPS = {
  bedroom: {
    furniture: [
      { type: 'couch', x: 604, y: 680, s: 1.5, color: '#6E4C8E', core: true, people: true },
      { type: 'couch', x: 560, y: 700, s: 1.5, color: '#6E4C8E', arm: true, core: true, people: true },
      { type: 'cushion', x: 430, y: 752, s: 1.4, color: '#F28DB2', core: true, people: true },
      { type: 'beanbag', x: 700, y: 722, s: 1.4, color: '#4F6FA8', people: true },
    ],
    people: [
      { x: 560, y: 700, s: 1.5, core: true, skin: 1, hair: ['bob', '#3A2A3A'], top: ['hoodie', '#FFB38A'], legs: '#3B3F78', hold: 'popcorn', dozer: true },
      { x: 604, y: 680, s: 1.45, core: true, skin: 3, hair: ['curly', '#1E1620'], top: ['sweater', '#7FA08A'], legs: '#2C2E5E', hold: 'mug' },
      { x: 430, y: 752, s: 1.4, core: true, pose: 'floor', skin: 0, hair: ['ponytail', '#C9956A'], top: ['tee', '#F7A9C8'], legs: '#4F6FA8', extras: ['headphones:#6FE3F2'], studier: true },
      { x: 700, y: 722, s: 1.4, pose: 'recline', skin: 2, hair: ['short', '#2A1E1E'], top: ['hoodie', '#5A6EB0'], legs: '#2C2E5E', hold: 'phone', dozer: true },
    ],
  },
  // A real café: little bistro tables with bentwood chairs. People sit facing their table
  // (and each other); the TV is just the café's radio. `act` is what they're doing
  // (type, phone, read, or hold for just enjoying a drink) and `drink` what they ordered.
  cafe: {
    furniture: CAFE_TABLES.flatMap((t) => [
      ...(t.solo ? [] : [{ type: 'cafechair', x: t.x - 55 * t.s, y: t.y, s: t.s, face: 'right' }]),
      { type: 'cafechair', x: t.x + 55 * t.s, y: t.y, s: t.s },
      { type: 'bistro', x: t.x, y: t.y, s: t.s },
    ]),
    // The customers already here when you arrive (js/cafe.js sends more in, and sends
    // everyone home in time). `core` ones stay for "A cozy few".
    people: [
      atSeat('A1', { core: true, act: 'type', drink: 'hotlatte:#F4ECFF', skin: 2, hair: ['short', '#2A1E1E'], top: ['flannel', '#4F6FA8'], legs: '#2C2E5E', shoes: '#3A2A3A', extras: ['glasses'] }),
      atSeat('A2', { act: 'read', hold: 'bookopen:#6FA6C8', skin: 0, hair: ['long', '#B0603A'], top: ['tee', '#9FE0C8'], legs: '#3B3F78', shoes: '#6B4436' }),
      atSeat('B1', { act: 'phone', hold: 'phone', drink: 'iced', skin: 4, hair: ['bun', '#15101A'], top: ['sweater', '#F2B33D'], legs: '#3E2E3E', shoes: '#E8DDF5' }),
      atSeat('B2', { core: true, act: 'hold', hold: 'hot:#F7A9C8', plate: true, skin: 1, hair: ['ponytail', '#2A1E1E'], top: ['hoodie', '#E8955A'], legs: '#3B3F78', shoes: '#2B2440' }),
      atSeat('Q2', { act: 'type', drink: 'hot:#7FA08A', skin: 3, hair: ['curly', '#1E1620'], top: ['hoodie', '#B79CFF'], legs: '#2C2E5E', shoes: '#3A2A3A', extras: ['headphones:#6FE3F2'] }),
    ],
  },
  cabin: {
    furniture: [
      { type: 'skis', x: 350, y: 448, s: 1, always: true },
      { type: 'couch', x: 706, y: 684, s: 1.5, color: '#8A4A3C', core: true, people: true },
      { type: 'couch', x: 662, y: 704, s: 1.5, color: '#8A4A3C', arm: true, core: true, people: true },
    ],
    people: [
      { x: 662, y: 704, s: 1.5, core: true, skin: 1, hair: ['long', '#6E3A2A'], top: ['puffer', '#D04858'], legs: '#2C2E5E', extras: ['beanie:#F2B33D'], hold: 'cocoa' },
      { x: 706, y: 684, s: 1.45, core: true, skin: 3, hair: ['short', '#15101A'], top: ['puffer', '#3E6E8E'], legs: '#3B3F78', extras: ['beanie:#E85A6A', 'scarf:#F2B33D'], hold: 'cocoa', dozer: true },
      { x: 500, y: 770, s: 1.4, core: true, pose: 'floor', skin: 0, hair: ['bob', '#E0B070'], top: ['sweater', '#F4ECFF'], legs: '#5A4858', extras: ['earmuffs:#F7A9C8', 'scarf:#7FA08A'], studier: true },
      { x: 400, y: 698, s: 1.45, pose: 'stand', skin: 2, hair: ['ponytail', '#2A1E1E'], top: ['puffer', '#F2B33D'], legs: '#2C2E5E', extras: ['goggles:#6FE3F2'], hold: 'mug', shoes: '#8A5A3C' },
    ],
  },
  beach: {
    furniture: [
      { type: 'surfboard', x: 356, y: 596, s: 1.1, color: '#6FE3F2', always: true },
      { type: 'beachchair', x: 500, y: 712, s: 1.4, color: '#F28DB2', core: true, people: true },
      { type: 'beachchair', x: 610, y: 700, s: 1.4, color: '#FFB38A', core: true, people: true },
      { type: 'towel', x: 696, y: 748, s: 1.3, color: '#6FE3F2', core: true, people: true },
      { type: 'sandcastle', x: 420, y: 790, s: 1.2, always: true },
    ],
    people: [
      { x: 500, y: 712, s: 1.45, core: true, pose: 'recline', skin: 2, hair: ['long', '#2A1E1E'], top: ['sundress', '#FFB38A'], legs: '#C98E67', shoes: '#F28DB2', extras: ['sunhat:#F2E2B0', 'sunglasses'], hold: 'lemonade' },
      { x: 610, y: 700, s: 1.4, core: true, pose: 'recline', skin: 0, hair: ['short', '#E0B070'], top: ['tee', '#6FE3F2'], legs: '#F28DB2', shoes: '#F4ECFF', extras: ['sunglasses'], dozer: true },
      { x: 696, y: 748, s: 1.3, core: true, pose: 'recline', skin: 4, hair: ['curly', '#15101A'], top: ['tee', '#F2B33D'], legs: '#4F6FA8', hold: 'book', studier: true },
      { x: 396, y: 700, s: 1.45, pose: 'stand', skin: 1, hair: ['ponytail', '#B0603A'], top: ['sundress', '#9FE0C8'], legs: '#E8B896', shoes: '#F28DB2', extras: ['sunhat:#F28DB2'], hold: 'lemonade' },
    ],
  },
  greenhouse: {
    furniture: [
      { type: 'bench', x: 620, y: 700, s: 1.45, color: '#8A5A3C', core: true, people: true },
      { type: 'stool', x: 430, y: 722, s: 1.4, color: '#8A5A3C', core: true, people: true },
      { type: 'plantpot', x: 380, y: 760, s: 1.2, always: true },
    ],
    people: [
      { x: 580, y: 700, s: 1.45, core: true, skin: 1, hair: ['bun', '#6E3A2A'], top: ['sweater', '#9CBDA6'], legs: '#3B3F78', hold: 'mug', dozer: true },
      { x: 626, y: 692, s: 1.4, skin: 3, hair: ['short', '#15101A'], top: ['flannel', '#C8443C'], legs: '#2C2E5E', studier: true },
      { x: 430, y: 722, s: 1.4, core: true, skin: 0, hair: ['long', '#E0B070'], top: ['overalls', '#F4ECFF'], bib: '#4F8E5E', legs: '#4F8E5E', hold: 'can', extras: ['sunhat:#E6D8C2'] },
      { x: 704, y: 700, s: 1.45, pose: 'stand', skin: 2, hair: ['curly', '#2A1E1E'], top: ['overalls', '#F2B33D'], bib: '#6E4C8E', legs: '#6E4C8E', hold: 'plant', shoes: '#8A5A3C' },
    ],
  },
  treehouse: {
    furniture: [
      { type: 'log', x: 650, y: 722, s: 1.4, core: true, people: true },
      { type: 'sleepingbag', x: 480, y: 768, s: 1.3, color: '#D04858', core: true, people: true },
    ],
    people: [
      { x: 624, y: 716, s: 1.45, core: true, skin: 2, hair: ['bob', '#2A1E1E'], top: ['flannel', '#C8443C'], legs: '#3B3F78', hold: 'lantern', shoes: '#8A5A3C' },
      { x: 684, y: 706, s: 1.4, skin: 0, hair: ['short', '#B0603A'], top: ['flannel', '#3E6E4E'], legs: '#5A4858', hold: 'cocoa', shoes: '#8A5A3C', studier: true },
      { x: 480, y: 768, s: 1.3, core: true, pose: 'lie', skin: 1, hair: ['curly', '#3A2A3A'], extras: ['beanie:#4F8E5E'], dozer: true },
      { x: 590, y: 742, s: 1.35, pose: 'floor', skin: 3, hair: ['short', '#15101A'], top: ['tee', '#C9A86A'], legs: '#4F6E3A', extras: ['scout:#8A6A3C', 'scarf:#E85A6A'], hold: 'cocoa' },
    ],
  },
  // The movie theater draws its own audience (js/theater.js).
  theater: { furniture: [], people: [] },
  train: {
    furniture: [
      { type: 'trainseat', x: 640, y: 690, s: 1.45, color: '#3E6E8E', core: true, people: true },
      { type: 'trainseat', x: 520, y: 704, s: 1.45, color: '#3E6E8E', core: true, people: true },
      { type: 'luggage', x: 440, y: 790, s: 1.1, color: '#8A4A3C', always: true },
    ],
    people: [
      { x: 520, y: 704, s: 1.45, core: true, skin: 1, hair: ['long', '#15101A'], top: ['sweater', '#C9708F'], legs: '#2C2E5E', hold: 'book', extras: ['headphones:#F4ECFF'], studier: true },
      { x: 640, y: 690, s: 1.4, core: true, skin: 3, hair: ['short', '#2A1E1E'], top: ['hoodie', '#6E4C8E'], legs: '#3B3F78', hold: 'mug', dozer: true },
    ],
  },
};

// What happens in each room (js/life-people.js): chats are lines two neighbours swap;
// moments are room-only animations; `wanders` people go on snack runs; a visitor drops by.
// Visitors walk in from the right to x, standing with their hip at y (feet just behind the crate).
const LIFE = {
  bedroom: {
    chats: [['this song!', 'so good'], ['pass the popcorn', 'get your own :P'], ['one more episode?', 'always'], ['love this part', 'shh!']],
    moments: ['popcorn', 'groove'],
    wanders: { 3: { snacks: ['pizza', 'snacks', 'popcorn'], snackLines: ['snack run!', 'anyone want chips?'] } },
    visitor: { x: 893, y: 708, s: 1.3, lines: [["pizza's here!", 'yesss!'], ['knock knock!', 'come in!']],
      look: { skin: 4, hair: ['buzz', '#15101A'], top: ['hoodie', '#F2B33D'], legs: '#3B3F78', hold: 'pizza', extras: ['cap:#C8443C'] } },
  },
  cafe: {
    chats: [["how's the latte?", 'perfect'], ['love this place', 'same'], ['what are you reading?', 'a mystery'], ['deadline…', 'you got this']],
    moments: [],
    // No visitor: js/cafe.js brings customers in to order at the counter.
  },
  cabin: {
    chats: [['so cold out there!', "fire's nice though"], ['first run tomorrow?', 'early!'], ['more cocoa?', 'yes please']],
    moments: ['warm', 'shiver'],
    warms: [2],
    wanders: { 3: { snacks: ['cocoa'], snackLines: ['more cocoa?'] } },
    visitor: { x: 893, y: 708, s: 1.3, effect: 'snow', lines: [['fresh snow out there!', 'jealous'], ['brr! hi all', 'close the door!']],
      look: { skin: 0, hair: ['short', '#B0603A'], top: ['puffer', '#4F6FA8'], legs: '#2C2E5E', extras: ['goggles:#F2B33D', 'beanie:#4F6FA8'], shoes: '#8A5A3C' } },
  },
  beach: {
    chats: [['best sunset', 'every time'], ["surf's up!", 'later, sleepy'], ['more lemonade?', 'yes!']],
    moments: ['fan'],
    wanders: { 3: { snacks: ['lemonade'], snackLines: ['lemonade refill!'] } },
    visitor: { x: 893, y: 708, s: 1.3, effect: 'drip', lines: [['waves are perfect!', "go get 'em"], ['anyone want to surf?', 'maybe later']],
      look: { skin: 3, hair: ['curly', '#15101A'], top: ['tee', '#6FE3F2'], legs: '#F28DB2', hold: 'surfboard', extras: ['sunglasses'] } },
  },
  greenhouse: {
    chats: [["it's growing!", 'so green'], ['smell the basil', 'mmm'], ['needs water', 'on it']],
    moments: ['water'],
    wanders: { 3: { snacks: ['plant', 'mug'], snackLines: ['getting more pots'] } },
    visitor: { x: 893, y: 708, s: 1.3, lines: [['brought you a fern!', 'aww thanks!'], ['your tomatoes look great', 'thank you!']],
      look: { skin: 4, hair: ['bun', '#15101A'], top: ['sweater', '#F28DB2'], legs: '#3B3F78', hold: 'plant' } },
  },
  treehouse: {
    chats: [['did you hear that owl?', 'spooky'], ["s'mores?", 'always'], ['story time?', 'a scary one!']],
    moments: ['snore', 'owl', 'warm'],
    warms: [3],
    wanders: { 1: { snacks: ['cocoa', 'marshmallow'], snackLines: ['getting marshmallows'] } },
    visitor: { x: 893, y: 708, s: 1.3, lines: [['more wood for the fire', 'perfect'], ['found the trail!', 'nice']],
      look: { skin: 1, hair: ['ponytail', '#6E3A2A'], top: ['flannel', '#F2B33D'], legs: '#4F6E3A', hold: 'firewood', extras: ['beanie:#C8443C'], shoes: '#8A5A3C' } },
  },
  train: {
    chats: [['next stop?', 'not yet'], ['look, the lights!', 'so pretty'], ['sleep or snacks?', 'snacks']],
    moments: ['window'],
    wanders: { 1: { snacks: ['snacks', 'mug'], snackLines: ['dining car?'] } },
    visitor: { x: 893, y: 708, s: 1.3, lines: [['tickets please!', 'here you go', 'thank you!'], ['next stop, the coast', 'thanks!']],
      look: { skin: 0, hair: ['short', '#B0603A'], top: ['uniform', '#2E3A6E'], legs: '#2E3A6E', extras: ['cap:#2E3A6E'], hold: 'ticket', shoes: '#15132B' } },
  },
};

for (const [room, life] of Object.entries(LIFE)) {
  const group = GROUPS[room];
  const { wanders = {}, warms = [], ...rest } = life;
  Object.assign(group, rest);
  for (const [i, extra] of Object.entries(wanders)) Object.assign(group.people[i], { wanders: true, ...extra });
  for (const i of warms) group.people[i].warms = true;
}

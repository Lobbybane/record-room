// Who is in each room. Everyone faces left, toward the TV on the left wall.
// x, y: the person's seat (hip) in stage pixels; s: size. Poses: sit, floor, stand, recline, lie.
// ★ core people stay for "A cozy few"; extras appear when the room is "Busy".
// skin: 0-4; hair: [style, colour] (short, bob, long, ponytail, bun, curly, buzz);
// top: [style, colour] (tee, hoodie, sweater, puffer, flannel, apron, sundress, overalls, uniform);
// extras: 'name:colour' (beanie, sunhat, scout, cap, earmuffs, goggles, headphones, sunglasses, glasses, scarf);
// hold: mug, latte, cocoa, popcorn, phone, book, laptop, lemonade, can, plant, marshmallow, lantern, ticket.
// Each room can set scale / ax / ay: the whole group is scaled from that floor point (default 1.2 from 560, 800).
// Keep the right-most person left of the record crate (x 808 after scaling).

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
  cafe: {
    furniture: [
      { type: 'cafetable', x: 470, y: 700, s: 1.4, items: [['latte', -10], ['latte', 8]], core: true, people: true },
      { type: 'armchair', x: 400, y: 712, s: 1.4, color: '#8A5A4A' },
      { type: 'armchair', x: 560, y: 704, s: 1.4, color: '#2E6E66', core: true, people: true },
      { type: 'stool', x: 688, y: 726, s: 1.4, color: '#8A5A3C', people: true },
    ],
    people: [
      { x: 560, y: 704, s: 1.45, core: true, skin: 4, hair: ['bun', '#15101A'], top: ['sweater', '#F2B33D'], legs: '#3E2E3E', hold: 'latte', dozer: true },
      { x: 400, y: 712, s: 1.45, skin: 0, hair: ['long', '#B0603A'], top: ['tee', '#9FE0C8'], legs: '#3B3F78', hold: 'book', studier: true },
      { x: 688, y: 726, s: 1.4, core: true, skin: 2, hair: ['short', '#2A1E1E'], top: ['flannel', '#4F6FA8'], legs: '#2C2E5E', hold: 'laptop', extras: ['glasses'] },
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
  train: {
    furniture: [
      { type: 'trainseat', x: 640, y: 690, s: 1.45, color: '#3E6E8E', core: true, people: true },
      { type: 'trainseat', x: 520, y: 704, s: 1.45, color: '#3E6E8E', core: true, people: true },
      { type: 'luggage', x: 440, y: 790, s: 1.1, color: '#8A4A3C', always: true },
    ],
    people: [
      { x: 520, y: 704, s: 1.45, core: true, skin: 1, hair: ['long', '#15101A'], top: ['sweater', '#C9708F'], legs: '#2C2E5E', hold: 'book', extras: ['headphones:#F4ECFF'], studier: true },
      { x: 640, y: 690, s: 1.4, core: true, skin: 3, hair: ['short', '#2A1E1E'], top: ['hoodie', '#6E4C8E'], legs: '#3B3F78', hold: 'mug', dozer: true },
      { x: 722, y: 696, s: 1.45, pose: 'stand', skin: 0, hair: ['short', '#B0603A'], top: ['uniform', '#2E3A6E'], legs: '#2E3A6E', extras: ['cap:#2E3A6E'], hold: 'ticket', shoes: '#15132B' },
    ],
  },
};

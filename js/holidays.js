// The holiday calendar: which decorations show on a given date.
// Several holidays can be on at once (for example Hanukkah and Christmas in December).

export const HOLIDAYS = {
  newyear: 'New Year',
  lunar: 'Lunar New Year',
  valentine: 'Valentine’s Day',
  stpatricks: 'St. Patrick’s Day',
  easter: 'Easter',
  july4: 'Fourth of July',
  halloween: 'Halloween',
  diwali: 'Diwali',
  thanksgiving: 'Thanksgiving',
  hanukkah: 'Hanukkah',
  winter: 'Christmas & winter',
};

// Holidays that follow the moon move every year, so their dates are listed here.
// Add more years as they come up. [month, day]
const LUNAR_NEW_YEAR = { 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3] };
const DIWALI = { 2026: [11, 8], 2027: [10, 29], 2028: [10, 17], 2029: [11, 5], 2030: [10, 26] };
const HANUKKAH_FIRST_NIGHT = { 2026: [12, 4], 2027: [12, 24], 2028: [12, 12], 2029: [12, 1], 2030: [12, 20] };

// Which hat the listener wears for each holiday.
export const HAT_FOR = {
  winter: 'santa', halloween: 'witch', valentine: 'hearts', newyear: 'party', july4: 'party', lunar: 'party',
  diwali: 'flower', stpatricks: 'leprechaun', easter: 'bunny', thanksgiving: 'beanie', hanukkah: 'beanie',
};

const dayNumber = (y, m, d) => Date.UTC(y, m - 1, d) / 86400000;
const today = (date) => dayNumber(date.getFullYear(), date.getMonth() + 1, date.getDate());

// Easter Sunday (Gregorian calendar).
function easter(y) {
  const a = y % 19; const b = Math.floor(y / 100); const c = y % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return [month, ((h + l - 7 * m + 114) % 31) + 1];
}

// US Thanksgiving: the fourth Thursday of November.
function thanksgiving(y) {
  const first = new Date(y, 10, 1).getDay();
  return [11, 1 + ((4 - first + 7) % 7) + 21];
}

// Days from `date` to a fixed day (negative if it has passed).
function offset(date, y, [m, d]) {
  return dayNumber(y, m, d) - today(date);
}

// True if `date` is between `before` days ahead of and `after` days past a holiday.
function near(date, y, md, before, after) {
  if (!md) return false;
  const diff = offset(date, y, md);
  return diff <= before && -diff <= after;
}

/** Hanukkah night (1-8) on this date, or 0. */
export function hanukkahNight(date) {
  const y = date.getFullYear();
  for (const year of [y, y - 1]) {
    const start = HANUKKAH_FIRST_NIGHT[year];
    if (!start) continue;
    const night = today(date) - dayNumber(year, ...start) + 1;
    if (night >= 1 && night <= 8) return night;
  }
  return 0;
}

/** All holidays showing on this date, limited to the ones the visitor celebrates. */
export function holidaysForDate(date, celebrate = Object.keys(HOLIDAYS)) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const on = [];
  if ((m === 12 && d === 31) || (m === 1 && d === 1)) on.push('newyear');
  if (near(date, y, LUNAR_NEW_YEAR[y], 1, 6)) on.push('lunar');
  if (m === 2 && d >= 7 && d <= 14) on.push('valentine');
  if (m === 3 && d >= 14 && d <= 17) on.push('stpatricks');
  if (near(date, y, easter(y), 6, 1)) on.push('easter');
  if (m === 7 && d <= 4) on.push('july4');
  if (m === 10) on.push('halloween');
  if (near(date, y, DIWALI[y], 2, 2)) on.push('diwali');
  if (near(date, y, thanksgiving(y), 3, 3)) on.push('thanksgiving');
  if (hanukkahNight(date)) on.push('hanukkah');
  if (m === 12 && d <= 30) on.push('winter');
  return on.filter((h) => celebrate.includes(h));
}

/** The next holiday that isn't on today: { key, days }, or null. */
export function nextHoliday(date, celebrate) {
  const now = new Set(holidaysForDate(date, celebrate));
  for (let i = 1; i <= 370; i++) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i);
    const found = holidaysForDate(day, celebrate).find((h) => !now.has(h));
    if (found) return { key: found, days: i };
  }
  return null;
}

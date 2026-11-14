// The radio: live lofi streams that play on the TV whenever no record is on.
// They play through the same official YouTube player, which stays visible on the TV.
// To swap a station, change its 11-character YouTube id (the part after "watch?v=").
// These ids couldn't be checked from the build machine; a station that won't play is
// skipped automatically.

export const STATIONS = [
  { key: 'lofi', id: 'jfKfPfyJRdk', name: 'lofi hip hop radio', by: 'Lofi Girl', label: 'Lofi hip hop' },
  { key: 'sleep', id: 'rUxyKA_-grg', name: 'beats to sleep/chill to', by: 'Lofi Girl', label: 'Sleep & chill' },
  { key: 'synthwave', id: '4xDzrJKXOOY', name: 'synthwave radio', by: 'Lofi Girl', label: 'Synthwave' },
  { key: 'jazzy', id: '5yx6BWlEVcY', name: 'jazzy & lofi hip hop radio', by: 'Chillhop Music', label: 'Jazzy lofi' },
];

export const stationFor = (key) => STATIONS.find((s) => s.key === key) || STATIONS[0];

export function nextStation(key) {
  const i = STATIONS.findIndex((s) => s.key === key);
  return STATIONS[(i + 1) % STATIONS.length];
}

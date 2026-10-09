export const DEFAULT_GRID_SOUNDS = ['kick', 'hihat', 'snare', 'kick', 'hihat', 'snare'];

export function gridCellAt(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x >= 1 || point.y >= 0.5) return -1;
  // A narrow seam prevents jitter at a shared border from retriggering two pads.
  const x = point.x * 6, y = point.y * 2;
  if (x % 1 < 0.025 || x % 1 > 0.975 || y % 1 < 0.025 || y % 1 > 0.975) return -1;
  return Math.floor(x);
}

export class FixedGridTouch {
  constructor() { this.reset(); }
  reset() { this.tracks = new Map(); }
  update(key, point, now) {
    const cell = gridCellAt(point);
    if (cell < 0) { this.tracks.delete(key); return -1; }
    let track = this.tracks.get(key);
    if (!track || track.cell !== cell) {
      track = { cell, since: now, fired: false };
      this.tracks.set(key, track);
    }
    if (track.fired || now - track.since < 30) return -1;
    track.fired = true;
    return cell;
  }
}

export const MELODY_NOTES = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5'];
export function quantizedMelodyIndex(point, previous = -1) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0.52 || point.y > 1) return -1;
  const position = point.x * MELODY_NOTES.length;
  if (previous >= 0 && position >= previous - 0.12 && position < previous + 1.12) return previous;
  return Math.min(MELODY_NOTES.length - 1, Math.floor(position));
}

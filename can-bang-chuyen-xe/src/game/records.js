// Bản ghi các ván đã chơi xong và kết quả tốt nhất.
import { ROUNDS } from './events.js';
import { isAllGreen } from './simulate.js';
import { MAX_COMMISSION, MIN_COMMISSION } from './state.js';

export const MAX_GAMES = 50;

const PARTY_KEYS = ['D', 'P', 'K', 'X'];
const dayTotal = (scores) => PARTY_KEYS.reduce((sum, key) => sum + scores[key], 0);

export function buildRecord(history, finishedAt) {
  const days = history.map(({ commission, floor, dialogue, scores, allGreen }) => ({
    commission, floor, dialogue, scores: { ...scores }, allGreen,
  }));
  return {
    id: finishedAt.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    finishedAt: finishedAt.toISOString(),
    wins: days.filter((d) => d.allGreen).length,
    total: days.reduce((sum, d) => sum + dayTotal(d.scores), 0),
    days,
  };
}

// a tốt hơn b khi có nhiều ngày cả bốn bên Ổn hơn; bằng nhau thì tổng điểm cao hơn.
export function isBetter(a, b) {
  if (!b) return true;
  if (a.wins !== b.wins) return a.wins > b.wins;
  return a.total > b.total;
}

export function addRecord(data, record) {
  return {
    ...data,
    games: [record, ...data.games].slice(0, MAX_GAMES),
    best: isBetter(record, data.best) ? record : data.best,
  };
}

const isScore = (v) => Number.isInteger(v) && v >= 0 && v <= 100;

function isValidDay(d) {
  return d !== null && typeof d === 'object'
    && Number.isInteger(d.commission) && d.commission >= MIN_COMMISSION && d.commission <= MAX_COMMISSION
    && typeof d.floor === 'boolean' && typeof d.dialogue === 'boolean'
    && d.scores !== null && typeof d.scores === 'object' && PARTY_KEYS.every((key) => isScore(d.scores[key]))
    && d.allGreen === isAllGreen(d.scores);
}

export function isValidRecord(r) {
  return r !== null && typeof r === 'object'
    && typeof r.id === 'string' && r.id.length > 0
    && typeof r.finishedAt === 'string' && !Number.isNaN(Date.parse(r.finishedAt))
    && Array.isArray(r.days) && r.days.length === ROUNDS && r.days.every(isValidDay)
    && r.wins === r.days.filter((d) => d.allGreen).length
    && r.total === r.days.reduce((sum, d) => sum + dayTotal(d.scores), 0);
}

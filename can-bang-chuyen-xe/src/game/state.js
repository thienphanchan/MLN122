// Trạng thái game và các bước chuyển. Mọi hàm đều thuần: nhận state, trả state mới,
// trả nguyên state cũ khi bước đó không hợp lệ (ví dụ đổi lựa chọn sau khi đã chốt).
import { ROUNDS } from './events.js';
import { explain, isAllGreen, simulate } from './simulate.js';

export const MIN_COMMISSION = 15;
export const MAX_COMMISSION = 40;
export const DEFAULT_COMMISSION = 25;

const SCREENS = ['intro', 'play', 'end'];

export function createInitialState() {
  return {
    screen: 'intro',
    round: 1,
    commission: DEFAULT_COMMISSION,
    floor: false,
    dialogue: false,
    result: null,
    history: [],
  };
}

export function start(s) {
  return { ...s, screen: 'play', round: 1, result: null, history: [] };
}

const canDecide = (s) => s.screen === 'play' && !s.result;

export function setCommission(s, value) {
  if (!canDecide(s)) return s;
  if (typeof value === 'string' && value.trim() === '') return s;
  const n = Number(value);
  if (!Number.isFinite(n)) return s;
  const commission = Math.min(MAX_COMMISSION, Math.max(MIN_COMMISSION, Math.round(n)));
  return { ...s, commission };
}

export function toggleFloor(s) {
  return canDecide(s) ? { ...s, floor: !s.floor } : s;
}

export function toggleDialogue(s) {
  return canDecide(s) ? { ...s, dialogue: !s.dialogue } : s;
}

export function confirm(s) {
  if (!canDecide(s)) return s;
  const { round, commission, floor, dialogue } = s;
  const scores = simulate(round, commission, floor, dialogue);
  const allGreen = isAllGreen(scores);
  const result = { ...scores, allGreen };
  result.explain = explain(round, commission, floor, dialogue, result);
  const { D, P, K, X } = scores;
  const day = { commission, floor, dialogue, scores: { D, P, K, X }, allGreen };
  return { ...s, result, history: [...s.history, day] };
}

export function next(s) {
  if (s.screen !== 'play' || !s.result) return s;
  if (s.round >= ROUNDS) return { ...s, screen: 'end' };
  return { ...s, round: s.round + 1, result: null };
}

export function restart() {
  return createInitialState();
}

// Tổng kết cuối ván: số ngày cả bốn bên Ổn, các điều rút ra và tiêu đề (chữ nguyên bản gốc).
export function summarize(history) {
  const wins = history.filter((h) => h.allGreen).length;
  const insights = [];
  if (history.some((h) => h.commission >= 32)) insights.push('Bạn đã thử chiết khấu cao: tài xế rời app, và lợi nhuận nền tảng giảm theo. Đó là mặt thống nhất của lợi ích.');
  if (history.some((h) => h.commission <= 17)) insights.push('Bạn đã thử chiết khấu rất thấp: nền tảng không trụ được. Hy sinh hẳn một bên không phải lời giải.');
  if (history.some((h, i) => i > 0 && !h.floor && !h.dialogue && !h.allGreen)) insights.push('Có ngày bạn để thị trường tự chạy giữa biến cố và một bên “đỏ”. Đó là lý do cần chính sách của Nhà nước.');
  if (history.some((h, i) => i === 3 && h.dialogue)) insights.push('Ngày tài xế kêu gọi tắt app, bạn chọn đối thoại: mâu thuẫn không đối kháng được giải quyết bằng đối thoại và pháp luật.');
  const endTitle = wins === 5
    ? 'Tuyệt vời! Bạn hài hòa được lợi ích cả 5 ngày.'
    : (wins >= 3 ? 'Khá lắm: ' + wins + '/5 ngày cả bốn bên cùng ổn.' : 'Chỉ ' + wins + '/5 ngày cả bốn bên cùng ổn.');
  const endSub = wins === 5
    ? 'Bạn đã kết hợp thị trường, chính sách và đối thoại đúng lúc.'
    : 'Cân bằng lợi ích khó hơn tưởng: mỗi lựa chọn có bên được, bên mất.';
  return { wins, insights, endTitle, endSub };
}

// Dạng lưu: chỉ các quyết định. Điểm luôn được tính lại khi khôi phục.
export function toSaved(s) {
  return {
    screen: s.screen,
    round: s.round,
    commission: s.commission,
    floor: s.floor,
    dialogue: s.dialogue,
    locked: s.result !== null,
    days: s.history.map(({ commission, floor, dialogue }) => ({ commission, floor, dialogue })),
  };
}

const isCommission = (v) => Number.isInteger(v) && v >= MIN_COMMISSION && v <= MAX_COMMISSION;
const isDay = (d) => d !== null && typeof d === 'object'
  && isCommission(d.commission) && typeof d.floor === 'boolean' && typeof d.dialogue === 'boolean';

function isSavedShape(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    && SCREENS.includes(v.screen)
    && Number.isInteger(v.round) && v.round >= 1 && v.round <= ROUNDS
    && isCommission(v.commission)
    && typeof v.floor === 'boolean' && typeof v.dialogue === 'boolean' && typeof v.locked === 'boolean'
    && Array.isArray(v.days) && v.days.every(isDay);
}

// Dựng lại state từ dữ liệu đã lưu bằng cách chơi lại từng ngày; trả null nếu dữ liệu không nhất quán.
export function restoreState(saved) {
  if (!isSavedShape(saved)) return null;
  const { screen, round, commission, floor, dialogue, locked, days } = saved;

  if (screen === 'intro') {
    if (round !== 1 || locked || days.length > 0) return null;
    return { ...createInitialState(), commission, floor, dialogue };
  }

  const finished = screen === 'end';
  const expectedDays = locked ? round : round - 1;
  if (days.length !== expectedDays) return null;
  if (finished && (round !== ROUNDS || !locked)) return null;

  let s = start(createInitialState());
  days.forEach((d, i) => {
    s = confirm({ ...s, commission: d.commission, floor: d.floor, dialogue: d.dialogue });
    if (i < days.length - 1 || !locked) s = next(s);
  });
  if (finished) return next(s);
  if (!locked) s = { ...s, commission, floor, dialogue };
  return s;
}

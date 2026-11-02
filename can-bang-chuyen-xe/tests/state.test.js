import { describe, expect, test } from 'vitest';
import { explain, isAllGreen, simulate } from '../src/game/simulate.js';
import {
  DEFAULT_COMMISSION,
  MAX_COMMISSION,
  MIN_COMMISSION,
  confirm,
  createInitialState,
  next,
  restart,
  restoreState,
  setCommission,
  start,
  summarize,
  toSaved,
  toggleDialogue,
  toggleFloor,
} from '../src/game/state.js';

// Chơi một ngày với các lựa chọn cho trước rồi chốt.
function playDay(s, commission, floor, dialogue) {
  let t = setCommission(s, commission);
  if (t.floor !== floor) t = toggleFloor(t);
  if (t.dialogue !== dialogue) t = toggleDialogue(t);
  return confirm(t);
}

// Chơi trọn các ngày; mỗi ngày là [commission, floor, dialogue].
function playDays(days) {
  let s = start(createInitialState());
  days.forEach(([c, f, d], i) => {
    s = playDay(s, c, f, d);
    if (i < days.length - 1) s = next(s);
  });
  return s;
}

const GOOD_GAME = [[20, false, false], [22, true, true], [22, false, true], [22, true, true], [16, true, true]];

describe('initial state and start', () => {
  test('starts on the intro screen with the original defaults', () => {
    expect(createInitialState()).toEqual({
      screen: 'intro', round: 1, commission: 25, floor: false, dialogue: false, result: null, history: [],
    });
    expect([MIN_COMMISSION, MAX_COMMISSION, DEFAULT_COMMISSION]).toEqual([15, 40, 25]);
  });

  test('start opens day 1 and keeps the chosen commission and policies', () => {
    const s = start({ ...createInitialState(), commission: 30, floor: true });
    expect(s).toMatchObject({ screen: 'play', round: 1, commission: 30, floor: true, result: null, history: [] });
  });
});

describe('decisions before confirming', () => {
  const play = start(createInitialState());

  test('setCommission clamps to a whole number between 15 and 40', () => {
    expect(setCommission(play, '30').commission).toBe(30);
    expect(setCommission(play, 14.6).commission).toBe(15);
    expect(setCommission(play, 99).commission).toBe(40);
    expect(setCommission(play, 22.4).commission).toBe(22);
  });

  test('setCommission ignores values that are not numbers', () => {
    expect(setCommission(play, 'abc').commission).toBe(25);
    expect(setCommission(play, '').commission).toBe(25);
  });

  test('toggles flip each policy', () => {
    expect(toggleFloor(play).floor).toBe(true);
    expect(toggleDialogue(play).dialogue).toBe(true);
    expect(toggleFloor(toggleFloor(play)).floor).toBe(false);
  });

  test('does not change the state it was given', () => {
    const before = JSON.stringify(play);
    setCommission(play, 33);
    toggleFloor(play);
    confirm(play);
    expect(JSON.stringify(play)).toBe(before);
  });
});

describe('confirm', () => {
  test('locks the day with the simulated result and records it in history', () => {
    const s = playDay(start(createInitialState()), 22, true, false);
    const scores = simulate(1, 22, true, false);
    const allGreen = isAllGreen(scores);
    expect(s.result).toEqual({ ...scores, allGreen, explain: explain(1, 22, true, false, { ...scores, allGreen }) });
    expect(s.result).toMatchObject({ D: 76, P: 57, K: 72, X: 74, allGreen: true });
    expect(s.history).toEqual([
      { commission: 22, floor: true, dialogue: false, scores: { D: 76, P: 57, K: 72, X: 74 }, allGreen: true },
    ]);
  });

  test('a second confirm on the same day changes nothing', () => {
    const s = playDay(start(createInitialState()), 22, true, false);
    expect(confirm(s)).toBe(s);
  });

  test('decisions are locked once the day is confirmed', () => {
    const s = playDay(start(createInitialState()), 22, true, false);
    expect(setCommission(s, 35)).toBe(s);
    expect(toggleFloor(s)).toBe(s);
    expect(toggleDialogue(s)).toBe(s);
  });

  test('cannot confirm outside the play screen', () => {
    const intro = createInitialState();
    expect(confirm(intro)).toBe(intro);
  });
});

describe('next', () => {
  test('does nothing before the day is confirmed', () => {
    const s = start(createInitialState());
    expect(next(s)).toBe(s);
  });

  test('moves to the next day and keeps the decisions as a starting point', () => {
    const s = next(playDay(start(createInitialState()), 33, true, true));
    expect(s).toMatchObject({ screen: 'play', round: 2, result: null, commission: 33, floor: true, dialogue: true });
    expect(s.history).toHaveLength(1);
  });

  test('after day 5 it opens the summary, and the summary does not advance', () => {
    const end = next(playDays(GOOD_GAME));
    expect(end.screen).toBe('end');
    expect(end.history).toHaveLength(5);
    expect(next(end)).toBe(end);
  });
});

describe('restart', () => {
  test('returns to a fresh intro', () => {
    expect(restart()).toEqual(createInitialState());
  });
});

describe('summarize', () => {
  test('five good days earn the top title', () => {
    const { wins, endTitle, endSub } = summarize(next(playDays(GOOD_GAME)).history);
    expect(wins).toBe(5);
    expect(endTitle).toBe('Tuyệt vời! Bạn hài hòa được lợi ích cả 5 ngày.');
    expect(endSub).toBe('Bạn đã kết hợp thị trường, chính sách và đối thoại đúng lúc.');
  });

  test('three and one good days use the original wording', () => {
    const three = playDays([[20, false, false], [22, true, true], [22, false, true], [35, false, false], [35, false, false]]).history;
    expect(summarize(three).wins).toBe(3);
    expect(summarize(three).endTitle).toBe('Khá lắm: 3/5 ngày cả bốn bên cùng ổn.');
    expect(summarize(three).endSub).toBe('Cân bằng lợi ích khó hơn tưởng: mỗi lựa chọn có bên được, bên mất.');
    const one = playDays([[20, false, false], [35, false, false], [35, false, false], [35, false, false], [35, false, false]]).history;
    expect(summarize(one).endTitle).toBe('Chỉ 1/5 ngày cả bốn bên cùng ổn.');
  });

  test('insights follow the original conditions and order', () => {
    const history = playDays([[16, false, false], [33, false, false], [22, true, true], [22, false, true], [22, true, true]]).history;
    expect(summarize(history).insights).toEqual([
      'Bạn đã thử chiết khấu cao: trong mô phỏng, giảm phần tài xế giữ lại có thể làm nguồn cung và lợi nhuận nền tảng suy giảm. Đây là sự phụ thuộc giữa lợi ích các bên.',
      'Bạn đã thử chiết khấu rất thấp: cần kiểm tra nguồn thu nền tảng cùng với thu nhập tài xế. Không thể chỉ xét lợi ích của một bên.',
      'Có ngày bạn chưa áp dụng chính sách hỗ trợ trước biến cố và một bên bị thiệt. Điều này cho thấy cần kết hợp cơ chế thị trường với chính sách và sự tham gia của các bên liên quan.',
      'Ngày tài xế kêu gọi tắt app, bạn chọn đối thoại: các bên cùng thương lượng để xử lý xung đột về thu nhập và phân chia lợi ích.',
    ]);
  });

  test('a policy-free bad day 1 alone does not trigger the market insight', () => {
    const history = playDays([[40, false, false], [22, true, true]]).history;
    expect(history[0].allGreen).toBe(false);
    expect(summarize(history).insights).toEqual([
      'Bạn đã thử chiết khấu cao: trong mô phỏng, giảm phần tài xế giữ lại có thể làm nguồn cung và lợi nhuận nền tảng suy giảm. Đây là sự phụ thuộc giữa lợi ích các bên.',
    ]);
  });
});

describe('toSaved and restoreState', () => {
  test('restores a day in progress that is not confirmed yet', () => {
    const s = setCommission(toggleFloor(next(playDays([[20, false, false], [22, true, true]]))), 28);
    expect(s).toMatchObject({ round: 3, result: null, commission: 28, floor: false });
    expect(restoreState(toSaved(s))).toEqual(s);
  });

  test('restores a confirmed, locked day with its result', () => {
    const s = playDays([[20, false, false], [22, true, true], [30, true, false]]);
    const restored = restoreState(toSaved(s));
    expect(restored).toEqual(s);
    expect(restored.result).not.toBeNull();
  });

  test('restores the summary screen', () => {
    const s = next(playDays(GOOD_GAME));
    expect(restoreState(toSaved(s))).toEqual(s);
  });

  test('restores the intro with its starting choices', () => {
    const s = { ...createInitialState(), commission: 31, dialogue: true };
    expect(restoreState(toSaved(s))).toEqual(s);
  });

  test('saves decisions only, never scores', () => {
    const saved = toSaved(playDays([[20, false, false]]));
    expect(saved).toEqual({
      screen: 'play', round: 1, commission: 20, floor: false, dialogue: false, locked: true,
      days: [{ commission: 20, floor: false, dialogue: false }],
    });
  });

  test('recomputes scores instead of trusting saved ones', () => {
    const saved = toSaved(playDays([[20, false, false]]));
    saved.days[0].scores = { D: 100, P: 100, K: 100, X: 100 };
    saved.result = { D: 0, P: 0, K: 0, X: 0 };
    expect(restoreState(saved).history[0].scores).toEqual({ D: 70, P: 52, K: 72, X: 59 });
  });

  test('rejects saved data that is broken or tampered with', () => {
    const good = toSaved(playDays([[20, false, false], [22, true, true]]));
    const broken = [
      null,
      'x',
      [],
      { ...good, screen: 'boss' },
      { ...good, round: 9 },
      { ...good, round: 1.5 },
      { ...good, commission: 99 },
      { ...good, floor: 'yes' },
      { ...good, locked: 'no' },
      { ...good, days: 'many' },
      { ...good, days: [...good.days, { commission: 22, floor: true, dialogue: true }] },
      { ...good, days: [{ commission: 50, floor: false, dialogue: false }, good.days[1]] },
      { ...good, days: [null, good.days[1]] },
      { ...good, screen: 'end' },
      { ...good, screen: 'intro' },
    ];
    for (const saved of broken) {
      expect(restoreState(saved), JSON.stringify(saved)).toBeNull();
    }
  });
});

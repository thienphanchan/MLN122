import { describe, expect, test } from 'vitest';
import { getDayFeedback } from '../src/game/feedback.js';
import { simulate } from '../src/game/simulate.js';
import { confirm, createInitialState, restoreState, start, toSaved } from '../src/game/state.js';
import { DISCUSSION_ANSWERS } from '../src/game/discussion.js';
import { MODEL_NOTE, TEACHING_NOTES, TEACHING_SOURCES } from '../src/game/teaching.js';

const KEYS = ['D', 'P', 'K', 'X'];
const CASES = ['ok', 'D', 'P', 'K', 'X', 'DP', 'DK', 'DX', 'PK', 'PX', 'KX', 'DPK', 'DPX', 'DKX', 'PKX', 'DPKX'];

describe('daily teaching feedback', () => {
  test('has a distinct message, reason and solution for all 16 combinations', () => {
    const feedbacks = CASES.map((key) => {
      const result = Object.fromEntries(KEYS.map((party) => [party, key.includes(party) ? 49 : 50]));
      const feedback = getDayFeedback({ round: 1, floor: false, dialogue: false, result });
      expect(feedback.key).toBe(key);
      for (const field of ['title', 'message', 'reason', 'solution', 'context']) {
        expect(feedback[field].trim().length, `${key}.${field}`).toBeGreaterThan(15);
      }
      expect(feedback.theory.text.length, key).toBeGreaterThan(30);
      expect(feedback.theory.sourceIds.length, key).toBeGreaterThan(0);
      for (const id of feedback.theory.sourceIds) {
        expect(TEACHING_SOURCES[id]?.url, `${key}: ${id}`).toMatch(/^https:\/\//);
        expect(TEACHING_SOURCES[id]?.locator.length, `${key}: ${id}`).toBeGreaterThan(10);
      }
      return feedback;
    });
    for (const field of ['message', 'reason', 'solution']) {
      expect(new Set(feedbacks.map((feedback) => feedback[field])).size).toBe(16);
    }
  });

  test('classifies all 520 playable decisions from their scores without changing them', () => {
    for (let round = 1; round <= 5; round++) {
      for (let commission = 15; commission <= 40; commission++) {
        for (const floor of [false, true]) for (const dialogue of [false, true]) {
          const result = simulate(round, commission, floor, dialogue);
          const before = { ...result };
          const feedback = getDayFeedback({ round, commission, floor, dialogue, result });
          expect(feedback.key).toBe(KEYS.filter((key) => result[key] < 50).join('') || 'ok');
          expect(result).toEqual(before);
        }
      }
    }
  });

  test('platform and customer feedback names both affected parties', () => {
    const feedback = getDayFeedback({ round: 3, result: { D: 60, P: 49, K: 49, X: 60 } });
    expect(feedback.key).toBe('PK');
    expect(feedback.message).toMatch(/nền tảng/i);
    expect(feedback.message).toMatch(/khách hàng/i);
  });

  test('explains fuel costs, competition and waiting from the current event', () => {
    const base = { result: { D: 52, P: 50, K: 49, X: 56 } };
    expect(getDayFeedback({ ...base, round: 2, floor: false }).context).toContain('Xăng tăng');
    expect(getDayFeedback({ ...base, round: 2, floor: true }).context).toContain('Sàn thu nhập đang');
    expect(getDayFeedback({ ...base, round: 3 }).context).toContain('Đối thủ');
    expect(getDayFeedback({ ...base, round: 5 }).context).toContain('chờ xe');
    expect(getDayFeedback({ ...base, round: 5, result: { ...base.result, D: 55 } }).context).toContain('Nhu cầu giờ cao điểm tăng');
  });

  test('distinguishes dialogue, tension and the actual mass log-off on day 4', () => {
    const state = { round: 4, result: { D: 60, P: 50, K: 60, X: 60, strike: false } };
    expect(getDayFeedback({ ...state, dialogue: true }).context).toContain('Đối thoại đang');
    expect(getDayFeedback({ ...state, dialogue: false }).context).toContain('chưa kích hoạt');
    expect(getDayFeedback({ ...state, dialogue: false, result: { ...state.result, strike: true } }).context).toContain('tắt app hàng loạt');
  });

  test('restoring a locked game produces the same feedback', () => {
    const state = confirm(start(createInitialState()));
    expect(getDayFeedback(restoreState(toSaved(state)))).toEqual(getDayFeedback(state));
  });

  test('all five discussion answers have a traceable theoretical basis', () => {
    expect(DISCUSSION_ANSWERS).toHaveLength(5);
    for (const answer of DISCUSSION_ANSWERS) {
      const note = TEACHING_NOTES[answer.concept];
      expect(note.sourceIds.length).toBeGreaterThan(0);
      for (const id of note.sourceIds) expect(TEACHING_SOURCES[id]).toBeDefined();
    }
  });

  test('does not classify a conflict from a log-off or mutual dependence alone', () => {
    const answer = DISCUSSION_ANSWERS[3];
    expect(answer.text).toContain('Chưa đủ căn cứ');
    expect(answer.text).toContain('lợi ích cơ bản');
    expect(answer.text).not.toContain('đây là mâu thuẫn không đối kháng');
    expect(TEACHING_NOTES[answer.concept].sourceIds).toContain('philosophy');
    expect(MODEL_NOTE).toContain('không phải tiêu chuẩn trong giáo trình');
  });
});

import { useEffect, useRef } from 'react';
import { EVENTS, ROUNDS } from '../game/events.js';
import { DISCUSSION_ANSWERS } from '../game/discussion.js';
import { getDayFeedback } from '../game/feedback.js';
import { TEACHING_NOTES } from '../game/teaching.js';
import { OK_THRESHOLD, simulate } from '../game/simulate.js';
import { MAX_COMMISSION, MIN_COMMISSION } from '../game/state.js';
import { DayMarks } from './DayMarks.jsx';
import { DayFeedback } from './DayFeedback.jsx';
import { Icon } from './Icon.jsx';
import { SourceLinks } from './TeachingNote.jsx';
import { PARTIES, STATUS_DANGER, STATUS_OK } from './parties.js';
import { prefersReducedMotion } from './useHash.js';

const STATUS_TEXT = { ok: STATUS_OK, danger: STATUS_DANGER };

function Metric({ party, value, index, previous }) {
  const kind = value >= OK_THRESHOLD ? 'ok' : 'danger';
  const delta = previous === undefined ? null : value - previous;
  return (
    <li className={`metric metric--${party.cls}`} data-metric={party.key} style={{ '--i': index }}>
      <div className="metric-head">
        <span className="metric-name">
          <Icon name={party.icon} size={22} className="metric-icon" />
          <span className="metric-label">{party.label}</span>
        </span>
        <span className="metric-score">
          <span className="metric-value" data-value="">{value}</span>
          <span className={`status status--${kind}`} data-status="">{STATUS_TEXT[kind]}</span>
        </span>
      </div>
      <div className="bar" aria-hidden="true">
        <span className="bar-fill" style={{ '--v': value / 100 }} />
        <span className="bar-threshold" />
      </div>
      {delta !== null && <p className="metric-change">{delta > 0 ? '+' : ''}{delta} điểm so với ngày trước</p>}
    </li>
  );
}

function Toggle({ id, title, sub, on, disabled, onClick }) {
  return (
    <button type="button" id={id} className="toggle" aria-pressed={on} disabled={disabled} onClick={onClick}>
      <span className="switch" aria-hidden="true"><span className="switch-knob" /></span>
      <span className="toggle-text">
        <span className="toggle-title">{title}</span>
        <span className="toggle-sub">{sub}</span>
      </span>
      <span className="toggle-state" aria-hidden="true">{on ? 'Đang bật' : 'Tắt'}</span>
    </button>
  );
}

// Màn chơi của một ngày. App gắn key theo ngày nên mỗi ngày mới là một lần dựng mới
// (chạy hiệu ứng chuyển ngày, đặt lại các ref).
export function Play({ game, actions, announce }) {
  const { round, commission, floor, dialogue, result, history } = game;
  const event = EVENTS[round - 1];
  const answer = DISCUSSION_ANSWERS[round - 1];
  const locked = result !== null;
  const scores = result ?? simulate(round, commission, floor, dialogue);
  const previous = history[round - 2]?.scores;
  const feedback = locked ? getDayFeedback(game) : null;
  const feedbackMessage = feedback?.message;
  const resultsTitleRef = useRef(null);
  const resultsRef = useRef(null);
  const wasLocked = useRef(locked);

  // Vừa chốt: đưa focus tới kết quả để đọc điểm, thông điệp và thảo luận trước khi sang ngày.
  useEffect(() => {
    if (locked && !wasLocked.current) {
      resultsTitleRef.current?.focus({ preventScroll: true });
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      resultsRef.current?.scrollIntoView({ behavior, block: 'start' });
      const scores = PARTIES.map((p) => `${p.label} ${result[p.key]}`).join(', ');
      announce(`Ngày ${round}: ${result.allGreen ? 'Cả bốn bên cùng ổn' : 'Có bên đang bị thiệt'}. ${scores}. ${feedbackMessage}`);
    }
    wasLocked.current = locked;
  }, [locked, result, round, announce, feedbackMessage]);

  return (
    <div className="play">
      <div className="play-head">
        <h1 id="screen-title" className="play-title" tabIndex={-1}>Ngày {round}/{ROUNDS}</h1>
        <ol className="progress" aria-label="Tiến độ 5 ngày">
          <DayMarks history={history} currentRound={round} />
        </ol>
      </div>

      <div className="play-grid">
        <section className="event" aria-labelledby="event-title">
          <Icon name="event" size={32} className="event-icon" />
          <div className="event-body">
            <h2 id="event-title" className="event-title">
              <span className="visually-hidden">Biến cố hôm nay: </span>{event.title}
            </h2>
            <p className="event-desc">{event.desc}</p>
          </div>
        </section>

        <section className="decide" aria-label="Quyết định của bạn">
          <div className="field">
            <div className="field-head">
              <label htmlFor="commission" className="field-label">Mức chiết khấu của nền tảng</label>
              <output className="commission-value" htmlFor="commission" aria-hidden="true">{commission}%</output>
            </div>
            <input
              id="commission"
              className="range"
              type="range"
              min={MIN_COMMISSION}
              max={MAX_COMMISSION}
              step={1}
              value={commission}
              disabled={locked}
              aria-valuetext={`${commission}%`}
              aria-describedby="commission-scale"
              onChange={(e) => actions.setCommission(e.target.value)}
            />
            <div id="commission-scale" className="range-scale">
              <span><strong>15%</strong><span>tài xế giữ nhiều</span></span>
              <span><strong>40%</strong><span>nền tảng giữ nhiều</span></span>
            </div>
          </div>

          <div className="field" role="group" aria-labelledby="policy-title">
            <h2 id="policy-title" className="field-label">Chính sách của Nhà nước và xã hội</h2>
            <Toggle
              id="toggle-floor"
              title="Sàn thu nhập + bảo hiểm tai nạn"
              sub="Bảo vệ tài xế, nền tảng tốn thêm chi phí"
              on={floor}
              disabled={locked}
              onClick={actions.toggleFloor}
            />
            <Toggle
              id="toggle-dialogue"
              title="Đối thoại ba bên định kỳ"
              sub="Nền tảng – tài xế – cơ quan quản lý"
              on={dialogue}
              disabled={locked}
              onClick={actions.toggleDialogue}
            />
          </div>

          {locked ? (
            <p className="locked-note">
              <Icon name="check" size={20} />
              <span>Đã chốt quyết định ngày {round}.</span>
            </p>
          ) : (
            <button type="button" className="btn btn--primary btn--large btn--block" onClick={actions.confirm}>
              Chốt quyết định
            </button>
          )}
        </section>

        <section className="results" aria-labelledby="results-title" ref={resultsRef}>
          <div className="results-body">
            <div className="results-head">
              <h2 id="results-title" className="results-title" ref={resultsTitleRef} tabIndex={-1}>Bốn thanh lợi ích</h2>
              <p className="results-hint">{locked ? 'Đã chốt' : 'Dự tính hôm nay'} · Từ 50 trở lên là ổn</p>
            </div>
            {!locked && (
              <p className="results-waiting">
                {round > 1
                  ? 'Biến cố mới đã tác động lên phương án hôm trước. Điều chỉnh để cân bằng bốn bên, rồi chốt.'
                  : 'Điều chỉnh chiết khấu và chính sách để xem các thanh thay đổi, rồi chốt quyết định.'}
              </p>
            )}
            <ul className="metrics" aria-label={locked ? 'Điểm lợi ích của bốn bên' : 'Điểm lợi ích dự tính của bốn bên'}>
              {PARTIES.map((p, i) => (
                <Metric key={p.key} party={p} value={scores[p.key]} previous={previous?.[p.key]} index={i} />
              ))}
            </ul>
          </div>
        </section>

        {locked && <DayFeedback round={round} feedback={feedback} />}

        {locked && (
          <section className="ask" aria-label="Câu hỏi cho lớp">
            <Icon name="question" size={30} className="ask-icon" />
            <div className="ask-body">
              <p className="ask-question">Hỏi cả lớp: {event.question}</p>
              <details className="answer">
                <summary>Xem đáp án gợi ý</summary>
                <div className="answer-body">
                  <p>{answer.text}</p>
                  <p><strong>Liên hệ bài học: </strong>{answer.lesson}</p>
                  <SourceLinks sourceIds={TEACHING_NOTES[answer.concept].sourceIds} />
                </div>
              </details>
            </div>
          </section>
        )}

        {locked && (
          <div className="play-action">
            <button type="button" className="btn btn--primary btn--large btn--block" onClick={actions.next}>
              {round < ROUNDS ? `Sang ngày ${round + 1}` : 'Xem tổng kết'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

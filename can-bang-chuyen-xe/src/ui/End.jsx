import { summarize } from '../game/state.js';
import { DayMarks } from './DayMarks.jsx';
import { Icon } from './Icon.jsx';

const LESSONS = [
  {
    title: 'Vừa thống nhất, vừa mâu thuẫn',
    text: 'Chiết khấu cao làm tài xế rời đi, rồi chính nền tảng mất lợi nhuận. Lợi ích của bên này gắn với lợi ích của bên kia.',
  },
  {
    title: 'Mâu thuẫn không đối kháng',
    text: 'Bóp chết một bên thì không ai thắng. Lời giải là điều chỉnh tỷ lệ phân chia, không phải loại bỏ một bên.',
  },
  {
    title: 'Thị trường + Nhà nước + đối thoại',
    text: 'Ngày thường thị trường tự chạy được, nhưng khi có biến cố thì cần chính sách và đối thoại để giữ cân bằng.',
  },
];

function BestLine({ data }) {
  if (!data.best) return null;
  const latest = data.games[0];
  const isNewBest = latest !== undefined && data.best.id === latest.id;
  return (
    <p className="end-best">
      <Icon name="trophy" size={22} />
      <span>
        {isNewBest
          ? 'Đây là kết quả tốt nhất của bạn từ trước đến nay.'
          : `Kết quả tốt nhất của bạn vẫn là ${data.best.wins}/5 ngày cả bốn bên cùng ổn.`}
      </span>
    </p>
  );
}

export function End({ game, data, actions }) {
  const { insights, endTitle, endSub } = summarize(game.history);
  return (
    <div className="end">
      <section className="end-hero" aria-labelledby="screen-title">
        <div className="end-copy">
          <h1 id="screen-title" className="end-title" tabIndex={-1}>{endTitle}</h1>
          <p className="end-sub">{endSub}</p>
          <BestLine data={data} />
        </div>
        <ol className="end-days" aria-label="Kết quả từng ngày">
          <DayMarks history={game.history} currentRound={0} withLabels />
        </ol>
      </section>

      {insights.length > 0 && (
        <section className="insights" aria-labelledby="insights-title">
          <h2 id="insights-title" className="section-title">Điều bạn vừa trải nghiệm</h2>
          <ul className="insight-list">
            {insights.map((text) => <li key={text} className="insight">{text}</li>)}
          </ul>
        </section>
      )}

      <section className="lessons" aria-labelledby="lessons-title">
        <h2 id="lessons-title" className="section-title">Ba kết luận cho bài học</h2>
        <ol className="lesson-list">
          {LESSONS.map((l) => (
            <li key={l.title} className="lesson">
              <h3 className="lesson-title">{l.title}</h3>
              <p className="lesson-text">{l.text}</p>
            </li>
          ))}
        </ol>
        <p className="source">
          Căn cứ: Bộ GD&amp;ĐT (2021), Giáo trình Kinh tế chính trị Mác – Lênin, mục 5.3.1. Mô hình trong game là giả
          định để minh họa.
        </p>
      </section>

      <div className="actions">
        <button type="button" className="btn btn--primary btn--large" onClick={actions.restart}>
          <Icon name="restart" size={22} />
          <span>Chơi lại</span>
        </button>
      </div>
    </div>
  );
}

import { summarize } from '../game/state.js';
import { TEACHING_NOTES } from '../game/teaching.js';
import { DayMarks } from './DayMarks.jsx';
import { Icon } from './Icon.jsx';
import { TeachingNote } from './TeachingNote.jsx';

const LESSONS = [
  {
    title: 'Vừa thống nhất, vừa mâu thuẫn',
    text: 'Trong mô phỏng, cách phân chia có thể tác động thu nhập, động lực và kết quả của các bên khác. Quan hệ lợi ích vừa có mặt thống nhất, vừa có mặt mâu thuẫn.',
  },
  {
    title: 'Nhận diện đúng mâu thuẫn',
    text: 'Cần xét lợi ích cơ bản trong quan hệ xã hội cụ thể. Việc cùng cần dịch vụ hoặc cùng tham gia đối thoại chưa đủ để kết luận mâu thuẫn không đối kháng.',
  },
  {
    title: 'Thị trường, Nhà nước và xã hội',
    text: 'Thị trường cần kết hợp chính sách và vai trò của các tổ chức xã hội. Nhà nước bảo vệ lợi ích hợp pháp và điều hòa quan hệ lợi ích, kể cả khi chưa có biến cố.',
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
          Căn cứ: chủ đề quan hệ lợi ích và bảo đảm hài hòa lợi ích trong chương 5, Giáo trình Kinh tế chính trị
          Mác–Lênin. Nguồn đã đối chiếu và phiên bản tài liệu được ghi bên dưới.
        </p>
        <TeachingNote note={TEACHING_NOTES.overview} />
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

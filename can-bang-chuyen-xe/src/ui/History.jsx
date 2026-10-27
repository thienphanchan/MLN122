import { useEffect, useRef, useState } from 'react';
import { OK_THRESHOLD } from '../game/simulate.js';
import { formatDateTime, formatNumber } from './format.js';
import { Icon } from './Icon.jsx';
import { PARTIES } from './parties.js';

const onOff = (on) => (on ? 'Bật' : 'Tắt');

function ScoreCell({ party, value }) {
  const danger = value < OK_THRESHOLD;
  return (
    <td className={`num score${danger ? ' score--danger' : ''}`} data-label={party.label}>
      <span className="cell">
        {danger && <Icon name="alert" size={14} className="score-icon" />}
        <span>{value}</span>
        {danger && <span className="visually-hidden"> (nguy hiểm)</span>}
      </span>
    </td>
  );
}

function DayTable({ days }) {
  return (
    <table className="days">
      <thead>
        <tr>
          <th scope="col">Ngày</th>
          <th scope="col" className="num">Chiết khấu</th>
          <th scope="col">Sàn thu nhập</th>
          <th scope="col">Đối thoại</th>
          {PARTIES.map((p) => <th key={p.key} scope="col" className="num">{p.label}</th>)}
          <th scope="col">Kết quả</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d, i) => (
          <tr key={i}>
            <th scope="row" data-label="Ngày">Ngày {i + 1}</th>
            <td className="num" data-label="Chiết khấu">{d.commission}%</td>
            <td data-label="Sàn thu nhập">{onOff(d.floor)}</td>
            <td data-label="Đối thoại">{onOff(d.dialogue)}</td>
            {PARTIES.map((p) => <ScoreCell key={p.key} party={p} value={d.scores[p.key]} />)}
            <td className={`day-result day-result--${d.allGreen ? 'ok' : 'bad'}`} data-label="Kết quả">
              <span className="cell">
                <Icon name={d.allGreen ? 'check' : 'cross'} size={16} className="day-result-icon" />
                <span>{d.allGreen ? 'Cả 4 bên ổn' : 'Có bên thiệt'}</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GameCard({ game, isBest }) {
  const titleId = `game-${game.id}`;
  return (
    <article className="game" data-game={game.id} aria-labelledby={titleId}>
      <div className="game-head">
        <h3 id={titleId} className="game-title">
          <time dateTime={game.finishedAt}>{formatDateTime(game.finishedAt)}</time>
        </h3>
        <p className="game-wins">{game.wins}/5 ngày cả bốn bên ổn</p>
        {isBest && (
          <span className="chip chip--best">
            <Icon name="trophy" size={16} />
            <span>Tốt nhất</span>
          </span>
        )}
      </div>
      <div className="table-wrap">
        <DayTable days={game.days} />
      </div>
    </article>
  );
}

function ClearZone({ onClear }) {
  const [confirming, setConfirming] = useState(false);
  const clearRef = useRef(null);
  const keepRef = useRef(null);
  const opened = useRef(false);

  // Mở xác nhận: focus vào "Giữ lại" (lựa chọn an toàn). Đóng lại: focus về nút "Xóa dữ liệu".
  useEffect(() => {
    if (confirming) {
      opened.current = true;
      keepRef.current?.focus();
    } else if (opened.current) {
      clearRef.current?.focus();
    }
  }, [confirming]);

  return (
    <section className="danger-zone" aria-labelledby="clear-title">
      <h2 id="clear-title" className="section-title">Dữ liệu trên trình duyệt này</h2>
      <p className="danger-zone-text">Lịch sử, kết quả tốt nhất và ván đang chơi dở chỉ lưu trên trình duyệt này.</p>
      {confirming ? (
        <div className="confirm" role="group" aria-labelledby="confirm-text">
          <p id="confirm-text" className="confirm-text">
            Xóa toàn bộ lịch sử, kết quả tốt nhất và ván đang chơi dở trên trình duyệt này? Không thể hoàn tác.
          </p>
          <div className="actions">
            <button type="button" className="btn btn--danger" onClick={onClear}>Xóa hẳn</button>
            <button type="button" ref={keepRef} className="btn btn--secondary" onClick={() => setConfirming(false)}>
              Giữ lại
            </button>
          </div>
        </div>
      ) : (
        <button type="button" ref={clearRef} className="btn btn--danger-outline" onClick={() => setConfirming(true)}>
          <Icon name="trash" size={20} />
          <span>Xóa dữ liệu</span>
        </button>
      )}
    </section>
  );
}

export function History({ data, actions, announce }) {
  const { games, best } = data;
  const hasSaved = games.length > 0 || best !== null || (data.current !== null && data.current.screen !== 'intro');

  function clear() {
    actions.clearData();
    announce('Đã xóa toàn bộ dữ liệu đã lưu.');
    document.getElementById('screen-title')?.focus();
  }

  return (
    <div className="history">
      <div className="history-head">
        <div>
          <h1 id="screen-title" className="history-title" tabIndex={-1}>Lịch sử chơi</h1>
          <p className="history-sub">Lưu trên trình duyệt này, tối đa 50 ván gần nhất.</p>
        </div>
        <a className="btn btn--secondary" href="#">
          <Icon name="back" size={20} />
          <span>Quay lại game</span>
        </a>
      </div>

      {best && (
        <section className="best" aria-labelledby="best-title">
          <Icon name="trophy" size={32} className="best-icon" />
          <div className="best-body">
            <h2 id="best-title" className="best-score">Kết quả tốt nhất: {best.wins}/5 ngày</h2>
            <p className="best-meta">
              Số ngày cả bốn bên cùng ổn. Tổng {formatNumber(best.total)} điểm trên 20 thanh, chơi lúc{' '}
              <time dateTime={best.finishedAt}>{formatDateTime(best.finishedAt)}</time>.
            </p>
          </div>
        </section>
      )}

      {games.length > 0 ? (
        <section className="games" aria-labelledby="games-title">
          <h2 id="games-title" className="section-title">Các ván đã chơi ({games.length})</h2>
          <p className="games-legend">
            <Icon name="alert" size={14} className="score-icon" />
            <span>Điểm dưới 50 có dấu cảnh báo: bên đó đang nguy hiểm.</span>
          </p>
          {games.map((g) => <GameCard key={g.id} game={g} isBest={best !== null && g.id === best.id} />)}
        </section>
      ) : (
        <section className="empty" aria-label="Chưa có ván nào">
          <p className="empty-text">Chưa có ván nào được lưu. Chơi xong một ván, kết quả sẽ hiện ở đây.</p>
        </section>
      )}

      {hasSaved && <ClearZone onClear={clear} />}
    </div>
  );
}

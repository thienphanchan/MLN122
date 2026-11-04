import { formatNumber } from '../ui/format.js';

function progress(player, status) {
  if (player.quizSubmitted) return 'Đã nộp bài';
  if (status === 'finished') return 'Chưa hoàn thành';
  if (status === 'lobby') return 'Đang chờ';
  return player.stage === 'quiz' ? 'Đang làm trắc nghiệm' : `Ngày ${player.round}/5`;
}

export function Scoreboard({ view, title = 'Bảng điểm trực tiếp' }) {
  const submitted = view.players.filter((player) => player.quizSubmitted).length;
  return (
    <section className="room-board" aria-labelledby="board-title">
      <div className="room-section-head">
        <h2 id="board-title">{title}</h2>
        <p>{view.players.length} người tham gia · {submitted} đã nộp bài</p>
      </div>
      {view.players.length ? (
        <div className="room-table-scroll" role="region" aria-label="Bảng điểm người chơi, cuộn ngang để xem đủ cột" tabIndex={0}>
          <table className="room-table">
            <caption className="visually-hidden">Xếp hạng theo số ngày cân bằng, tổng điểm lợi ích, rồi điểm trắc nghiệm.</caption>
            <thead><tr><th scope="col">Hạng</th><th scope="col">Người chơi</th><th scope="col">Tiến độ</th><th scope="col" className="num">Ngày cân bằng</th><th scope="col" className="num">Điểm lợi ích</th><th scope="col" className="num">Trắc nghiệm</th></tr></thead>
            <tbody>
              {view.players.map((player) => (
                <tr key={player.id} aria-current={view.self?.id === player.id ? 'true' : undefined}>
                  <td className="num">{player.rank}</td>
                  <th scope="row"><span className="room-player-name">{player.name}</span><span className={`room-presence ${player.connected ? 'room-presence--online' : ''}`}>{player.connected ? 'Đang kết nối' : 'Mất kết nối'}</span><span className="room-mobile-progress">{progress(player, view.status)} · {player.wins}/5 ngày cân bằng</span></th>
                  <td>{progress(player, view.status)}</td>
                  <td className="num">{player.wins}/5</td>
                  <td className="num">{formatNumber(player.total)}</td>
                  <td className="num">{player.quizScore === null ? 'Chưa nộp' : `${player.quizScore}/50`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="room-empty"><h3>Phòng đang chờ người đầu tiên</h3><p>Chiếu mã QR hoặc gửi liên kết để mọi người tham gia.</p></div>}
      <p className="room-footnote">Mỗi ngày cả bốn bên đạt từ 50 điểm là một ngày cân bằng. Xếp hạng ưu tiên số ngày cân bằng, tổng điểm lợi ích, rồi điểm trắc nghiệm.</p>
    </section>
  );
}

import { Icon } from './Icon.jsx';
import { PARTIES } from './parties.js';
import { HISTORY_HASH } from './useHash.js';
import { readSession } from '../room/useRoom.js';

export function Intro({ data, actions }) {
  const roomSession = readSession();
  return (
    <div className="intro">
      <section className="intro-main" aria-labelledby="screen-title">
        <h1 id="screen-title" className="intro-title" tabIndex={-1}>
          Giữ cả bốn bên cùng “xanh” trong 5 ngày.
        </h1>
        <p className="intro-lead">
          Bạn là người điều phối. Mỗi ngày bạn chọn mức chiết khấu của nền tảng và quyết định có bật chính sách của Nhà
          nước hay không. Biến cố mỗi ngày làm thị trường thay đổi; một phương án không thể giữ cả bốn bên ổn suốt ván.
          Theo dõi bốn thanh đo khi điều chỉnh, rồi chốt phương án cho từng ngày.
        </p>
        <div className="actions">
          <button type="button" className="btn btn--primary btn--large" onClick={() => { location.hash = '#phong/tao'; }}>Tạo phòng</button>
          <button type="button" className="btn btn--secondary btn--large" onClick={() => { location.hash = '#tham-gia'; }}>Tham gia phòng</button>
        </div>
        <p className="intro-room-help">Cả lớp tham gia bằng mã QR. Chủ phòng xem điểm cập nhật trực tiếp.</p>
        {roomSession && <a href={`#phong/${roomSession.code}`}>Quay lại phòng {roomSession.code}</a>}
        <div className="actions">
          <button type="button" className="btn btn--secondary btn--large" onClick={actions.start}>
            Bắt đầu ngày 1
          </button>
        </div>
        {data.best && (
          <p className="intro-best">
            <Icon name="trophy" size={22} />
            <span>
              Kết quả tốt nhất của bạn: {data.best.wins}/5 ngày cả bốn bên cùng ổn.{' '}
              <a href={HISTORY_HASH}>Xem các ván đã chơi</a>
            </span>
          </p>
        )}
        <p className="intro-note">
          Mốc thực tế để tham khảo: chiết khấu chuẩn của Grab là 20% (xe máy) và 25% (ô tô), theo Báo Pháp Luật Việt
          Nam, 10/9/2026.
        </p>
      </section>
      <section className="parties" aria-labelledby="parties-title">
        <h2 id="parties-title" className="parties-title">Bốn bên, bốn thanh đo</h2>
        <ul className="party-list">
          {PARTIES.map((p) => (
            <li key={p.key} className={`party party--${p.cls}`}>
              <Icon name={p.icon} size={30} className="party-icon" />
              <span className="party-name">{p.label}</span>
              <span className="party-measure">{p.measure}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

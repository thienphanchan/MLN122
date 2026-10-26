import { Icon } from './Icon.jsx';
import { HISTORY_HASH } from './useHash.js';

export function Header({ view }) {
  return (
    <header className="topbar container">
      <a className="brand" href="#" aria-label="Cân bằng chuyến xe, về màn chơi">
        <span className="brand-mark"><Icon name="logo" size={28} /></span>
        <span className="brand-text">
          <span className="brand-name">Cân bằng chuyến xe</span>
          <span className="brand-course">MLN122: Lợi ích kinh tế và quan hệ lợi ích kinh tế</span>
        </span>
      </a>
      <p className="notice" role="note">
        <Icon name="info" size={18} />
        <span>Mô phỏng giả định · số liệu trong game không phải số liệu thực tế</span>
      </p>
      <a
        className="btn btn--secondary btn--compact topbar-history"
        href={HISTORY_HASH}
        aria-current={view === 'history' ? 'page' : undefined}
      >
        <Icon name="history" size={20} />
        <span>Lịch sử chơi</span>
      </a>
    </header>
  );
}

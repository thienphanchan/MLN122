import { ROUNDS } from '../game/events.js';
import { Icon } from './Icon.jsx';

const WORDS = {
  ok: 'cả bốn bên ổn',
  bad: 'có bên bị thiệt',
  current: 'hôm nay',
  todo: 'chưa chơi',
};

// Năm ô ngày: đã ổn (dấu tích xanh), có bên thiệt (dấu nhân đỏ), hôm nay (số trên nền sáng),
// chưa chơi (số mờ). Hình dạng khác nhau và có chữ cho trình đọc màn hình, không chỉ dựa vào màu.
export function DayMarks({ history, currentRound, withLabels = false }) {
  return Array.from({ length: ROUNDS }, (_, i) => {
    const n = i + 1;
    const day = history[i];
    const kind = day ? (day.allGreen ? 'ok' : 'bad') : n === currentRound ? 'current' : 'todo';
    return (
      <li
        key={n}
        className={`day-mark day-mark--${kind}`}
        aria-current={!withLabels && n === currentRound ? 'step' : undefined}
        data-day-mark={withLabels ? kind : undefined}
      >
        <span className="day-mark-box">
          {day
            ? <Icon name={day.allGreen ? 'check' : 'cross'} size={22} />
            : <span className="day-mark-num" aria-hidden="true">{n}</span>}
        </span>
        {withLabels
          ? <span className="day-mark-label">Ngày {n}<span className="visually-hidden">: {WORDS[kind]}</span></span>
          : <span className="visually-hidden">Ngày {n}: {WORDS[kind]}</span>}
      </li>
    );
  });
}

// Lớp duy nhất chạm vào localStorage. Mọi thao tác bọc try/catch: khi trình duyệt chặn lưu trữ
// hoặc dữ liệu hỏng, game vẫn chạy với dữ liệu mặc định, chỉ không lưu được.
import { isValidRecord } from './game/records.js';

export const STORAGE_KEY = 'cbcx:v1';
const VERSION = 1;

export function defaultData() {
  return { version: VERSION, current: null, games: [], best: null };
}

export function getBackend() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Phần nào hỏng thì chỉ bỏ phần đó: ván dở hỏng không kéo theo lịch sử và kết quả tốt nhất.
// `current` chỉ được kiểm tra hình dạng ở đây; restoreState() kiểm tra nội dung.
export function loadData(backend) {
  try {
    if (!backend) return defaultData();
    const raw = backend.getItem(STORAGE_KEY);
    if (raw === null) return defaultData();
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed) || parsed.version !== VERSION) return defaultData();
    return {
      version: VERSION,
      current: isPlainObject(parsed.current) ? parsed.current : null,
      games: Array.isArray(parsed.games) ? parsed.games.filter(isValidRecord) : [],
      best: isValidRecord(parsed.best) ? parsed.best : null,
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data, backend) {
  try {
    if (!backend) return false;
    backend.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(backend) {
  try {
    if (!backend) return false;
    backend.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

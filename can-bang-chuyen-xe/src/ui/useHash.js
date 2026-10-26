import { useSyncExternalStore } from 'react';

export const HISTORY_HASH = '#lich-su';

function subscribe(onChange) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

// Phần #... của URL; màn "Lịch sử chơi" là #lich-su để nút Back của trình duyệt hoạt động.
export function useHash() {
  return useSyncExternalStore(subscribe, () => window.location.hash);
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

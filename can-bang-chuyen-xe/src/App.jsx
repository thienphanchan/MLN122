import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { End } from './ui/End.jsx';
import { Header } from './ui/Header.jsx';
import { History } from './ui/History.jsx';
import { Intro } from './ui/Intro.jsx';
import { Play } from './ui/Play.jsx';
import { HISTORY_HASH, useHash } from './ui/useHash.js';

export function App({ store }) {
  const { game, data, storageOk } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { actions } = store;
  const hash = useHash();
  const view = hash === HISTORY_HASH ? 'history' : game.screen;
  const viewKey = view === 'play' ? `play-${game.round}` : view;

  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((text) => {
    setAnnouncement('');
    requestAnimationFrame(() => setAnnouncement(text));
  }, []);

  // Đổi màn: về đầu trang và đưa focus tới tiêu đề màn mới (không làm ở lần tải đầu).
  const shownKey = useRef(viewKey);
  useEffect(() => {
    document.title = view === 'history' ? 'Lịch sử chơi | Cân bằng chuyến xe' : 'Cân bằng chuyến xe';
    if (shownKey.current === viewKey) return;
    shownKey.current = viewKey;
    window.scrollTo({ top: 0 });
    document.getElementById('screen-title')?.focus({ preventScroll: true });
  }, [view, viewKey]);

  let screen;
  if (view === 'history') screen = <History data={data} actions={actions} announce={announce} />;
  else if (view === 'play') screen = <Play key={viewKey} game={game} actions={actions} announce={announce} />;
  else if (view === 'end') screen = <End game={game} data={data} actions={actions} />;
  else screen = <Intro data={data} actions={actions} />;

  return (
    <div className="app">
      <Header view={view} />
      {!storageOk && (
        <div className="container storage-warning" role="status">
          <p>
            Không lưu được dữ liệu trên trình duyệt này. Bạn vẫn có thể tiếp tục phân tích tình huống, nhưng các quyết
            định hiện tại sẽ mất khi tải lại trang.
          </p>
        </div>
      )}
      <main id="screen" className="container">{screen}</main>
      <div className="visually-hidden" aria-live="polite">{announcement}</div>
    </div>
  );
}

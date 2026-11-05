import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SESSION_KEY = 'cbcx:room:session';
const REQUEST_KEY = 'cbcx:room:request';
let volatileSession = null;
let sessionStorageOk = true;
export function readSession() {
  if (volatileSession) return volatileSession;
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    volatileSession = session && /^[A-Z0-9]{6}$/.test(session.code) && typeof session.token === 'string' ? session : null;
    return volatileSession;
  } catch { sessionStorageOk = false; return null; }
}
function readPending() { try { return JSON.parse(sessionStorage.getItem(REQUEST_KEY)); } catch { return null; } }
function store(key, value) {
  try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
function requestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), (value) => value.toString(16).padStart(2, '0')).join('');
}

export function useRoom(hash) {
  const initial = useRef(undefined);
  if (initial.current === undefined) {
    const saved = readSession();
    const code = hash.split('/')[1];
    initial.current = code && saved?.code === code ? saved : null;
  }
  const [session, setSession] = useState(initial.current);
  const sessionRef = useRef(initial.current);
  const socketRef = useRef(null);
  const requestRef = useRef(readPending());
  const busy = useRef(false);
  const [view, setView] = useState(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [storageOk, setStorageOk] = useState(sessionStorageOk);
  const initialHash = useRef(hash);

  const send = useCallback(async (action, payload = {}) => {
    const socket = socketRef.current;
    if (busy.current) return false;
    if (!socket?.connected) { setError('Chưa kết nối được máy chủ. Hãy chờ kết nối rồi thử lại.'); return false; }
    const event = action === 'create' ? 'room:create' : action === 'join' ? 'room:join' : 'room:command';
    const signature = JSON.stringify({ action, payload });
    const previous = requestRef.current;
    const id = previous?.signature === signature ? previous.requestId : requestId();
    requestRef.current = { signature, requestId: id };
    setStorageOk(store(REQUEST_KEY, requestRef.current));
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const result = await socket.timeout(10000).emitWithAck(event, { ...payload, action, requestId: id });
      if (!result.ok) { setError(result.error); return false; }
      sessionRef.current = result.session;
      volatileSession = result.session;
      setSession(result.session);
      sessionStorageOk = store(SESSION_KEY, result.session);
      setStorageOk(sessionStorageOk);
      setView(result.view);
      requestRef.current = null;
      store(REQUEST_KEY, null);
      if (action === 'create' || action === 'join') window.location.hash = `#phong/${result.session.code}`;
      return true;
    } catch {
      setError('Chưa nhận được xác nhận. Khi có kết nối, hãy thử lại; kết quả sẽ không bị tính hai lần.');
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }, []);

  useEffect(() => {
    let socket;
    let retryTimer;
    let active = true;
    const controller = new AbortController();
    async function initialize() {
      try {
        const response = await fetch('/api/config', { signal: controller.signal, cache: 'no-store' });
        let config;
        try { config = await response.json(); } catch { /* A static-only deployment can return HTML instead. */ }
        if (!response.ok || !config) {
          const failure = new Error(typeof config?.error === 'string' ? config.error
            : 'Máy chủ phòng chưa sẵn sàng trên địa chỉ này. Hãy nhờ người tổ chức kiểm tra triển khai.');
          failure.publicMessage = true;
          throw failure;
        }
        if (!active) return;
        socket = io({ ...config.socket, autoConnect: false });
        socketRef.current = socket;
        socket.on('connect', async () => {
          setError('');
          const saved = sessionRef.current;
          if (saved) {
            try {
              const result = await socket.timeout(10000).emitWithAck('room:resume', saved);
              if (!active) return;
              if (result.ok) { setView(result.view); setConnected(true); }
              else { setError(result.error); setConnected(false); }
            } catch { if (active) setError('Chưa khôi phục được phiên. Hãy tải lại trang để thử lại.'); }
          } else {
            setConnected(true);
            if (initialHash.current === '#phong/tao') send('create');
          }
        });
        socket.on('disconnect', () => { if (active) setConnected(false); });
        socket.on('connect_error', () => { if (active) { setConnected(false); setError('Chưa kết nối được máy chủ phòng. Máy chủ có thể chưa sẵn sàng; hãy thử lại sau ít phút.'); } });
        socket.on('room:view', (next) => { if (active) setView(next); });
        socket.on('room:error', (message) => { if (active) { setError(message); setConnected(false); } });
        socket.connect();
      } catch (failure) {
        if (!active) return;
        setConnected(false);
        setError(failure.publicMessage ? failure.message : 'Chưa kết nối được máy chủ phòng. Hãy kiểm tra kết nối hoặc thử lại sau ít phút.');
        retryTimer = window.setTimeout(initialize, 3000);
      }
    }
    initialize();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(retryTimer);
      socket?.removeAllListeners();
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [send]);

  return { session, view, connected, pending, error, storageOk, send };
}

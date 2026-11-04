import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const loopback = (hostname) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
export function RoomInvite({ code, status }) {
  const [origin, setOrigin] = useState(loopback(location.hostname) ? '' : location.origin);
  const [qr, setQr] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [configError, setConfigError] = useState('');
  const [qrError, setQrError] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState('');
  const invitation = status === 'lobby';
  const title = invitation ? 'Quét QR để tham gia' : status === 'finished' ? 'Mã phòng đã kết thúc' : 'Mã phòng đang diễn ra';
  const description = invitation
    ? 'Mở bằng điện thoại hoặc máy tính, nhập tên rồi chờ bắt đầu.'
    : status === 'finished'
      ? 'Phòng đã kết thúc và không nhận người mới. Mở lại liên kết trong tab đã tham gia để xem kết quả.'
      : 'Phòng đã bắt đầu và không nhận người mới. Mở lại liên kết trong tab đã tham gia để tiếp tục.';
  useEffect(() => {
    let active = true;
    fetch('/api/config').then((res) => { if (!res.ok) throw new Error(); return res.json(); }).then((config) => {
      if (!active) return;
      // Khi đang ở Vite, dùng cổng trình duyệt; production dùng cổng máy chủ.
      const lan = config.lanOrigins?.[0];
      const candidate = config.publicOrigin || (!loopback(location.hostname) ? location.origin : lan);
      if (candidate) {
        const url = new URL(candidate);
        if (!config.publicOrigin && import.meta.env.DEV) url.port = location.port;
        setOrigin(url.origin);
        setAddress(url.origin);
      } else setConfigError('Chưa có địa chỉ để thiết bị khác truy cập. Hãy nhập IP Wi-Fi hoặc tên miền của máy chủ.');
    }).catch(() => { if (active) setConfigError('Chưa lấy được địa chỉ chia sẻ. Bạn có thể nhập địa chỉ máy chủ bên dưới.'); });
    return () => { active = false; };
  }, []);
  const link = origin ? `${origin}/#tham-gia/${code}` : '';
  useEffect(() => {
    let active = true;
    setQr('');
    setQrError('');
    if (link) QRCode.toDataURL(link, { width: 320, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#121331', light: '#ffffff' } })
      .then((value) => { if (active) setQr(value); }).catch(() => { if (active) setQrError('Chưa tạo được QR. Hãy chia sẻ mã phòng hoặc liên kết.'); });
    return () => { active = false; };
  }, [link]);
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopyStatus('Đã sao chép liên kết.'); }
    catch { setCopyStatus('Hãy chọn và sao chép liên kết trong ô bên dưới.'); document.getElementById('invite-link')?.select(); }
  }
  function updateOrigin(event) {
    event.preventDefault();
    try {
      const url = new URL(address);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
      if (loopback(url.hostname)) throw new Error();
      setOrigin(url.origin); setConfigError(''); setShowAddress(false);
    } catch { setConfigError('Nhập địa chỉ http(s) với IP Wi-Fi hoặc tên miền, ví dụ http://192.168.1.10:3001.'); }
  }
  return (
    <section className="room-invite" aria-labelledby="invite-title">
      <div>
        <h2 id="invite-title">{title}</h2>
        <p>{description}</p>
      </div>
      {qr ? <img className="room-qr" src={qr} alt="Mã QR tham gia phòng" width="256" height="256" /> : <p role="status">{qrError || (link ? 'Đang tạo mã QR…' : 'Cần địa chỉ chia sẻ để tạo QR.')}</p>}
      <div className="room-code-block"><span>Mã phòng</span><strong className="room-code" data-testid="room-code">{code}</strong></div>
      {link && <div className="room-share"><label htmlFor="invite-link">{invitation ? 'Liên kết tham gia' : 'Liên kết phòng'}</label><input id="invite-link" readOnly value={link} onFocus={(e) => e.target.select()} /><button className="btn btn--secondary" onClick={copy}>Sao chép liên kết</button></div>}
      <p className="room-footnote">Dùng cùng Wi-Fi với máy chủ hoặc mở liên kết Internet đã triển khai. Tắt VPN nếu địa chỉ chia sẻ thuộc mạng ảo.</p>
      {origin && loopback(new URL(origin).hostname) && <p className="room-inline-warning">Địa chỉ localhost chỉ dùng trên máy này. Hãy đổi sang IP Wi-Fi hoặc tên miền trước khi chia sẻ QR.</p>}
      <button type="button" className="room-text-button" onClick={() => setShowAddress((value) => !value)} aria-expanded={showAddress}>Đổi địa chỉ chia sẻ</button>
      {configError && <p className="room-error" role="alert">{configError}</p>}
      {showAddress && <form className="room-share" onSubmit={updateOrigin}><label htmlFor="share-origin">Địa chỉ máy chủ</label><input id="share-origin" type="url" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="http://192.168.1.10:3001" /><button className="btn btn--secondary" type="submit">Cập nhật QR</button></form>}
      <p role="status" className="room-footnote">{copyStatus}</p>
    </section>
  );
}

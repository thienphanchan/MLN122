// Mô hình giả định: biến cố làm thay đổi chi phí, nguồn cung và sức ép chờ xe.
// D = tài xế, P = nền tảng, K = khách hàng, X = xã hội. Mỗi thanh là số nguyên 0..100.

export const OK_THRESHOLD = 50;
export const MODEL_VERSION = 2;

export function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Phiên bản 1 chỉ dùng để đọc đúng điểm lịch sử cũ.
export function simulate(round, commission, floor, dialogue, modelVersion = MODEL_VERSION) {
  const dynamic = modelVersion >= 2;
  const c = commission;
  let D = 40 + (30 - c) * 3 + (floor ? 12 : 0) + (dialogue ? 6 : 0);
  let strike = false;
  if (round === 2) D -= 12;
  // Tranh chấp thu nhập gây sức ép cả khi đã có cơ chế đối thoại.
  if (dynamic && round === 4) D -= 14;
  if (round === 4 && !dialogue) { D -= 8; if (D < 50) { D -= 20; strike = true; } }
  D = clamp(D);
  const S = D;
  let P = 2.6 * c * S / 70 - (floor ? 5 : 0) - (dialogue ? 1 : 0);
  let K = 0.6 * S + 30 - (floor ? 4 : 0);
  if (round === 3) P -= (K >= 65 ? 4 : 12);
  // Cạnh tranh làm nguồn thu giảm, tăng gánh nặng tài trợ sàn thu nhập.
  if (dynamic && round === 3 && floor) P -= 14;
  if (round === 5 && S < 55) K -= 12;
  // Cầu giờ cao điểm tăng: cùng nguồn xe như ngày thường sẽ không còn đủ.
  if (dynamic && round === 5) K -= 32;
  let X = 0.5 * D + 0.2 * K + 10 + (floor ? 12 : 0) + (dialogue ? 10 : 0);
  if (round === 4) X += dialogue ? 5 : -15;
  if (strike) X -= 15;
  return { D, P: clamp(P), K: clamp(K), X: clamp(X), strike };
}

export function isAllGreen({ D, P, K, X }) {
  return D >= OK_THRESHOLD && P >= OK_THRESHOLD && K >= OK_THRESHOLD && X >= OK_THRESHOLD;
}

// Lời giải thích sau mỗi ngày (tối đa hai câu). `result` cần có D, strike và allGreen.
export function explain(round, commission, floor, dialogue, result, modelVersion = MODEL_VERSION) {
  const lines = [];
  if (modelVersion >= 2 && round === 3) lines.push('Đối thủ giảm giá làm nguồn thu suy giảm; tài trợ sàn thu nhập trong ngày cạnh tranh tạo thêm áp lực chi phí cho nền tảng.');
  if (modelVersion >= 2 && round === 5) lines.push('Nhu cầu giờ cao điểm tăng mạnh: cần tăng phần thu nhập tài xế để thu hút đủ xe, đồng thời kiểm tra nguồn thu nền tảng.');
  if (commission >= 32) lines.push('Chiết khấu cao: tài xế bỏ app, ít xe nên lợi nhuận nền tảng cũng giảm. Lợi ích hai bên gắn với nhau.');
  else if (commission <= 17 && (modelVersion === 1 || result.P < OK_THRESHOLD)) lines.push('Chiết khấu quá thấp: nền tảng không đủ nguồn thu. Bóp một bên thì cả hệ thống yếu đi.');
  if (round === 2 && !floor) lines.push('Xăng tăng mà không có sàn thu nhập: tài xế gánh trọn rủi ro.');
  if (round === 4 && !dialogue) lines.push(result.strike ? 'Không có đối thoại, tài xế tắt app hàng loạt: mâu thuẫn bùng lên, xã hội bất ổn.' : 'Không có đối thoại: căng thẳng lan rộng, ổn định xã hội giảm.');
  if (round === 4 && dialogue) lines.push('Đối thoại ba bên giúp mâu thuẫn được giải quyết trong khuôn khổ pháp luật.');
  if (round === 5 && result.D < 55) lines.push('Thiếu tài xế thì khách chờ lâu: lợi ích khách hàng cũng phụ thuộc vào tài xế.');
  if (lines.length === 0) lines.push(result.allGreen ? 'Mức chiết khấu và chính sách hợp lý: các bên cùng có lợi.' : 'Một bên đang bị thiệt. Thử điều chỉnh chiết khấu hoặc chính sách.');
  return lines.slice(0, 2).join(' ');
}

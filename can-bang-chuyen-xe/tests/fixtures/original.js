// Chép nguyên văn từ bản gốc Main.dc.html (artifact "Cân bằng chuyến xe") để làm đáp án đối chiếu.
// explainFor vốn là phương thức của class Component; ở đây là hàm tự do, thân hàm không đổi.
// Không sửa file này: test dùng nó để chứng minh công thức trong src/ vẫn giống hệt bản gốc.

export var EVENTS = [
  { title: 'Một ngày bình thường', desc: 'Không có cú sốc nào. Thị trường tự vận hành.', question: 'Không có biến cố, thị trường tự vận hành có ổn không?' },
  { title: 'Giá xăng tăng mạnh', desc: 'Chi phí của tài xế tăng, trong khi cước khách trả không đổi.', question: 'Khi xăng tăng, ai nên chia sẻ rủi ro với tài xế?' },
  { title: 'Đối thủ giảm giá', desc: 'Một hãng khác tung khuyến mãi, khách có thể chuyển sang đó.', question: 'Giảm giá để cạnh tranh: rốt cuộc ai trả tiền cho mức giá rẻ?' },
  { title: 'Tài xế kêu gọi tắt app', desc: 'Tài xế bức xúc vì thu nhập thấp, kêu gọi tắt ứng dụng hai ngày.', question: 'Tắt app là mâu thuẫn đối kháng hay không đối kháng?' },
  { title: 'Khách phàn nàn chờ xe lâu', desc: 'Giờ cao điểm, khách đặt xe phải chờ rất lâu nếu thiếu tài xế.', question: 'Khách hàng có phải là một bên trong quan hệ lợi ích không?' }
];
function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
export function simulate(r, c, floor, dlg) {
  var D = 40 + (30 - c) * 3 + (floor ? 12 : 0) + (dlg ? 6 : 0);
  var strike = false;
  if (r === 2) D -= 12;
  if (r === 4 && !dlg) { D -= 8; if (D < 50) { D -= 20; strike = true; } }
  D = clamp(D);
  var S = D;
  var P = 2.6 * c * S / 70 - (floor ? 5 : 0) - (dlg ? 1 : 0);
  var K = 0.6 * S + 30 - (floor ? 4 : 0);
  if (r === 3) P -= (K >= 65 ? 4 : 12);
  if (r === 5 && S < 55) K -= 12;
  var X = 0.5 * D + 0.2 * K + 10 + (floor ? 12 : 0) + (dlg ? 10 : 0);
  if (r === 4) X += dlg ? 5 : -15;
  if (strike) X -= 15;
  return { D: D, P: clamp(P), K: clamp(K), X: clamp(X), strike: strike };
}
export function explainFor(r, c, floor, dlg, res) {
  var lines = [];
  if (c >= 32) lines.push('Chiết khấu cao: tài xế bỏ app, ít xe nên lợi nhuận nền tảng cũng giảm. Lợi ích hai bên gắn với nhau.');
  else if (c <= 17) lines.push('Chiết khấu quá thấp: nền tảng không đủ nguồn thu. Bóp một bên thì cả hệ thống yếu đi.');
  if (r === 2 && !floor) lines.push('Xăng tăng mà không có sàn thu nhập: tài xế gánh trọn rủi ro.');
  if (r === 4 && !dlg) lines.push(res.strike ? 'Không có đối thoại, tài xế tắt app hàng loạt: mâu thuẫn bùng lên, xã hội bất ổn.' : 'Không có đối thoại: căng thẳng lan rộng, ổn định xã hội giảm.');
  if (r === 4 && dlg) lines.push('Đối thoại ba bên giúp mâu thuẫn được giải quyết trong khuôn khổ pháp luật.');
  if (r === 5 && res.D < 55) lines.push('Thiếu tài xế thì khách chờ lâu: lợi ích khách hàng cũng phụ thuộc vào tài xế.');
  if (lines.length === 0) lines.push(res.allGreen ? 'Mức chiết khấu và chính sách hợp lý: các bên cùng có lợi.' : 'Một bên đang bị thiệt. Thử điều chỉnh chiết khấu hoặc chính sách.');
  return lines.slice(0, 2).join(' ');
}

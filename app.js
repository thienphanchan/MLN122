'use strict';

// ===== Dữ liệu và mô hình: giữ nguyên từ bản Design Component =====

var EVENTS = [
  { title: 'Một ngày bình thường', desc: 'Không có cú sốc nào. Thị trường tự vận hành.', question: 'Không có biến cố, thị trường tự vận hành có ổn không?' },
  { title: 'Giá xăng tăng mạnh', desc: 'Chi phí của tài xế tăng, trong khi cước khách trả không đổi.', question: 'Khi xăng tăng, ai nên chia sẻ rủi ro với tài xế?' },
  { title: 'Đối thủ giảm giá', desc: 'Một hãng khác tung khuyến mãi, khách có thể chuyển sang đó.', question: 'Giảm giá để cạnh tranh: rốt cuộc ai trả tiền cho mức giá rẻ?' },
  { title: 'Tài xế kêu gọi tắt app', desc: 'Tài xế bức xúc vì thu nhập thấp, kêu gọi tắt ứng dụng hai ngày.', question: 'Tắt app là mâu thuẫn đối kháng hay không đối kháng?' },
  { title: 'Khách phàn nàn chờ xe lâu', desc: 'Giờ cao điểm, khách đặt xe phải chờ rất lâu nếu thiếu tài xế.', question: 'Khách hàng có phải là một bên trong quan hệ lợi ích không?' }
];
function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
function simulate(r, c, floor, dlg) {
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
function explainFor(r, c, floor, dlg, res) {
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

// ===== Trạng thái (thay cho this.state / this.setState của DCLogic) =====

var state = { screen: 'intro', round: 1, commission: 25, floor: false, dlg: false, result: null, history: [] };

function setState(patch) {
  state = Object.assign({}, state, patch);
  render();
}

// ===== Giá trị hiển thị (tương đương renderVals, bỏ phần handler) =====

function renderVals() {
  var s = state;
  var ev = EVENTS[s.round - 1] || EVENTS[0];
  var res = s.result;
  var metrics = [];
  if (res) {
    var defs = [
      { label: 'Tài xế', v: res.D, color: '#2EC4B6' },
      { label: 'Nền tảng', v: res.P, color: '#FF7A5C' },
      { label: 'Khách hàng', v: res.K, color: '#FFC145' },
      { label: 'Xã hội', v: res.X, color: '#A99BFF' }
    ];
    metrics = defs.map(function (d) {
      var ok = d.v >= 50;
      return { label: d.label, value: d.v, color: d.color, width: Math.max(d.v, 2) + '%', status: ok ? 'Ổn' : 'Nguy hiểm', pillBg: ok ? '#3DDC97' : '#FF5470' };
    });
  }
  var allGreen = res ? res.allGreen : false;
  var dots = [1, 2, 3, 4, 5].map(function (n) {
    var h = s.history[n - 1];
    var bg = h ? (h.allGreen ? '#3DDC97' : '#FF5470') : (n === s.round ? '#F4F3FF' : '#2E2F66');
    return { n: n, bg: bg };
  });
  var history = s.history.map(function (h, i) {
    return { n: i + 1, bg: h.allGreen ? '#3DDC97' : '#FF5470', mark: h.allGreen ? '✓' : '✕' };
  });
  var wins = s.history.filter(function (h) { return h.allGreen; }).length;
  var insights = [];
  if (s.history.some(function (h) { return h.c >= 32; })) insights.push({ text: 'Bạn đã thử chiết khấu cao: tài xế rời app, và lợi nhuận nền tảng giảm theo. Đó là mặt thống nhất của lợi ích.' });
  if (s.history.some(function (h) { return h.c <= 17; })) insights.push({ text: 'Bạn đã thử chiết khấu rất thấp: nền tảng không trụ được. Hy sinh hẳn một bên không phải lời giải.' });
  var noPolicyLoss = s.history.some(function (h, i) { return i > 0 && !h.floor && !h.dlg && !h.allGreen; });
  if (noPolicyLoss) insights.push({ text: 'Có ngày bạn để thị trường tự chạy giữa biến cố và một bên “đỏ”. Đó là lý do cần chính sách của Nhà nước.' });
  if (s.history.some(function (h, i) { return i === 3 && h.dlg; })) insights.push({ text: 'Ngày tài xế kêu gọi tắt app, bạn chọn đối thoại: mâu thuẫn không đối kháng được giải quyết bằng đối thoại và pháp luật.' });
  var endTitle = wins === 5 ? 'Tuyệt vời! Bạn hài hòa được lợi ích cả 5 ngày.' : (wins >= 3 ? 'Khá lắm: ' + wins + '/5 ngày cả bốn bên cùng ổn.' : 'Chỉ ' + wins + '/5 ngày cả bốn bên cùng ổn.');
  var endSub = wins === 5 ? 'Bạn đã kết hợp thị trường, chính sách và đối thoại đúng lúc.' : 'Cân bằng lợi ích khó hơn tưởng: mỗi lựa chọn có bên được, bên mất.';
  return {
    isIntro: s.screen === 'intro',
    isPlay: s.screen === 'play',
    isEnd: s.screen === 'end',
    roundLabel: 'Ngày ' + s.round + '/5',
    dots: dots,
    event: ev,
    commission: s.commission,
    commissionLabel: s.commission + '%',
    locked: !!res,
    canConfirm: !res,
    waiting: !res,
    floorOn: s.floor,
    dialogueOn: s.dlg,
    floorText: s.floor ? 'Đang bật' : 'Tắt',
    dlgText: s.dlg ? 'Đang bật' : 'Tắt',
    floorBg: s.floor ? '#22465A' : '#16173A',
    floorBorder: s.floor ? '#2EC4B6' : '#2E2F66',
    dlgBg: s.dlg ? '#332D63' : '#16173A',
    dlgBorder: s.dlg ? '#A99BFF' : '#2E2F66',
    metrics: metrics,
    verdictBg: allGreen ? '#3DDC97' : '#FF8FA3',
    verdictTitle: allGreen ? 'Cả bốn bên cùng ổn' : 'Có bên đang bị thiệt',
    explain: res ? res.explain : '',
    nextLabel: s.round < 5 ? 'Sang ngày ' + (s.round + 1) : 'Xem tổng kết',
    history: history,
    insights: insights,
    hasInsights: insights.length > 0,
    endTitle: endTitle,
    endSub: endSub
  };
}

// ===== Hành động (các handler onClick / onChange của bản gốc) =====

var actions = {
  start: function () { setState({ screen: 'play', round: 1, result: null, history: [] }); },
  onCommission: function (e) { if (!state.result) setState({ commission: Number(e.target.value) }); },
  toggleFloor: function () { if (!state.result) setState({ floor: !state.floor }); },
  toggleDialogue: function () { if (!state.result) setState({ dlg: !state.dlg }); },
  confirm: function () {
    var st = state;
    var r = simulate(st.round, st.commission, st.floor, st.dlg);
    r.allGreen = r.D >= 50 && r.P >= 50 && r.K >= 50 && r.X >= 50;
    r.explain = explainFor(st.round, st.commission, st.floor, st.dlg, r);
    var h = st.history.concat([{ c: st.commission, floor: st.floor, dlg: st.dlg, allGreen: r.allGreen }]);
    setState({ result: r, history: h });
  },
  next: function () {
    var st = state;
    if (st.round >= 5) setState({ screen: 'end' });
    else setState({ round: st.round + 1, result: null });
  },
  restart: function () { setState({ screen: 'intro', round: 1, commission: 25, floor: false, dlg: false, result: null, history: [] }); }
};

// ===== Vẽ giao diện (thay cho {{...}}, <sc-if>, <sc-for>) =====

function $(id) { return document.getElementById(id); }

function esc(text) {
  return String(text).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function setToggle(button, locked, on, bg, border) {
  button.disabled = locked;
  button.setAttribute('aria-pressed', String(on));
  button.style.background = bg;
  button.style.borderColor = border;
}

function renderPlay(v) {
  $('round-label').textContent = v.roundLabel;
  $('dots').innerHTML = v.dots.map(function (d) {
    return '<div class="dot" style="background: ' + d.bg + '"></div>';
  }).join('');

  $('event-title').textContent = v.event.title;
  $('event-desc').textContent = v.event.desc;

  $('commission-label').textContent = v.commissionLabel;
  var range = $('ck');
  range.value = v.commission;
  range.disabled = v.locked;

  setToggle($('toggle-floor'), v.locked, v.floorOn, v.floorBg, v.floorBorder);
  $('floor-text').textContent = v.floorText;
  setToggle($('toggle-dialogue'), v.locked, v.dialogueOn, v.dlgBg, v.dlgBorder);
  $('dlg-text').textContent = v.dlgText;

  $('btn-confirm').hidden = !v.canConfirm;
  $('btn-next').hidden = !v.locked;
  $('btn-next').textContent = v.nextLabel;

  $('waiting').hidden = !v.waiting;
  $('result').hidden = !v.locked;
  $('metrics').innerHTML = v.metrics.map(function (m) {
    return (
      '<div class="metric">' +
        '<div class="metric-head">' +
          '<div class="metric-name"><div class="metric-swatch" style="background: ' + m.color + '"></div><div class="metric-label">' + esc(m.label) + '</div></div>' +
          '<div class="metric-score"><div class="metric-value">' + m.value + '</div><div class="metric-pill" style="background: ' + m.pillBg + '">' + esc(m.status) + '</div></div>' +
        '</div>' +
        '<div class="bar"><div class="bar-fill" style="width: ' + m.width + '; background: ' + m.color + '"></div></div>' +
      '</div>'
    );
  }).join('');
  $('verdict').style.background = v.verdictBg;
  $('verdict-title').textContent = v.verdictTitle;
  $('explain').textContent = v.explain;
  $('question').textContent = v.event.question;
}

function renderEnd(v) {
  $('end-title').textContent = v.endTitle;
  $('end-sub').textContent = v.endSub;
  $('history').innerHTML = v.history.map(function (h) {
    return (
      '<div class="day">' +
        '<div class="day-mark" style="background: ' + h.bg + '">' + h.mark + '</div>' +
        '<div class="day-label">Ngày ' + h.n + '</div>' +
      '</div>'
    );
  }).join('');

  $('insights-block').hidden = !v.hasInsights;
  $('insights').innerHTML = v.insights.map(function (i) {
    return '<div class="insight">' + esc(i.text) + '</div>';
  }).join('');
}

function render() {
  var v = renderVals();
  $('screen-intro').hidden = !v.isIntro;
  $('screen-play').hidden = !v.isPlay;
  $('screen-end').hidden = !v.isEnd;
  if (v.isPlay) renderPlay(v);
  if (v.isEnd) renderEnd(v);
}

// ===== Gắn sự kiện =====

document.addEventListener('DOMContentLoaded', function () {
  $('btn-start').addEventListener('click', actions.start);
  // Sự kiện "input" cập nhật nhãn % ngay khi kéo, giống onChange của React
  $('ck').addEventListener('input', actions.onCommission);
  $('toggle-floor').addEventListener('click', actions.toggleFloor);
  $('toggle-dialogue').addEventListener('click', actions.toggleDialogue);
  $('btn-confirm').addEventListener('click', actions.confirm);
  $('btn-next').addEventListener('click', actions.next);
  $('btn-restart').addEventListener('click', actions.restart);
  render();
});

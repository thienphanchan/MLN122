const dateTime = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
});
const number = new Intl.NumberFormat('vi-VN');

// "08:30 26/10/2026"
export const formatDateTime = (iso) => dateTime.format(new Date(iso));
export const formatNumber = (n) => number.format(n);

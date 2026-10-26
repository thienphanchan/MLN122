// Bốn bên trong game: khóa điểm của simulate(), tên, thứ được đo, lớp màu và icon.
export const PARTIES = [
  { key: 'D', label: 'Tài xế', measure: 'Thu nhập thực nhận', cls: 'driver', icon: 'driver' },
  { key: 'P', label: 'Nền tảng', measure: 'Lợi nhuận', cls: 'platform', icon: 'platform' },
  { key: 'K', label: 'Khách hàng', measure: 'Giá và thời gian chờ', cls: 'customer', icon: 'customer' },
  { key: 'X', label: 'Xã hội', measure: 'Ổn định, an sinh', cls: 'society', icon: 'society' },
];

export const STATUS_OK = 'Ổn';
export const STATUS_DANGER = 'Nguy hiểm';

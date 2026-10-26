// Bộ icon SVG nét (stroke 2, màu theo currentColor), luôn ẩn với trình đọc màn hình.
const PATHS = {
  logo: <><path d="M5 17h14M6 17l1.5-6h9L18 17" /><circle cx="8" cy="18" r="1.6" /><circle cx="16" cy="18" r="1.6" /><path d="M9 8l3-3 3 3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  driver: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  platform: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>,
  customer: <><path d="M3 6h18l-2 12H5z" /><path d="M9 10v4M15 10v4" /></>,
  society: <><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M10 21v-6h4v6" /></>,
  question: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  alert: <><path d="M12 3.5l9.5 16.5h-19z" /><path d="M12 10v4.5M12 17.5h.01" /></>,
  event: <><path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 9h3v8a2 2 0 0 1-2 2h-1" /><path d="M8 9h5M8 13h5" /></>,
  back: <><path d="M10 6l-6 6 6 6" /><path d="M4 12h16" /></>,
  restart: <><path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.5" /><path d="M4 4v4.5h4.5" /></>,
  trash: <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" />,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" /></>,
};

export function Icon({ name, size = 24, className }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

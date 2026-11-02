// Nguồn đã đọc và đối chiếu ngày 2026-10-27. Xem docs/teaching-research.md.
// Phân biệt bản học phần công khai với thông tin thư mục của ấn bản 2021.
export const TEACHING_SOURCES = {
  ktct: {
    title: 'Giáo trình học phần Kinh tế chính trị Mác–Lênin',
    locator: 'Bản công khai tại ĐH Tài nguyên và Môi trường TP.HCM; mục 5.3.1–5.3.2, tr. 126–137.',
    url: 'https://hcmunre.edu.vn/upload/elfinder/Trang%20Khoa/Khoa%20Luat%20%26LLCT/Ph%E1%BA%A7n%202_GT%20h%E1%BB%8Dc%20ph%E1%BA%A7n%20Kinh%20t%E1%BA%BF%20ch%C3%ADnh%20tr%E1%BB%8B%20MNL%20%28K%29%20Tr101-%20Tr182.pdf#page=26',
  },
  state: {
    title: 'ĐH Hà Tĩnh: Vai trò của Nhà nước trong bảo đảm hài hòa các quan hệ lợi ích',
    locator: 'Trung tâm Đào tạo và Bồi dưỡng thường xuyên, mục 1–2.',
    url: 'https://coe.htu.edu.vn/vai-tro-cua-nha-nuoc-trong-dam-bao-hai-hoa-cac-quan-he-loi-ich-kinh-te-trong-kinh-te-thi-truong-dinh-huong-xa-hoi-chu-nghia-o-viet-nam/',
  },
  philosophy: {
    title: 'Giáo trình Triết học Mác–Lênin, Hà Nội 2019',
    locator: 'Bản công khai tại ĐH Phan Thiết; quy luật thống nhất và đấu tranh của các mặt đối lập, tr. 124–126.',
    url: 'https://fbs.upt.edu.vn/wp-content/uploads/2021/06/GT-Triet-hoc-Mac-Lenin-Khong-chuyen-7.pdf#page=125',
  },
  edition2021: {
    title: 'NXB Chính trị quốc gia Sự thật: Giới thiệu giáo trình Kinh tế chính trị Mác–Lênin, 2021',
    locator: 'Đối chiếu thông tin ấn bản và phạm vi chương 5; trang giới thiệu sách, không phải bản toàn văn.',
    url: 'https://nxbctqg.org.vn/giao-trinh-kinh-te-chinh-tri-mac-lenin-danh-cho-bac-dai-hoc-he-khong-chuyen-ly-luan-chinh-tri-.html',
  },
};

export const MODEL_NOTE = 'Nội dung liên hệ lý luận với tình huống thực tiễn. Công thức, ngưỡng 50 và các tác động định lượng là giả định minh họa, không phải tiêu chuẩn trong giáo trình.';

export const TEACHING_NOTES = {
  harmony: {
    text: 'Hài hòa lợi ích không đồng nghĩa chia đều hoặc xóa bỏ mọi mâu thuẫn. Cần phối hợp lợi ích chính đáng của các chủ thể với lợi ích chung trong điều kiện cụ thể.',
    sourceIds: ['ktct', 'state'],
  },
  motivation: {
    text: 'Lợi ích kinh tế tạo động lực hoạt động. Việc xem xét thu nhập tài xế thể hiện yêu cầu tôn trọng và bảo vệ lợi ích chính đáng của người tham gia tạo ra dịch vụ.',
    sourceIds: ['ktct'],
  },
  unity: {
    text: 'Quan hệ lợi ích có cả sự thống nhất lẫn mâu thuẫn: các bên cần phối hợp tạo ra dịch vụ nhưng có thể xung đột khi phân chia thu nhập và chi phí.',
    sourceIds: ['ktct', 'state'],
  },
  social: {
    text: 'Lợi ích riêng cần được xem xét trong quan hệ với lợi ích xã hội. Thanh xã hội chỉ minh họa một số mặt an sinh và ổn định, không đại diện toàn bộ lợi ích quốc gia, dân tộc.',
    sourceIds: ['ktct', 'state'],
  },
  regulation: {
    text: 'Nhà nước bảo vệ lợi ích hợp pháp, điều hòa quan hệ lợi ích và xử lý xung đột. Thị trường cần kết hợp chính sách và vai trò của các tổ chức xã hội, kể cả khi chưa có biến cố.',
    sourceIds: ['ktct', 'state'],
  },
  classification: {
    text: 'Phân loại đối kháng hay không đối kháng cần căn cứ tính chất lợi ích cơ bản trong quan hệ xã hội cụ thể. Việc các bên cần nhau hoặc có đối thoại chưa đủ để kết luận.',
    sourceIds: ['philosophy', 'ktct'],
  },
  overview: {
    text: 'Tình huống cho thấy sự thống nhất và mâu thuẫn của các quan hệ lợi ích; yêu cầu bảo vệ lợi ích chính đáng; và sự phối hợp giữa thị trường, Nhà nước, các tổ chức xã hội. Cần phân tích điều kiện cụ thể của từng bên khi vận dụng lý luận vào thực tiễn.',
    sourceIds: ['ktct', 'state', 'philosophy', 'edition2021'],
  },
};

export const OUTCOME_CONCEPTS = {
  ok: 'harmony', D: 'motivation', P: 'unity', K: 'unity', X: 'social',
  DP: 'unity', DK: 'unity', DX: 'social', PK: 'unity', PX: 'regulation', KX: 'social',
  DPK: 'unity', DPX: 'regulation', DKX: 'social', PKX: 'unity', DPKX: 'regulation',
};

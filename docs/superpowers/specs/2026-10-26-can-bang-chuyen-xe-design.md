# Cân bằng chuyến xe: bản đặc tả

Nguồn: yêu cầu của người dùng ngày 2026-10-26 (chép nguyên ý bên dưới), cộng hai quyết định trả lời qua câu hỏi, cộng các quyết định thiết kế ghi rõ là "quyết định của Claude".

Bản gốc: artifact https://claude.ai/artifact/JeSotpEcVmQmVVxHTLgUhw, file `project/Main.dc.html` (bản sao tại `D:\MLN122\Main.dc.html`, sha256 8bc05fff…e9b6).

## 1. Yêu cầu của người dùng

- Dựng lại game thành project web độc lập: Vite + JavaScript thuần (không TypeScript, không framework), lưu dữ liệu ở localStorage.
- Skill bắt buộc: superpowers (quy trình), taste-skill, hallmark, impeccable (giao diện).
- Khởi tạo: `npm create vite@latest can-bang-chuyen-xe -- --template vanilla`; thêm vitest.
- Cấu trúc gợi ý: `src/game/events.js`, `src/game/simulate.js` (simulate + explain, giữ NGUYÊN công thức), `src/game/state.js` (screen, round, commission, floor, dialogue, result, history + hàm chuyển trạng thái), `src/storage.js`, `src/ui/` (intro, play, end, lịch sử), `src/styles.css`, `tests/simulate.test.js`.
- Giữ nguyên: nền tối #121331; màu 4 bên: tài xế #2EC4B6, nền tảng #FF7A5C, khách hàng #FFC145, xã hội #A99BFF; font Be Vietnam Pro.
- Luật chơi: 5 ngày, thanh chiết khấu 15–40%, 2 nút chính sách (Sàn thu nhập + bảo hiểm tai nạn; Đối thoại ba bên), nút Chốt quyết định, 4 thanh lợi ích (≥50 là Ổn), lời giải thích, câu hỏi cho lớp.
- Màn tổng kết: kết quả từng ngày, "Điều bạn vừa trải nghiệm", 3 kết luận bài học, dòng căn cứ giáo trình.
- Dòng "Mô phỏng giả định · số liệu trong game không phải số liệu thực tế" luôn hiển thị.
- localStorage: một key duy nhất có version `cbcx:v1`, JSON; lưu ván đang chơi dở (tải lại trang chơi tiếp được); lưu lịch sử các ván đã xong (thời điểm, số ngày cả 4 bên Ổn, lựa chọn từng ngày: chiết khấu, sàn, đối thoại, và điểm 4 thanh); lưu kết quả tốt nhất; màn "Lịch sử chơi" xem ván cũ, nút "Xóa dữ liệu" có hỏi xác nhận; mọi đọc/ghi bọc try/catch, localStorage lỗi hoặc dữ liệu hỏng thì game vẫn chạy, chỉ không lưu.
- Chất lượng: responsive tốt trên điện thoại và máy chiếu; đúng thẻ `<button>`, `<input type="range">`, `<label>`; aria-label chỗ cần; tương phản chữ ≥ 4.5:1; Ổn/Nguy hiểm thể hiện bằng chữ, không chỉ bằng màu; animation nhẹ khi thanh chạy và khi chuyển ngày, tôn trọng prefers-reduced-motion; không emoji làm icon, dùng SVG inline.
- Test simulate: ngày 1, 20%, không chính sách → cả 4 thanh ≥ 50; ngày 2 chỉ qua được khi bật cả 2 chính sách (chiết khấu 19–26%); ngày 4 không đối thoại, chiết khấu cao → có thanh < 50. Test storage: lưu, đọc lại, dữ liệu hỏng → mặc định.
- Khi xong: `npm run build` và `npm test` phải pass; báo cách chạy, cấu trúc thư mục, những chỗ khác bản gốc.

## 2. Quyết định của người dùng (qua câu hỏi)

- **Đổi stack giữa chừng: React + JSX.** Người dùng hỏi "ủa jsx chớ" rồi chọn chuyển sang React + JSX thay cho "không framework" ghi trong mục 1. Lõi game, lưu trữ và test giữ nguyên; giao diện viết lại thành component `.jsx`.

- **Mức thay đổi giao diện: giữ khung, tinh chỉnh.** Giữ nền, 4 màu, font, nội dung, bố cục chính. Bỏ các chi tiết ba skill cấm (nhãn chữ hoa giãn cách, badge viên thuốc, số 01/02/03, khung viền mảnh 1px), đưa thông tin vào tiêu đề/câu; tách bề mặt bằng bậc tông màu.
- **Bối cảnh chính: chiếu lên lớp.** Chữ to, điểm số đọc được từ cuối phòng; điện thoại vẫn chơi tốt.

## 3. Quyết định của Claude (người dùng có thể sửa)

- Phong cách màn hình ứng dụng: taste-skill `true-black-flat` (seed 60828052), giữ bảng màu và font của người dùng. Bề mặt phân tầng bằng độ sáng: nền #121331, thẻ #1D1E4A, lớp lồng #2A2B5E; không viền, không bóng trên thẻ.
- Màu = ý nghĩa: 4 màu bên chỉ dùng cho dữ liệu của bên đó (thanh, chú giải). Nút chính dùng nền sáng #F4F3FF chữ tối (không mượn màu một bên). Thẻ biến cố đổi từ nền vàng (trùng màu Khách hàng) sang nền sáng như bản tin. Thanh chiết khấu giữ màu cam vì chiết khấu là phần của nền tảng.
- Thêm vạch ngưỡng 50 trên các thanh, để "≥ 50 là Ổn" nằm ngay trong biểu đồ.
- Trước khi chốt, khung 4 thanh vẫn hiện (thanh rỗng, giá trị "—") thay cho hộp viền nét đứt.
- Câu hỏi cho lớp và lời phán quyết không lồng thành thẻ trong thẻ.
- Font tự đóng gói qua `@fontsource/be-vietnam-pro` để chạy được khi phòng học không có mạng.
- Ván đang chơi lưu ở dạng các quyết định; khi tải lại, điểm được tính lại bằng simulate() nên dữ liệu bị sửa tay không làm sai điểm.
- Kết quả tốt nhất: nhiều ngày "cả 4 bên Ổn" hơn thì tốt hơn; bằng nhau thì tổng điểm 20 thanh cao hơn; vẫn bằng thì ván cũ hơn giữ vị trí.
- Lịch sử giữ 50 ván gần nhất; kết quả tốt nhất lưu riêng nên không mất khi ván cũ bị đẩy ra.
- "Xóa dữ liệu" xóa toàn bộ key `cbcx:v1` (lịch sử, kết quả tốt nhất, ván dở) và đưa game về màn mở đầu; xác nhận ngay tại chỗ (không dùng hộp thoại nổi).
- Màn "Lịch sử chơi" gắn với `#lich-su` trên URL để nút Back của trình duyệt hoạt động.
- Khi localStorage không dùng được, đầu trang hiện một dòng nhỏ: không lưu được, game vẫn chơi bình thường.

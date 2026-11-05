# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React (JSX), JavaScript không TypeScript, vitest cho phần logic. Người dùng chọn: ban đầu ghi "không framework", sau đó đổi sang React + JSX (2026-10-26).

## Users

Giảng viên hoặc nhóm thuyết trình môn MLN122 điều khiển game trên máy chiếu cho cả lớp xem và thảo luận. Sinh viên cũng có thể tự mở trên điện thoại.

## Product Purpose

Game mô phỏng 5 ngày giúp lớp học trải nghiệm quan hệ lợi ích kinh tế giữa tài xế, nền tảng gọi xe, khách hàng và xã hội: mỗi ngày chọn mức chiết khấu và chính sách, xem bốn thanh lợi ích, thảo luận câu hỏi cho lớp. Thành công là lớp rút ra được ba kết luận của bài học từ chính các lựa chọn của mình.

## Positioning

Minh họa chủ đề quan hệ lợi ích trong chương 5 giáo trình Kinh tế chính trị Mác–Lênin bằng tình huống có biến cố và hệ quả đo được. Nguồn và vị trí tra cứu theo từng bản tài liệu ghi tại `docs/teaching-research.md`.

## Operating Context

Phòng học có máy chiếu, người xem ngồi xa màn hình. Người chơi tham gia bằng điện thoại hoặc máy tính qua QR, liên kết hoặc mã phòng; cùng mạng Wi-Fi hoặc truy cập máy chủ Internet. Chủ phòng xem điểm trực tiếp. Một ván khoảng 10–15 phút kèm thảo luận. Chế độ cá nhân chạy được khi không có mạng ngoài và lưu trên trình duyệt; chế độ phòng cần kết nối máy chủ Node.

## Capabilities and Constraints

- 5 ngày, mỗi ngày một biến cố cố định; thanh chiết khấu 15–40%; hai chính sách bật/tắt; bốn thanh lợi ích, từ 50 trở lên là Ổn.
- Biến cố phải làm thị trường thay đổi, người chơi cần điều chỉnh để đưa các bên về ngưỡng ổn (yêu cầu ngày 2/11/2026). Mô hình v3 giữ sức ép cạnh tranh và tranh chấp thu nhập, đồng thời tính áp lực chờ giờ cao điểm từ mức thiếu tài xế thay vì trừ cố định: thu hút thêm xe làm áp lực giảm, đủ xe thì hết phần phạt thiếu xe. Không có một cấu hình thắng cả 5 ngày. Bốn thanh hiển thị dự tính ngay khi điều chỉnh. Mô hình v1/v2 chỉ dùng để đọc đúng lịch sử cũ.
- Sau khi chốt: thông điệp cho đủ 16 tổ hợp trạng thái (cả bốn xanh và 15 tổ hợp đỏ), nguyên nhân gắn với biến cố và hướng giải quyết. Câu hỏi có đáp án gợi ý mặc định đóng, bấm mới hiện (người dùng yêu cầu ngày 2026-10-26).
- Nội dung được tìm nguồn và đối chiếu Kinh tế chính trị Mác–Lênin theo yêu cầu ngày 2026-10-27; có mục cơ sở lý luận và nguồn. Các thông điệp là diễn giải vận dụng, không tự phân loại mâu thuẫn chỉ từ hành động tắt app.
- Chế độ cá nhân lưu ván dở, lịch sử ván đã xong và kết quả tốt nhất trong localStorage (key `cbcx:v1`).
- Chế độ phòng (yêu cầu 4/11/2026): Node.js + Socket.IO quản lý phòng, quyền chủ/người chơi, tự tính điểm và cập nhật bảng chủ phòng sau mỗi quyết định đã chốt. Mỗi người tự chơi 5 ngày sau khi chủ phòng bắt đầu; không nhận người mới giữa ván. Phiên lưu riêng trong tab để tải lại và nối lại.
- Cuối ván phòng có 5 câu trắc nghiệm, 10 điểm/câu, tự chấm trên máy chủ; điểm hiển thị riêng. Đáp án mở khi tất cả nộp hoặc chủ phòng kết thúc. Xếp hạng theo ngày cân bằng, tổng lợi ích, rồi trắc nghiệm; bằng nhau cùng hạng.
- Mặc định tối đa 100 người/phòng, hết hạn sau 24 giờ không hoạt động. Node riêng hỗ trợ JSON cục bộ nguyên tử cho một tiến trình hoặc Redis dùng chung.
- Triển khai Vercel (sửa ngày 5/11/2026): Vite frontend + Node Functions, Socket.IO WebSocket trực tiếp tại `/api/rooms`, Redis bắt buộc để đồng bộ quyết định, thông báo điểm và presence giữa các instance. Có API health/config và lỗi thiết lập rõ ràng; không tạo phòng tạm trong file hoặc bộ nhớ khi thiếu Redis. Production và preview có namespace riêng, kết nối lại khôi phục trạng thái chung.

## Brand Commitments

Nền tối #121331; màu bốn bên: tài xế #2EC4B6, nền tảng #FF7A5C, khách hàng #FFC145, xã hội #A99BFF; font Be Vietnam Pro. Nội dung tiếng Việt giữ theo bản gốc.

## Evidence on Hand

- Mốc chiết khấu chuẩn của Grab: 20% (xe máy) và 25% (ô tô), theo Báo Pháp Luật Việt Nam, 10/9/2026 (trích trong bản gốc).
- Dùng ngôn ngữ tình huống thực tiễn trong nội dung hiển thị, không dùng từ "game" (yêu cầu ngày 2/11/2026). Số liệu vẫn là giả định; trang ghi "Tình huống học tập · số liệu giả định để minh họa". Nguồn lý luận được bổ sung theo yêu cầu nghiên cứu ngày 2026-10-27, ghi rõ phiên bản và nội dung đã kiểm tra; không thêm số liệu hay chứng thực thực tế chưa xác minh.

## Product Principles

- Màu nói về các bên: mỗi màu chỉ gắn với một bên.
- Đọc được từ cuối phòng: điểm số và trạng thái rõ bằng chữ, không chỉ bằng màu.
- Không mất ván: tải lại trang vẫn chơi tiếp; lỗi lưu trữ không làm hỏng game.

## Accessibility & Inclusion

Tương phản chữ ≥ 4.5:1; điều khiển bằng bàn phím; tôn trọng prefers-reduced-motion.

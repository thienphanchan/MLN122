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

Biến mục 5.3.1 giáo trình Kinh tế chính trị Mác – Lênin (Bộ GD&ĐT, 2021) thành một tình huống có biến cố và hệ quả đo được, thay vì đọc định nghĩa.

## Operating Context

Phòng học có máy chiếu, người xem ngồi xa màn hình; có thể không có mạng. Một ván khoảng 10–15 phút kèm thảo luận. Dữ liệu chỉ lưu trên trình duyệt đang dùng.

## Capabilities and Constraints

- 5 ngày, mỗi ngày một biến cố cố định; thanh chiết khấu 15–40%; hai chính sách bật/tắt; bốn thanh lợi ích, từ 50 trở lên là Ổn.
- Công thức tính điểm giữ nguyên bản gốc (artifact "Cân bằng chuyến xe", hàm simulate()).
- Lưu ván dở, lịch sử ván đã xong và kết quả tốt nhất trong localStorage (key `cbcx:v1`). Không có máy chủ.

## Brand Commitments

Nền tối #121331; màu bốn bên: tài xế #2EC4B6, nền tảng #FF7A5C, khách hàng #FFC145, xã hội #A99BFF; font Be Vietnam Pro. Nội dung tiếng Việt giữ theo bản gốc.

## Evidence on Hand

- Mốc chiết khấu chuẩn của Grab: 20% (xe máy) và 25% (ô tô), theo Báo Pháp Luật Việt Nam, 10/9/2026 (trích trong bản gốc).
- Mọi số liệu trong game là giả định; trang luôn ghi "Mô phỏng giả định · số liệu trong game không phải số liệu thực tế". Không thêm số liệu, trích dẫn hay chứng thực nào khác.

## Product Principles

- Màu nói về các bên: mỗi màu chỉ gắn với một bên.
- Đọc được từ cuối phòng: điểm số và trạng thái rõ bằng chữ, không chỉ bằng màu.
- Không mất ván: tải lại trang vẫn chơi tiếp; lỗi lưu trữ không làm hỏng game.

## Accessibility & Inclusion

Tương phản chữ ≥ 4.5:1; điều khiển bằng bàn phím; tôn trọng prefers-reduced-motion.

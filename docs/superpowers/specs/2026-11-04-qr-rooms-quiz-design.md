# Phòng tham gia bằng QR và trắc nghiệm cuối ván

Ngày: 2026-11-04. Trạng thái: bản đề xuất để người dùng duyệt trước khi triển khai.

## Mục đích và yêu cầu đã xác nhận

- Người tổ chức tạo phòng và đưa mã QR để người chơi quét tham gia.
- Người chơi dùng điện thoại hoặc máy tính; giao diện phù hợp cả hai.
- Giữ quy trình mô phỏng 5 ngày, biến cố, mức chiết khấu, hai chính sách và công thức hiện tại.
- Chủ phòng nhìn thấy điểm của từng người cập nhật theo thời gian thực.
- Sau 5 ngày có phần trắc nghiệm, hệ thống tự chấm.

## Hiện trạng và phạm vi

Bản đang phát triển nằm trong `can-bang-chuyen-xe/`: Vite, React + JSX, JavaScript, Vitest và Playwright. Điểm được tính bởi các hàm thuần trong `src/game/`; dữ liệu hiện lưu cục bộ bằng localStorage. Các file HTML và JavaScript ở gốc repository là bản cũ.

Thay đổi này thêm chế độ phòng nhiều người vào bản React. Tiếp tục hỗ trợ chơi cá nhân, lịch sử cũ và dữ liệu `cbcx:v1`. Giữ màu, font, nội dung lý luận đã đối chiếu và các câu hỏi thảo luận sau mỗi ngày. Không triển khai tài khoản, thanh toán, chat hoặc dịch vụ lưu trữ đám mây bắt buộc.

## Các hướng thực hiện

1. **Máy chủ Node.js đi cùng ứng dụng (đề xuất):** dùng chung lõi game trên máy chủ và trình duyệt; kết nối Socket.IO để gửi sự kiện phòng và bảng điểm. Chạy được trong mạng lớp học hoặc trên máy chủ công khai. Cần tiến trình máy chủ hoạt động khi chơi.
2. **Dịch vụ realtime bên ngoài:** hỗ trợ nhiều thiết bị qua Internet nhưng cần tài khoản, cấu hình dự án, quy tắc truy cập và triển khai hàm chấm điểm. Hiện repository chưa có dịch vụ hoặc thông tin kết nối nào.

Chỉ tạo QR dẫn tới bản tĩnh không đáp ứng yêu cầu bảng điểm giữa nhiều thiết bị. Hướng 1 là lựa chọn kỹ thuật đề xuất của người thực hiện, chưa được ghi nhận là lựa chọn đã duyệt của người dùng.

## Luồng người tổ chức

1. Trang đầu có lối vào tạo phòng và tham gia phòng bên cạnh chế độ cá nhân.
2. Tạo phòng trả về mã phòng ngẫu nhiên, liên kết tham gia và mã QR được sinh trong ứng dụng. Mã QR chỉ chứa liên kết công khai của người chơi.
3. Phòng chờ hiển thị người đã tham gia và trạng thái kết nối. Chủ phòng bấm Bắt đầu khi sẵn sàng.
4. Khi phòng đang chơi, chủ phòng thấy bảng gồm tên, trạng thái kết nối, ngày đang chơi, số ngày cả bốn bên ổn, tổng điểm lợi ích, điểm trắc nghiệm và trạng thái hoàn thành. Mỗi lần chốt quyết định hoặc nộp trắc nghiệm, bảng cập nhật qua kết nối realtime.
5. QR và liên kết vẫn có thể xem lại. Khi đã bắt đầu, không nhận người mới; người đã có phiên hợp lệ vẫn kết nối lại được.
6. Khi mọi người đã nộp trắc nghiệm, phòng tự chuyển sang hoàn tất. Chủ phòng cũng có thể kết thúc sớm; giao diện nói rõ ai chưa nộp, những người đó giữ điểm các lượt đã chốt và trắc nghiệm chưa nộp nhận 0.

## Luồng người chơi

1. Quét QR, mở liên kết hoặc nhập mã phòng trên điện thoại/máy tính.
2. Nhập tên hiển thị có giới hạn độ dài; tên đã dùng trong phòng được báo để chọn tên khác. Không cần đăng ký.
3. Chờ chủ phòng bắt đầu. Sau đó mỗi người tự điều chỉnh và chốt lần lượt 5 ngày trên thiết bị của mình; không phải chờ người khác sang ngày.
4. Thanh điểm dự tính trên thiết bị giữ nguyên. Chỉ điểm đã chốt được gửi vào bảng điểm chủ phòng, tránh tính thử thành kết quả chính thức.
5. Sau phần ngày 5, hiển thị trắc nghiệm trước màn kết quả cuối. Người chơi chọn đủ đáp án rồi nộp một lần.
6. Hiển thị điểm cá nhân và trạng thái chờ hoàn tất phòng. Chỉ công bố đáp án và giải thích sau khi phòng đã hoàn tất để người chơi xong sớm không xem đáp án ngay khi người khác còn làm.

## Trắc nghiệm và cách tính điểm đề xuất

- Mặc định 5 câu, mỗi câu 4 lựa chọn, 1 đáp án đúng, mỗi câu đúng 10 điểm; tối đa 50 điểm. Chưa có giới hạn thời gian hoặc điểm thưởng tốc độ.
- Nội dung bám 5 tình huống và các phần giải thích đã có trong `discussion.js`, `teaching.js`: hài hòa lợi ích, chia sẻ rủi ro, chi phí cạnh tranh, nhận diện mâu thuẫn, quan hệ lợi ích khách hàng và nguồn tài xế.
- Không suy diễn tính đối kháng chỉ từ việc tắt ứng dụng; không thêm số liệu thực tế hoặc nguồn lý luận chưa kiểm chứng.
- Máy chủ giữ đáp án đúng, tự chấm từ các lựa chọn được gửi lên. Dữ liệu câu hỏi công khai chỉ có mã, nội dung và lựa chọn.
- Giữ số ngày cả bốn bên ổn và tổng điểm lợi ích theo mô hình hiện tại. Điểm trắc nghiệm hiển thị ở cột riêng, không cộng trực tiếp vào tổng 20 thanh lợi ích.
- Bảng xếp hạng phòng ưu tiên số ngày cả bốn bên ổn, tiếp đến tổng điểm lợi ích, rồi điểm trắc nghiệm. Bằng cả ba thì cùng hạng. Thứ tự này là đề xuất để bảo toàn tiêu chí mô phỏng hiện có.

## Trạng thái, giao tiếp và tính đúng đắn

- Vòng đời phòng: `lobby` → `playing` → `finished`. Mỗi người có tiến độ riêng: chờ, đang chơi ngày 1–5, đang làm trắc nghiệm, đã nộp.
- Máy chủ có quyền quyết định trạng thái: xác thực từng hành động theo phòng, vai trò, ngày và tiến độ; tính lại điểm từ quyết định bằng chính lõi mô phỏng. Không nhận điểm do trình duyệt tự khai.
- Tạo phòng sinh token bí mật riêng của chủ phòng; tham gia sinh token riêng của người chơi. Các token không có trong QR, liên kết tham gia hoặc dữ liệu công khai của bảng điểm.
- Token được giữ trong phiên tab để tải lại có thể khôi phục đúng vai trò. Mất token không được phép mạo danh bằng tên hiển thị. Hai tab tham gia mới có thể tạo hai người khác nhau; một token đang dùng nhiều kết nối vẫn chỉ có một tiến độ.
- Các thao tác thay đổi phòng có phản hồi thành công/lỗi rõ ràng. Dùng mã yêu cầu và kiểm tra tiến độ để gửi lại sau khi mất mạng không tính hai lần.
- Khi kết nối lại, máy chủ gửi toàn bộ trạng thái được phép xem. Tạm mất mạng khóa nút nộp và thông báo kết nối lại; giữ lựa chọn đang soạn trên thiết bị cho tới khi đồng bộ được. Chủ phòng mất kết nối không dừng tiến độ người chơi.
- Máy chủ khôi phục được phòng sau khi khởi động lại: ghi trạng thái phòng vào một kho JSON cục bộ ngoài thư mục public, tuần tự hóa thao tác ghi và thay file nguyên tử. Chỉ xác nhận quyết định/nộp bài sau khi ghi thành công. Kho lỗi thì trả lỗi rõ ràng, không báo đã lưu.
- Chỉ hỗ trợ một tiến trình máy chủ ở bản này; nhiều máy chủ đồng thời cần thay kho phòng bằng cơ sở dữ liệu dùng chung.
- Phòng hết hạn sau 24 giờ kể từ hoạt động hợp lệ gần nhất; thông báo rõ phòng hết hạn hoặc không tồn tại. Giới hạn mặc định 100 người/phòng, giới hạn tạo/tham gia/nộp để tránh spam vô tình. Các thông số có thể cấu hình.

## Triển khai và truy cập từ điện thoại

- Phát triển: Vite chuyển tiếp API và Socket.IO tới máy chủ Node; có lệnh chạy cả hai. Production: Node phục vụ bản build cùng origin và Socket.IO.
- Liên kết QR lấy từ địa chỉ công khai được cấu hình. Trong mạng lớp học, dùng IP LAN của máy chủ, bind địa chỉ mạng và cho phép cổng đó qua firewall khi cần. Nếu mở ở localhost, giao diện nhắc cấu hình địa chỉ mà điện thoại truy cập được thay vì tạo QR localhost để chia sẻ.
- Chạy Internet cần máy chủ hỗ trợ tiến trình Node và kết nối realtime, tên miền HTTPS và URL công khai. Triển khai thực tế lên dịch vụ hoặc tài khoản bên ngoài chưa thuộc phạm vi được cung cấp trong cuộc trao đổi này; cung cấp cấu hình và cách chạy cụ thể trong README.
- Không nhúng token hay địa chỉ tuyệt mật vào bản build. Kho phòng được bỏ qua trong Git; máy chủ không phục vụ kho dữ liệu tĩnh.

## Chất lượng giao diện và kiểm chứng

- Tận dụng hệ thống giao diện hiện tại. Màn chủ phòng có bảng đọc được khi chiếu; màn người chơi có bố cục một cột trên điện thoại. QR có nền sáng, vùng trống đủ rộng, cùng mã và nút sao chép liên kết.
- Điều khiển bằng bàn phím; radio có nhãn; lỗi biểu mẫu liên kết trường tương ứng; thông báo kết nối và nộp bài có aria-live. Không chỉ dùng màu để diễn tả trạng thái.
- Kiểm thử giữ các test mô phỏng và dữ liệu cũ; bổ sung máy chủ cho phân quyền, tiến độ, tính điểm, nộp lặp, vào muộn, nộp thiếu, khôi phục và kết thúc sớm.
- Kiểm tra giao diện với ít nhất một chủ phòng và hai người chơi ở các browser context độc lập, có viewport điện thoại và máy tính. Xác minh bảng điểm cập nhật sau chốt/nộp, refresh nối lại, không lộ đáp án trước kết thúc và luồng cá nhân không hỏng.
- Trước bàn giao chạy test logic, build và kiểm thử giao diện phù hợp. README ghi rõ điều kiện mạng để quét QR trên thiết bị khác và giới hạn một tiến trình.

## Các quyết định mặc định để người dùng duyệt cùng bản thiết kế

- Mỗi người tự chơi lần lượt 5 ngày sau khi chủ phòng bắt đầu.
- 5 câu trắc nghiệm × 10 điểm, không giới hạn thời gian; điểm để riêng.
- Bảo toàn tiêu chí xếp hạng mô phỏng; trắc nghiệm là tiêu chí tiếp theo khi bằng điểm mô phỏng.
- Khóa người mới khi đã bắt đầu; tự hoàn tất khi mọi người nộp, có nút chủ phòng kết thúc sớm.
- Dùng máy chủ Node.js + Socket.IO, kho phòng cục bộ và QR sinh ngay trong ứng dụng.

Đây là bản thiết kế mở rộng nhiều thiết bị, cần người dùng chốt trước bước kế hoạch và triển khai.

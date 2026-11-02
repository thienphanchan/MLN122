# Cân bằng chuyến xe

Game mô phỏng 5 ngày cho môn MLN122 (Lợi ích kinh tế và quan hệ lợi ích kinh tế). Mỗi ngày người chơi chọn mức chiết khấu của nền tảng gọi xe và bật/tắt hai chính sách. Bốn thanh lợi ích cập nhật ngay khi điều chỉnh và hiện mức thay đổi so với ngày trước. Số liệu trong game là giả định.

## Biến động thị trường

Biến cố của ngày mới tác động ngay lên phương án giữ từ hôm trước. Xăng tăng gây sức ép thu nhập; cạnh tranh làm chi phí tài trợ chính sách nặng hơn; tranh chấp làm nguồn tài xế suy giảm ngay cả khi đã đối thoại; nhu cầu giờ cao điểm làm điểm khách hàng giảm. Người chơi quan sát, điều chỉnh rồi chốt. Không có một cấu hình chiết khấu/chính sách giữ xanh cả 5 ngày; mỗi ngày đều có phương án cân bằng. Ngưỡng ổn vẫn là 50.

Mô hình v2 được cân chỉnh ngày 2/11/2026 theo yêu cầu biến cố phải buộc người chơi thích ứng. Đây là các sức ép giả định theo 5 tình huống cố định, không phải dữ liệu thị trường trực tiếp. Lịch sử cũ được giữ nguyên điểm và kiểm tra bằng mô hình v1; ván dở được tính lại theo mô hình hiện tại khi tải lại.

## Chạy

```bash
npm install
npm run dev      # mở http://localhost:5173
npm test         # chạy test logic (vitest)
npm run test:ui  # build và kiểm tra giao diện bằng Google Chrome thật (Playwright)
npm run build    # bản production trong dist/
npm run preview  # xem thử bản production
```

Font Be Vietnam Pro được đóng gói sẵn, nên bản build chạy được cả khi không có mạng. Thư mục `dist/` cần được mở qua một web server (`npm run preview`, hoặc `npx serve dist`); mở thẳng `dist/index.html` bằng cách nhấp đúp sẽ ra trang trắng vì trình duyệt chặn module JavaScript từ `file://`.

`npm run test:ui` cần Google Chrome đã cài trên máy (nếu chưa có: `npx playwright install chrome`). Kịch bản nằm trong `tests/ui/game.e2e.js`; Playwright tự mở server preview tại `127.0.0.1:4173` rồi đóng khi xong, nên cần để trống cổng này. Các ca chạy trên bản production ở 1440×900, 768×1024 và 390×844, mỗi ca có dữ liệu trình duyệt riêng: kiểm tra trọn ván 5 ngày, biến động và thanh dự tính, thông điệp tốt/xấu, mở/đóng đáp án bằng chuột và bàn phím, tải lại, lịch sử, dữ liệu trùng/sửa tay, ngữ nghĩa truy cập, xác nhận xóa và font. Khi lỗi, ảnh cùng trace được lưu trong `test-results/`.

## Thông điệp và thảo luận sau mỗi ngày

Sau khi chốt, game đưa focus tới bốn thanh lợi ích. Bên dưới là thông điệp riêng cho kết quả, phần **Vì sao?** gắn với biến cố của ngày và **Hướng giải quyết**. Nội dung phủ đủ 16 trường hợp: tất cả cùng ổn; từng bên đỏ; sáu cặp đỏ; bốn nhóm ba bên đỏ; cả bốn cùng đỏ. Kiểm thử duyệt cả 520 cấu hình để kiểm tra phân loại và yêu cầu thích ứng giữa các ngày.

Mỗi câu hỏi có nút mở **Xem đáp án gợi ý** (hỗ trợ Enter/Space). Đáp án đóng sẵn, đặt lại khi sang ngày hoặc tải lại để lớp thảo luận trước khi xem. Nội dung này là gợi ý phân tích tình huống của game, không phải trích nguyên văn giáo trình.

Mục **Cơ sở lý luận và nguồn** trong từng thông điệp và màn tổng kết cho phép mở phần liên hệ Kinh tế chính trị Mác–Lênin. Đáp án cũng có liên kết nguồn. [Hồ sơ nghiên cứu](docs/teaching-research.md) ghi rõ bản tài liệu đã đọc, trang đối chiếu, các sửa đổi và giới hạn; không gán số trang của bản công khai cho ấn bản 2021. Đáp án ngày 4 không tự kết luận tính chất đối kháng chỉ từ hành động tắt app.

## Cấu trúc

```
src/
  main.jsx            điểm vào: nạp font, CSS, tạo store và render <App>
  App.jsx             chọn màn hình (mở đầu, chơi, tổng kết, lịch sử), focus và thông báo
  store.js            trạng thái app + ghi localStorage sau mỗi thay đổi (không phụ thuộc React)
  storage.js          đọc/ghi localStorage, key "cbcx:v1", mọi thao tác bọc try/catch
  game/
    events.js         5 biến cố
    discussion.js     đáp án gợi ý và liên hệ bài học cho 5 câu hỏi
    feedback.js       16 thông điệp theo tổ hợp đỏ, nguyên nhân và hướng giải quyết
    teaching.js       cơ sở lý luận, danh mục nguồn và liên hệ từng tổ hợp
    simulate.js       mô hình biến động v2; v1 để đọc lịch sử cũ
    state.js          trạng thái ván chơi và các bước chuyển (hàm thuần), lưu/khôi phục
    records.js        bản ghi ván đã xong, kết quả tốt nhất (giữ 50 ván gần nhất)
  ui/                 Header, Intro, Play, End, History, DayMarks, Icon (.jsx)
  tokens.css          màu, cỡ chữ, khoảng cách
  base.css            nền tảng chung (reset, focus, giảm chuyển động)
  styles.css          giao diện các màn
tests/
  simulate.test.js    biến động, phương án cân bằng, chống thắng cố định và đối chiếu v1
  feedback.test.js    đủ 16 tổ hợp, phân loại 520 cấu hình, biến cố và khôi phục
  state.test.js       luật chơi, tổng kết, lưu và khôi phục ván
  records.test.js     bản ghi ván, kết quả tốt nhất
  storage.test.js     lưu, đọc lại, dữ liệu hỏng, trình duyệt chặn lưu trữ
  store.test.js       lưu sau mỗi bước, ghi ván đúng một lần, xóa dữ liệu
  ui/game.e2e.js      kiểm tra giao diện trên Chrome thật ở ba kích thước
```

## Dữ liệu lưu trên trình duyệt

Một key duy nhất `cbcx:v1` chứa JSON `{ version: 1, current, games, best }`:

- `current`: ván đang chơi, chỉ lưu các quyết định. Khi tải lại, điểm được tính lại bằng `simulate()`.
- `games`: tối đa 50 ván đã xong, mới nhất trước. Mỗi ván mới có `modelVersion: 2`, thời điểm, số ngày cả bốn bên ổn, tổng điểm, và lựa chọn cùng điểm của từng ngày. Ván cũ không có `modelVersion` dùng công thức v1 để kiểm tra điểm.
- `best`: ván tốt nhất. Ván có nhiều ngày cả bốn bên ổn hơn thì tốt hơn; nếu bằng nhau thì so tổng điểm.

Phần dữ liệu nào hỏng thì chỉ phần đó bị bỏ qua: ván dở hỏng không làm mất lịch sử, và một ván trong lịch sử có điểm không khớp với các lựa chọn của nó sẽ bị loại. Khi dữ liệu bị sửa tay có nhiều ván cùng mã, chỉ giữ bản hợp lệ đầu tiên theo thứ tự đã lưu; sau đó lấy tối đa 50 ván. Nếu trình duyệt không cho lưu, game vẫn chơi bình thường và đầu trang báo là không lưu được. Mở game ở nhiều tab: khi một tab ghi hoặc xóa dữ liệu, các tab khác đọc lại nên không ghi đè lên nhau.

## Khác so với bản gốc

- Thêm: lưu ván dở, lịch sử 50 ván, kết quả tốt nhất, màn "Lịch sử chơi" và nút "Xóa dữ liệu".
- Giữ 5 biến cố/câu hỏi. Mô hình v2 tăng sức ép của biến cố để người chơi phải thích ứng; v1 vẫn được đối chiếu với bản gốc để bảo toàn lịch sử. Phần liên hệ, rút ra và kết luận được chỉnh theo đợt đối chiếu lý luận ngày 27/10/2026, có nguồn và ghi rõ giới hạn mô phỏng.
- Thêm thông điệp tốt/xấu theo đủ 16 tổ hợp, nguyên nhân theo biến cố, hướng giải quyết và đáp án gợi ý chỉ hiện khi mở.
- Màu: bốn màu chỉ dùng cho bốn bên. Nút chính đổi thành nền sáng chữ tối, thẻ biến cố đổi từ nền vàng sang nền sáng (vàng là màu của Khách hàng).
- Bỏ nhãn chữ hoa giãn cách ("BIẾN CỐ HÔM NAY", "HỎI CẢ LỚP"), badge "5 ngày · 4 bên · 1 chuyến xe" và số 01/02/03; thông tin đưa vào tiêu đề và câu.
- Thêm vạch ngưỡng 50 trên mỗi thanh; trước khi chốt, bốn thanh hiện dự tính và cập nhật theo từng lựa chọn, kèm mức thay đổi so với ngày trước.
- Tiến độ 5 ngày là các ô số có dấu tích hoặc dấu nhân (không chỉ dựa vào màu); trạng thái Ổn/Nguy hiểm luôn có chữ.
- Thanh điểm 0 hiện rỗng thật (bản gốc vẽ một vệt 2%).
- Chữ lớn hơn trên màn từ 1400×860 trở lên (máy chiếu); bố cục một cột trên điện thoại.

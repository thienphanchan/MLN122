# Cân bằng chuyến xe

Game mô phỏng 5 ngày cho môn MLN122 (Lợi ích kinh tế và quan hệ lợi ích kinh tế). Mỗi ngày người chơi chọn mức chiết khấu của nền tảng gọi xe và bật/tắt hai chính sách, rồi xem bốn thanh lợi ích của tài xế, nền tảng, khách hàng và xã hội. Số liệu trong game là giả định.

## Chạy

```bash
npm install
npm run dev      # mở http://localhost:5173
npm test         # chạy test logic (vitest)
npm run build    # bản production trong dist/
npm run preview  # xem thử bản production
```

Font Be Vietnam Pro được đóng gói sẵn, nên bản build chạy được cả khi không có mạng. Thư mục `dist/` cần được mở qua một web server (`npm run preview`, hoặc `npx serve dist`); mở thẳng `dist/index.html` bằng cách nhấp đúp sẽ ra trang trắng vì trình duyệt chặn module JavaScript từ `file://`.

## Cấu trúc

```
src/
  main.jsx            điểm vào: nạp font, CSS, tạo store và render <App>
  App.jsx             chọn màn hình (mở đầu, chơi, tổng kết, lịch sử), focus và thông báo
  store.js            trạng thái app + ghi localStorage sau mỗi thay đổi (không phụ thuộc React)
  storage.js          đọc/ghi localStorage, key "cbcx:v1", mọi thao tác bọc try/catch
  game/
    events.js         5 biến cố
    simulate.js       simulate() và explain(): công thức giữ nguyên bản gốc
    state.js          trạng thái ván chơi và các bước chuyển (hàm thuần), lưu/khôi phục
    records.js        bản ghi ván đã xong, kết quả tốt nhất (giữ 50 ván gần nhất)
  ui/                 Header, Intro, Play, End, History, DayMarks, Icon (.jsx)
  tokens.css          màu, cỡ chữ, khoảng cách
  base.css            nền tảng chung (reset, focus, giảm chuyển động)
  styles.css          giao diện các màn
tests/
  simulate.test.js    công thức so với bản gốc (tests/fixtures/original.js chép nguyên văn)
  state.test.js       luật chơi, tổng kết, lưu và khôi phục ván
  records.test.js     bản ghi ván, kết quả tốt nhất
  storage.test.js     lưu, đọc lại, dữ liệu hỏng, trình duyệt chặn lưu trữ
  store.test.js       lưu sau mỗi bước, ghi ván đúng một lần, xóa dữ liệu
```

## Dữ liệu lưu trên trình duyệt

Một key duy nhất `cbcx:v1` chứa JSON `{ version: 1, current, games, best }`:

- `current`: ván đang chơi, chỉ lưu các quyết định. Khi tải lại, điểm được tính lại bằng `simulate()`.
- `games`: tối đa 50 ván đã xong, mới nhất trước. Mỗi ván gồm thời điểm, số ngày cả bốn bên ổn, tổng điểm, và lựa chọn cùng điểm của từng ngày.
- `best`: ván tốt nhất. Ván có nhiều ngày cả bốn bên ổn hơn thì tốt hơn; nếu bằng nhau thì so tổng điểm.

Phần dữ liệu nào hỏng thì chỉ phần đó bị bỏ qua: ván dở hỏng không làm mất lịch sử, và một ván trong lịch sử có điểm không khớp với các lựa chọn của nó sẽ bị loại. Nếu trình duyệt không cho lưu, game vẫn chơi bình thường và đầu trang báo là không lưu được. Mở game ở nhiều tab: khi một tab ghi hoặc xóa dữ liệu, các tab khác đọc lại nên không ghi đè lên nhau.

## Khác so với bản gốc

- Thêm: lưu ván dở, lịch sử 50 ván, kết quả tốt nhất, màn "Lịch sử chơi" và nút "Xóa dữ liệu".
- Công thức `simulate()`, 5 biến cố, lời giải thích, tổng kết, 3 kết luận và dòng căn cứ giữ nguyên chữ.
- Màu: bốn màu chỉ dùng cho bốn bên. Nút chính đổi thành nền sáng chữ tối, thẻ biến cố đổi từ nền vàng sang nền sáng (vàng là màu của Khách hàng).
- Bỏ nhãn chữ hoa giãn cách ("BIẾN CỐ HÔM NAY", "HỎI CẢ LỚP"), badge "5 ngày · 4 bên · 1 chuyến xe" và số 01/02/03; thông tin đưa vào tiêu đề và câu.
- Thêm vạch ngưỡng 50 trên mỗi thanh; trước khi chốt, bốn thanh hiện rỗng với "—" và "Chờ chốt".
- Tiến độ 5 ngày là các ô số có dấu tích hoặc dấu nhân (không chỉ dựa vào màu); trạng thái Ổn/Nguy hiểm luôn có chữ.
- Thanh điểm 0 hiện rỗng thật (bản gốc vẽ một vệt 2%).
- Chữ lớn hơn trên màn từ 1400×860 trở lên (máy chiếu); bố cục một cột trên điện thoại.

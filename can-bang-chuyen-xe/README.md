# Cân bằng chuyến xe

Game mô phỏng 5 ngày cho môn MLN122 (Lợi ích kinh tế và quan hệ lợi ích kinh tế). Mỗi ngày người chơi chọn mức chiết khấu của nền tảng gọi xe và bật/tắt hai chính sách. Bốn thanh lợi ích cập nhật ngay khi điều chỉnh và hiện mức thay đổi so với ngày trước. Số liệu trong game là giả định.

## Phòng QR, bảng điểm trực tiếp và trắc nghiệm

Chọn **Tạo phòng** để lấy mã phòng, mã QR và liên kết tham gia. Người chơi mở trên điện thoại hoặc máy tính, nhập tên rồi vào phòng chờ. Chủ phòng bấm **Bắt đầu phòng**; mỗi người tự điều phối đủ 5 ngày. Điểm trên màn chủ phòng cập nhật ngay sau mỗi lần chốt quyết định và nộp bài.

Sau ngày 5 có 5 câu trắc nghiệm, mỗi câu đúng 10 điểm, tối đa 50 điểm. Bài chỉ nộp một lần và phải trả lời đủ 5 câu. Điểm trắc nghiệm hiển thị riêng; thứ tự xếp hạng là số ngày cả bốn bên ổn → tổng điểm lợi ích → điểm trắc nghiệm. Bằng cả ba thì cùng hạng. Đáp án và giải thích chỉ mở khi mọi người đã nộp hoặc chủ phòng xác nhận kết thúc sớm. Người chưa nộp khi kết thúc sớm nhận 0 điểm trắc nghiệm; các quyết định đã chốt được giữ.

Phòng khóa người mới khi bắt đầu, tối đa 100 người/phòng theo mặc định. Mất mạng hoặc tải lại trong cùng tab sẽ khôi phục tiến độ bằng phiên riêng; chủ phòng mất kết nối không dừng người chơi. Trang đầu có liên kết quay lại phòng đã lưu. Không chia sẻ token phiên hoặc file dữ liệu phòng.

### Chạy để điện thoại cùng Wi-Fi quét QR

Yêu cầu Node.js từ 22.12.0. Mở terminal tại thư mục `can-bang-chuyen-xe`:

```bash
npm ci
npm run build
npm start
```

Mở `http://localhost:3001` trên máy chủ. Ứng dụng đề xuất IP mạng để tạo QR; dùng **Đổi địa chỉ chia sẻ** nếu máy có nhiều card mạng/VPN. Ví dụ IP Wi-Fi của máy chủ là `192.168.1.10`, địa chỉ chia sẻ là `http://192.168.1.10:3001`. Điện thoại và máy tính cần truy cập được cùng địa chỉ này. Nếu Windows hỏi, cho phép Node.js trên mạng riêng; cấu hình firewall cho cổng 3001 nếu cần. Mạng khách có chế độ cô lập thiết bị có thể chặn kết nối giữa các máy.

Có thể sao chép `.env.example` thành `.env`, đặt `PUBLIC_ORIGIN=http://IP-WIFI:3001`, rồi khởi động lại. Dùng `ipconfig` trên Windows để xem IPv4 của adapter Wi-Fi. Không dùng `localhost` hoặc `127.0.0.1` để mời thiết bị khác.

### Phát triển và triển khai Internet

`npm run dev` chạy đồng thời Node tại cổng 3001 và Vite tại cổng 5173; Vite chuyển tiếp `/api` và `/socket.io`. Khi chia sẻ bản dev, dùng IP Wi-Fi với cổng **5173** trong `PUBLIC_ORIGIN`. `npm run preview` chỉ phục vụ file tĩnh; chế độ phòng cần máy chủ Node.

Để chạy qua Internet, triển khai thư mục này lên dịch vụ hỗ trợ Node.js và WebSocket/long polling. Lệnh build là `npm ci && npm run build`, lệnh start là `npm start`; đặt `PUBLIC_ORIGIN=https://ten-mien-cua-ban`, `HOST=0.0.0.0` và `PORT` do nền tảng cấp. Reverse proxy cần chuyển tiếp `/socket.io` gồm cả nâng cấp WebSocket và HTTP polling về cùng tiến trình Node. Tài liệu API chính thức: [Socket.IO server](https://socket.io/docs/v4/server-api/), [Socket.IO client](https://socket.io/docs/v4/client-api/).

Máy chủ ghi phòng vào `data/rooms.json` bằng thay file nguyên tử và chỉ xác nhận sau khi lưu thành công. Gắn thư mục `data/` vào ổ lưu trữ bền vững trên dịch vụ hosting; dừng tiến trình trước khi sao lưu/khôi phục file này. Nếu lưu trên filesystem tạm của dịch vụ, phòng sẽ mất khi dịch vụ thay instance. Bản này dùng **một tiến trình Node**, không chạy nhiều replica cùng ghi một file. Chế độ chơi cá nhân vẫn lưu riêng trong localStorage.

Phòng hết hạn sau 24 giờ không có hoạt động hợp lệ; dữ liệu hết hạn được dọn khi tạo phòng mới. Có thể đặt `ROOM_TTL_HOURS`, `MAX_PLAYERS`, `ROOM_DATA_FILE` theo `.env.example`. Mã phòng và câu hỏi là công khai, token chủ phòng/người chơi và đáp án chấm chỉ được máy chủ quản lý. Đây là triển khai mã nguồn và hướng dẫn vận hành; việc push Git không tự tạo một máy chủ Internet.

## Biến động thị trường

Biến cố của ngày mới tác động ngay lên phương án giữ từ hôm trước. Xăng tăng gây sức ép thu nhập; cạnh tranh làm chi phí tài trợ chính sách nặng hơn; tranh chấp làm nguồn tài xế suy giảm ngay cả khi đã đối thoại. Ngày khách phàn nàn chờ xe lâu, áp lực chờ phụ thuộc mức thiếu tài xế so với nhu cầu giờ cao điểm: cải thiện thu nhập giúp thu hút thêm xe và giảm phần thiệt của khách; khi đủ xe thì hết phần phạt do thiếu xe. Tác động này cũng lan tới lợi ích xã hội. Người chơi quan sát, điều chỉnh rồi chốt. Không có một cấu hình chiết khấu/chính sách giữ xanh cả 5 ngày; mỗi ngày đều có phương án cân bằng. Ngưỡng ổn vẫn là 50.

Mô hình v3 được cân chỉnh ngày 2/11/2026: kế thừa sức ép biến cố của v2 và thay khoản trừ cố định ở giờ cao điểm bằng `max(0, 100 - S) × 1,8`, với `S` là mức sẵn sàng của tài xế trên thang 0–100. Đây là công thức giả định theo 5 tình huống cố định, không phải dữ liệu thị trường trực tiếp. Lịch sử cũ được giữ nguyên điểm và kiểm tra bằng mô hình v1/v2 tương ứng; ván dở được tính lại theo mô hình hiện tại khi tải lại.

## Chạy

```bash
npm install
npm run dev      # Vite :5173 + máy chủ phòng :3001
npm test         # chạy test logic (vitest)
npx playwright install chromium # cài trình duyệt kiểm thử một lần
npm run test:ui  # build và kiểm tra trên Chromium thật (Playwright)
npm run build    # bản production trong dist/
npm start        # phục vụ production và phòng trực tiếp tại :3001
npm run preview  # chỉ xem file tĩnh, không có máy chủ phòng
```

Font Be Vietnam Pro được đóng gói sẵn, nên bản build chạy được cả khi không có mạng. Thư mục `dist/` cần được mở qua một web server (`npm run preview`, hoặc `npx serve dist`); mở thẳng `dist/index.html` bằng cách nhấp đúp sẽ ra trang trắng vì trình duyệt chặn module JavaScript từ `file://`.

`npm run test:ui` dùng Chromium do Playwright quản lý (`npx playwright install chromium`). Kịch bản nằm trong `tests/ui/game.e2e.js` và `tests/ui/rooms.e2e.js`; Playwright tự mở máy chủ production tại `127.0.0.1:4173` rồi đóng khi xong. Để trống cổng này. Các ca chạy ở 1440×900, 768×1024 và 390×844: giữ kiểm tra chế độ cá nhân và thêm chủ phòng cùng hai người chơi trong các browser context độc lập, QR, điểm trực tiếp, khôi phục, tự chấm trắc nghiệm, ẩn đáp án, mã sai và kết thúc sớm. Kho phòng kiểm thử nằm riêng ở `test-results/rooms.json`. Khi lỗi, ảnh cùng trace được lưu trong `test-results/`.

## Thông điệp và thảo luận sau mỗi ngày

Sau khi chốt, game đưa focus tới bốn thanh lợi ích. Bên dưới là thông điệp riêng cho kết quả, phần **Vì sao?** gắn với biến cố của ngày và **Hướng giải quyết**. Nội dung phủ đủ 16 trường hợp: tất cả cùng ổn; từng bên đỏ; sáu cặp đỏ; bốn nhóm ba bên đỏ; cả bốn cùng đỏ. Kiểm thử duyệt cả 520 cấu hình để kiểm tra phân loại và yêu cầu thích ứng giữa các ngày.

Mỗi câu hỏi có nút mở **Xem đáp án gợi ý** (hỗ trợ Enter/Space). Đáp án đóng sẵn, đặt lại khi sang ngày hoặc tải lại để lớp thảo luận trước khi xem. Nội dung này là gợi ý phân tích tình huống của game, không phải trích nguyên văn giáo trình.

Mục **Cơ sở lý luận và nguồn** trong từng thông điệp và màn tổng kết cho phép mở phần liên hệ Kinh tế chính trị Mác–Lênin. Đáp án cũng có liên kết nguồn. [Hồ sơ nghiên cứu](docs/teaching-research.md) ghi rõ bản tài liệu đã đọc, trang đối chiếu, các sửa đổi và giới hạn; không gán số trang của bản công khai cho ấn bản 2021. Đáp án ngày 4 không tự kết luận tính chất đối kháng chỉ từ hành động tắt app.

## Cấu trúc

```
src/
  room/               giao diện tạo/tham gia phòng, QR, bảng điểm, trắc nghiệm và kết nối realtime
  main.jsx            điểm vào: nạp font, CSS, tạo store và render <App>
  App.jsx             chọn màn hình (mở đầu, chơi, tổng kết, lịch sử), focus và thông báo
  store.js            trạng thái app + ghi localStorage sau mỗi thay đổi (không phụ thuộc React)
  storage.js          đọc/ghi localStorage, key "cbcx:v1", mọi thao tác bọc try/catch
  game/
    events.js         5 biến cố
    discussion.js     đáp án gợi ý và liên hệ bài học cho 5 câu hỏi
    feedback.js       16 thông điệp theo tổ hợp đỏ, nguyên nhân và hướng giải quyết
    teaching.js       cơ sở lý luận, danh mục nguồn và liên hệ từng tổ hợp
    simulate.js       mô hình biến động v3; v1/v2 để đọc lịch sử cũ
    state.js          trạng thái ván chơi và các bước chuyển (hàm thuần), lưu/khôi phục
    records.js        bản ghi ván đã xong, kết quả tốt nhất (giữ 50 ván gần nhất)
  ui/                 Header, Intro, Play, End, History, DayMarks, Icon (.jsx)
  tokens.css          màu, cỡ chữ, khoảng cách
  base.css            nền tảng chung (reset, focus, giảm chuyển động)
  styles.css          giao diện các màn
tests/
  rooms.test.js       phân quyền, tiến độ, điểm, nộp lặp, đồng thời, hết hạn và lưu/khôi phục phòng
  server.test.js      kiểm thử socket thật, cập nhật trực tiếp, khôi phục và dữ liệu riêng tư
  simulate.test.js    biến động, phương án cân bằng, chống thắng cố định và đối chiếu v1
  feedback.test.js    đủ 16 tổ hợp, phân loại 520 cấu hình, biến cố và khôi phục
  state.test.js       luật chơi, tổng kết, lưu và khôi phục ván
  records.test.js     bản ghi ván, kết quả tốt nhất
  storage.test.js     lưu, đọc lại, dữ liệu hỏng, trình duyệt chặn lưu trữ
  store.test.js       lưu sau mỗi bước, ghi ván đúng một lần, xóa dữ liệu
  ui/game.e2e.js      kiểm tra giao diện trên Chrome thật ở ba kích thước
```

`server/index.js` phục vụ HTTP và Socket.IO; `server/rooms.js` quản lý vòng đời phòng và tính điểm; `server/repository.js` lưu JSON nguyên tử; `server/quiz.js` giữ đáp án chấm riêng, không đi vào bundle trình duyệt.

## Dữ liệu lưu trên trình duyệt

Một key duy nhất `cbcx:v1` chứa JSON `{ version: 1, current, games, best }`:

- `current`: ván đang chơi, chỉ lưu các quyết định. Khi tải lại, điểm được tính lại bằng `simulate()`.
- `games`: tối đa 50 ván đã xong, mới nhất trước. Mỗi ván mới có `modelVersion: 3`, thời điểm, số ngày cả bốn bên ổn, tổng điểm, và lựa chọn cùng điểm của từng ngày. Ván cũ không có `modelVersion` dùng công thức v1; ván có `modelVersion: 2` vẫn kiểm tra bằng công thức v2.
- `best`: ván tốt nhất. Ván có nhiều ngày cả bốn bên ổn hơn thì tốt hơn; nếu bằng nhau thì so tổng điểm.

Phần dữ liệu nào hỏng thì chỉ phần đó bị bỏ qua: ván dở hỏng không làm mất lịch sử, và một ván trong lịch sử có điểm không khớp với các lựa chọn của nó sẽ bị loại. Khi dữ liệu bị sửa tay có nhiều ván cùng mã, chỉ giữ bản hợp lệ đầu tiên theo thứ tự đã lưu; sau đó lấy tối đa 50 ván. Nếu trình duyệt không cho lưu, game vẫn chơi bình thường và đầu trang báo là không lưu được. Mở game ở nhiều tab: khi một tab ghi hoặc xóa dữ liệu, các tab khác đọc lại nên không ghi đè lên nhau.

## Khác so với bản gốc

- Thêm: lưu ván dở, lịch sử 50 ván, kết quả tốt nhất, màn "Lịch sử chơi" và nút "Xóa dữ liệu".
- Giữ 5 biến cố/câu hỏi. Mô hình hiện tại tăng sức ép của biến cố để người chơi phải thích ứng và tính áp lực chờ từ nguồn tài xế; v1/v2 được giữ để bảo toàn lịch sử. Phần liên hệ, rút ra và kết luận được chỉnh theo đợt đối chiếu lý luận ngày 27/10/2026, có nguồn và ghi rõ giới hạn mô phỏng.
- Thêm thông điệp tốt/xấu theo đủ 16 tổ hợp, nguyên nhân theo biến cố, hướng giải quyết và đáp án gợi ý chỉ hiện khi mở.
- Màu: bốn màu chỉ dùng cho bốn bên. Nút chính đổi thành nền sáng chữ tối, thẻ biến cố đổi từ nền vàng sang nền sáng (vàng là màu của Khách hàng).
- Bỏ nhãn chữ hoa giãn cách ("BIẾN CỐ HÔM NAY", "HỎI CẢ LỚP"), badge "5 ngày · 4 bên · 1 chuyến xe" và số 01/02/03; thông tin đưa vào tiêu đề và câu.
- Thêm vạch ngưỡng 50 trên mỗi thanh; trước khi chốt, bốn thanh hiện dự tính và cập nhật theo từng lựa chọn, kèm mức thay đổi so với ngày trước.
- Tiến độ 5 ngày là các ô số có dấu tích hoặc dấu nhân (không chỉ dựa vào màu); trạng thái Ổn/Nguy hiểm luôn có chữ.
- Thanh điểm 0 hiện rỗng thật (bản gốc vẽ một vệt 2%).
- Chữ lớn hơn trên màn từ 1400×860 trở lên (máy chiếu); bố cục một cột trên điện thoại.

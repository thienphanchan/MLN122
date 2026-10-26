# Cân bằng chuyến xe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng lại game "Cân bằng chuyến xe" thành project Vite + JS thuần chạy độc lập, lưu ván và lịch sử ở localStorage, giữ nguyên công thức simulate() của bản gốc.

**Architecture:** Lõi game là các hàm thuần (simulate, chuyển trạng thái, bản ghi ván) không đụng DOM, được test bằng vitest. `storage.js` là lớp duy nhất chạm localStorage, nhận backend qua tham số để test được cả trường hợp lỗi. UI là các module dựng DOM theo từng màn; `main.js` giữ state, ghi lưu sau mỗi thay đổi và định tuyến `#lich-su`.

**Tech Stack:** Vite (template vanilla), JavaScript ES modules, vitest, `@fontsource/be-vietnam-pro`. Node 22.

> **Đổi giữa chừng (người dùng chọn, sau Task 7):** giao diện chuyển sang React 19 + JSX (`@vitejs/plugin-react`). Trạng thái và lưu trữ gom vào `src/store.js` (không phụ thuộc React, có test), các màn hình thành `src/ui/*.jsx`. Xem các dòng `Ruling:` trong sổ theo dõi.

**Spec:** `docs/superpowers/specs/2026-10-26-can-bang-chuyen-xe-design.md`. Bản gốc để đối chiếu: `D:\MLN122\Main.dc.html`.

## Global Constraints

- Thư mục project: `D:\MLN122\can-bang-chuyen-xe` (tạo bằng `npm create vite@latest can-bang-chuyen-xe -- --template vanilla`).
- Không TypeScript, không framework UI. `npm test` = `vitest run`.
- Key localStorage duy nhất: `"cbcx:v1"`, giá trị JSON có `version: 1`.
- Màu bắt buộc: nền `#121331`; tài xế `#2EC4B6`, nền tảng `#FF7A5C`, khách hàng `#FFC145`, xã hội `#A99BFF`. Font Be Vietnam Pro.
- Thanh chiết khấu `min=15 max=40 step=1`, mặc định 25. Ngưỡng Ổn: `>= 50`.
- Nội dung tiếng Việt của 5 biến cố, lời giải thích, insight, tiêu đề tổng kết, 3 kết luận, dòng căn cứ: chép nguyên văn từ `Main.dc.html`.
- Dòng "Mô phỏng giả định · số liệu trong game không phải số liệu thực tế" hiện trên mọi màn.
- Mọi màu và font trong CSS đi qua token ở `:root`; JS không viết mã màu.
- Không emoji, không ký tự ✓ ✕ làm icon: SVG inline có `aria-hidden="true"`.
- Animation chỉ dùng `transform`/`opacity`, có nhánh `prefers-reduced-motion: reduce`.
- Thư mục không phải git repo và người dùng chưa yêu cầu commit: không có bước commit.

## Review Focus

1. localStorage ném lỗi ngay khi truy cập (trình duyệt chặn lưu trữ): game phải mở và chơi được, đầu trang báo không lưu được. Test ở Task 4.
2. Tải lại trang sau khi đã chốt ngày (đang khóa): phải hiện lại đúng kết quả đã chốt, không cho chọn lại. Test `restoreState` ở Task 3.
3. Dữ liệu cũ hoặc bị sửa tay (round 9, commission 99, history dài hơn round, điểm bị sửa): ván dở bị bỏ, lịch sử lọc bản ghi hỏng, điểm luôn tính lại từ quyết định. Test ở Task 3 và 4.
4. Một ván chỉ được ghi vào lịch sử đúng một lần (bấm đúp "Xem tổng kết", tải lại ở màn tổng kết). Test `next` no-op ở Task 3; ghi bản ghi chỉ khi chuyển play → end ở Task 5.
5. Giá trị thanh trượt lạ ("abc", 14.6, 99): kẹp về số nguyên 15–40. Test ở Task 3.

---

### Task 1: Khởi tạo project

**Files:**
- Create: `can-bang-chuyen-xe/` (scaffold Vite), `can-bang-chuyen-xe/PRODUCT.md`
- Modify: `can-bang-chuyen-xe/package.json` (thêm `"test": "vitest run"`)
- Delete: file mẫu của template (`src/counter.js`, `src/javascript.svg`, `public/vite.svg`, nội dung mẫu trong `src/main.js`, `src/style.css`)

- [ ] **Step 1:** Chạy `npm create vite@latest can-bang-chuyen-xe -- --template vanilla` trong `D:\MLN122` (không tương tác), rồi `npm install`, `npm install -D vitest`, `npm install @fontsource/be-vietnam-pro`.
- [ ] **Step 2:** Xóa file mẫu, đổi `src/style.css` thành `src/styles.css`, viết `PRODUCT.md` theo khuôn impeccable init (người dùng: giảng viên/nhóm thuyết trình MLN122 chiếu cho cả lớp; mục đích: minh họa quan hệ lợi ích kinh tế; ràng buộc: số liệu giả định).
- [ ] **Step 3:** Run `npm run build` → build thành công; `npx vitest run --passWithNoTests` → exit 0.

### Task 2: Biến cố và mô hình tính điểm

**Files:**
- Create: `src/game/events.js`, `src/game/simulate.js`
- Test: `tests/simulate.test.js`, `tests/fixtures/original.js` (chép nguyên văn `EVENTS`, `clamp`, `simulate`, `explainFor` từ `Main.dc.html` làm oracle; `explainFor` đổi thành hàm tự do `explainFor(r, c, floor, dlg, res)`)

**Interfaces:**
- Produces: `EVENTS: {title, desc, question}[5]`, `ROUNDS = 5` (events.js); `OK_THRESHOLD = 50`, `clamp(v): number`, `simulate(round, commission, floor, dialogue): {D, P, K, X, strike}`, `isAllGreen({D, P, K, X}): boolean`, `explain(round, commission, floor, dialogue, result): string` với `result` có `D`, `strike`, `allGreen` (simulate.js). D = tài xế, P = nền tảng, K = khách hàng, X = xã hội.

- [ ] **Step 1: Viết test**
  - `day 1 at 20% with no policy keeps all four bars at 50 or above`: `simulate(1, 20, false, false)` → `{D: 70, P: 52, K: 72, X: 59, strike: false}`.
  - `day 2 passes only with both policies, at 19-26%`: với mọi `c` 15..40 và 4 tổ hợp chính sách, `isAllGreen(simulate(2, c, f, d)) === (f && d && c >= 19 && c <= 26)`.
  - `day 4 without dialogue at high commission leaves a bar under 50`: với `c` 32..40, `f` ∈ {false, true}: `Math.min(D,P,K,X) < 50` và `simulate(4, 35, false, false).strike === true`.
  - `matches the original formula everywhere`: r 1..5, c 15..40, 4 tổ hợp: `simulate` khớp `toEqual` oracle; `explain` khớp `explainFor` oracle (với `allGreen` gán như bản gốc).
  - `scores are integers in 0..100`.
  - `EVENTS equals the original five events`: `toEqual` oracle `EVENTS`.
- [ ] **Step 2:** Run `npx vitest run tests/simulate.test.js` → FAIL (module chưa có).
- [ ] **Step 3:** Viết `events.js` và `simulate.js`: chép công thức nguyên văn, chỉ đổi tên tham số `r, c, dlg` → `round, commission, dialogue`.
- [ ] **Step 4:** Run lại → PASS.

### Task 3: Trạng thái game

**Files:**
- Create: `src/game/state.js`
- Test: `tests/state.test.js`

**Interfaces:**
- Consumes: Task 2.
- Produces:
  - `MIN_COMMISSION = 15`, `MAX_COMMISSION = 40`, `DEFAULT_COMMISSION = 25`
  - `createInitialState()` → `{screen: 'intro', round: 1, commission: 25, floor: false, dialogue: false, result: null, history: []}`
  - Hàm thuần, trả state mới, không đổi state cũ: `start(s)`, `setCommission(s, value)`, `toggleFloor(s)`, `toggleDialogue(s)`, `confirm(s)`, `next(s)`, `restart()`.
  - `result` = `{D, P, K, X, strike, allGreen, explain}`; mỗi phần tử `history` = `{commission, floor, dialogue, scores: {D, P, K, X}, allGreen}`.
  - `summarize(history)` → `{wins, insights: string[], endTitle, endSub}` (chuỗi nguyên văn bản gốc).
  - `toSaved(s)` → `{screen, round, commission, floor, dialogue, locked, days: [{commission, floor, dialogue}]}`; `restoreState(saved)` → state hoặc `null`.

- [ ] **Step 1: Viết test**
  - `start` → `screen 'play'`, `round 1`, `history []`; giữ commission/floor/dialogue như bản gốc.
  - `setCommission`: `'30'` → 30; `14.6` → 15; `99` → 40; `'abc'` → giữ giá trị cũ; khi đã chốt → không đổi.
  - `toggleFloor`/`toggleDialogue` đảo giá trị; khi đã chốt → không đổi.
  - `confirm` lần 1 → `result` khớp `simulate` + `allGreen` + `explain`, `history.length === 1`; `confirm` lần 2 → trả nguyên state.
  - `next` trước khi chốt → không đổi; sau khi chốt ở ngày < 5 → `round + 1`, `result null`, giữ commission/floor/dialogue; ở ngày 5 → `screen 'end'`; `next` khi `screen 'end'` → không đổi.
  - `restart()` → bằng `createInitialState()`.
  - `summarize`: 5 ngày thắng → `'Tuyệt vời! Bạn hài hòa được lợi ích cả 5 ngày.'`; 3 thắng → `'Khá lắm: 3/5 ngày cả bốn bên cùng ổn.'`; 1 thắng → `'Chỉ 1/5 ngày cả bốn bên cùng ổn.'`; 4 insight bật đúng điều kiện bản gốc (c ≥ 32; c ≤ 17; ngày ≥ 2 không chính sách và không ổn; ngày 4 bật đối thoại), đúng thứ tự.
  - `restoreState(toSaved(s))` khôi phục đúng state ở: giữa ngày 3 chưa chốt, ngày 3 đã chốt, màn end.
  - `restoreState` trả `null` với: `null`, `'x'`, `screen 'boss'`, `round 9`, `commission 99`, `days` dài hơn cho phép, `days` chứa commission ngoài 15–40, `floor: 'yes'`.
  - Điểm luôn tính lại: `restoreState` bỏ qua mọi trường điểm trong `saved`.
- [ ] **Step 2:** Run `npx vitest run tests/state.test.js` → FAIL.
- [ ] **Step 3:** Viết `state.js`. `restoreState` phát lại các ngày bằng `confirm`/`next` từ state đầu, rồi kiểm tra số ngày khớp `round` và `locked`.
- [ ] **Step 4:** Run → PASS.

### Task 4: Bản ghi ván và lưu trữ

**Files:**
- Create: `src/game/records.js`, `src/storage.js`
- Test: `tests/records.test.js`, `tests/storage.test.js`

**Interfaces:**
- Consumes: Task 3 (`history` entries).
- Produces:
  - records.js: `MAX_GAMES = 50`; `buildRecord(history, finishedAt: Date)` → `{id, finishedAt (ISO), wins, total, days: [{commission, floor, dialogue, scores, allGreen}]}`; `isBetter(a, b)` (b null → true; nhiều `wins` hơn; bằng thì `total` lớn hơn; bằng nữa → false); `addRecord(data, record)` → data mới, `games` mới nhất trước, cắt 50, cập nhật `best`; `isValidRecord(r)`.
  - storage.js: `STORAGE_KEY = 'cbcx:v1'`; `defaultData()` → `{version: 1, current: null, games: [], best: null}`; `getBackend()` → `window.localStorage` hoặc `null` (bọc try/catch); `loadData(backend)` → data (không bao giờ ném lỗi); `saveData(data, backend)` → `boolean`; `clearData(backend)` → `boolean`.

- [ ] **Step 1: Viết test** (backend giả: object có `getItem/setItem/removeItem` trên `Map`; backend ném lỗi ở mọi phương thức)
  - storage: backend rỗng → `defaultData()`; `saveData` rồi `loadData` → `toEqual` dữ liệu đã lưu; JSON hỏng → mặc định; `version: 2` → mặc định; JSON là mảng/số → mặc định; `games` lẫn bản ghi hỏng → chỉ giữ bản hợp lệ; `best` hỏng → `null`; backend ném lỗi → `loadData` trả mặc định, `saveData` trả `false`, `clearData` trả `false`; `backend null` → như backend lỗi; `clearData` xóa key.
  - records: `buildRecord` tính `wins`, `total` (tổng 20 điểm) và chép điểm từng ngày; `isBetter` theo 3 tầng; `addRecord` thêm lên đầu, cắt ở 50, giữ `best` khi bản mới kém hơn, thay `best` khi tốt hơn.
- [ ] **Step 2:** Run `npx vitest run tests/records.test.js tests/storage.test.js` → FAIL.
- [ ] **Step 3:** Viết `records.js` và `storage.js`. `loadData` không kiểm tra `current` (việc của `restoreState`), chỉ yêu cầu `current` là object hoặc `null`.
- [ ] **Step 4:** Run → PASS. Run cả bộ `npm test` → PASS.

### Task 5: Khung trang, token, điều phối

Đọc lại `craft-floor.md` (impeccable) và Floor của hallmark trước khi viết CSS.

**Files:**
- Create: `index.html`, `src/styles.css`, `src/main.js`, `src/ui/dom.js`, `src/ui/icons.js`, `src/ui/parties.js`

**Interfaces:**
- Consumes: Task 2–4.
- Produces: `h(tag, props, ...children): Element` (dom.js); `icon(name): string` SVG cho `logo, driver, platform, customer, society, info, check, alert, cross, question, history, back` (icons.js); `PARTIES = [{key: 'D', label: 'Tài xế', measure: 'Thu nhập thực nhận', cls: 'driver'}, …]` (parties.js); `ctx = {state, data, storageOk, actions}` truyền vào mỗi màn, `actions` gồm `start, setCommission, toggleFloor, toggleDialogue, confirm, next, restart, clearData`.

- [ ] **Step 1:** `index.html`: `lang="vi"`, viewport, title "Cân bằng chuyến xe", `<noscript>` tiếng Việt, `#app`, vùng `aria-live="polite"` ẩn.
- [ ] **Step 2:** `styles.css`: dòng đầu là stamp hallmark; token màu/font/khoảng cách/bo góc ở `:root`; `overflow-x: clip` trên `html, body`; `:focus-visible` hiện ngay; container tối đa 1180px; thang chữ cố định theo rem: điện thoại thân 16px, từ 960px thân 18px (máy chiếu).
- [ ] **Step 3:** `main.js`: nạp `loadData(getBackend())`, `restoreState(data.current) ?? createInitialState()`, sau mỗi action ghi `toSaved(state)` vào `data.current` và `saveData`; khi chuyển play → end thì `addRecord(data, buildRecord(state.history, new Date()))`; `hashchange` giữa game và `#lich-su`; `storageOk = false` khi một lần lưu thất bại → đầu trang hiện thông báo.
- [ ] **Step 4:** Đầu trang: logo SVG + "Cân bằng chuyến xe" + "MLN122: Lợi ích kinh tế và quan hệ lợi ích kinh tế"; dòng mô phỏng giả định (icon info); link "Lịch sử chơi".
- [ ] **Step 5:** `npm run build` → PASS; mở `npm run dev` thấy khung trống không lỗi console.

### Task 6: Màn mở đầu và màn chơi

**Files:**
- Create: `src/ui/intro.js` (`renderIntro(ctx): Element`), `src/ui/play.js` (`mountPlay(root, ctx): {update(ctx)}`)

- [ ] **Step 1: Màn mở đầu.** h1 "Giữ cả bốn bên cùng “xanh” trong 5 ngày."; đoạn dẫn bắt đầu "Bạn là người điều phối." rồi nguyên văn đoạn bản gốc; nút chính "Bắt đầu ngày 1"; mốc Grab nguyên văn; danh sách 4 bên (icon màu bên + tên + thứ được đo) làm chú giải cho 4 thanh; nếu có `data.best` thì một dòng "Kết quả tốt nhất: n/5 ngày" kèm link lịch sử.
- [ ] **Step 2: Màn chơi, phần quyết định.** h1 "Ngày n/5"; 5 chấm tiến độ (`aria-label` từng ngày: đã ổn / có bên thiệt / hôm nay / chưa chơi); thẻ biến cố (tiêu đề h2 + mô tả); `<label for>` + `<input type="range">`; 2 nút bật/tắt `aria-pressed` có chữ "Đang bật"/"Tắt"; nút "Chốt quyết định"; khi đã chốt: dòng "Đã chốt quyết định ngày n." và nút "Sang ngày n+1"/"Xem tổng kết".
- [ ] **Step 3: Màn chơi, phần kết quả.** 4 hàng thanh (tên, giá trị số tabular, chữ "Ổn"/"Nguy hiểm" kèm icon khác hình, thanh tô bằng `transform: scaleX`), vạch ngưỡng 50; trước khi chốt giá trị "—", chữ "Chờ chốt", thanh rỗng; dải phán quyết ở đáy cùng khối; "Hỏi cả lớp" là khối riêng, không lồng thẻ.
- [ ] **Step 4: Bố cục.** ≥ 960px: hai cột (quyết định 5/12, kết quả 7/12), nút "Sang ngày" dưới cột trái; < 960px: một cột theo thứ tự biến cố → quyết định → kết quả → câu hỏi → nút "Sang ngày". Chốt xong: focus nút sang ngày, đọc kết quả qua vùng `aria-live`; trên một cột cuộn tới khối kết quả.
- [ ] **Step 5: Chuyển động.** Thanh mọc từ 0 (keyframe trên `transform`, lệch 60ms/thanh, ~600ms); chuyển ngày: khối chơi trượt lên 12px + hiện dần ~250ms; `prefers-reduced-motion` tắt cả hai.
- [ ] **Step 6:** Chơi thử ngày 1 với 22% + sàn → 76/57/72/74 hiển thị đúng.

### Task 7: Màn tổng kết và lịch sử chơi

**Files:**
- Create: `src/ui/end.js` (`renderEnd(ctx): Element`), `src/ui/history.js` (`renderHistory(ctx): Element`), `src/ui/format.js` (`formatDateTime(iso): string` theo `vi-VN`)

- [ ] **Step 1: Tổng kết.** h1 = `endTitle`, đoạn `endSub`; 5 ô ngày (SVG check/cross + "Ngày n", nhãn đọc được); dòng kết quả tốt nhất (mới lập hoặc giữ nguyên); "Điều bạn vừa trải nghiệm" chỉ khi có insight; "Ba kết luận cho bài học" là `<ol>` không số trang trí; dòng căn cứ nguyên văn; nút "Chơi lại" và link "Lịch sử chơi".
- [ ] **Step 2: Lịch sử chơi.** h1 "Lịch sử chơi"; khối kết quả tốt nhất; mỗi ván: thời điểm, số ngày ổn, bảng 5 ngày (chiết khấu, sàn, đối thoại, 4 điểm có chữ trạng thái); trạng thái rỗng có một câu và nút bắt đầu; nút "Xóa dữ liệu" → xác nhận tại chỗ nêu rõ sẽ xóa gì, "Xóa hẳn"/"Giữ lại"; link "Quay lại game". Bảng chuyển thành danh sách hai dòng dưới 640px.
- [ ] **Step 3:** Chơi hết một ván → lịch sử có 1 ván, tải lại trang vẫn còn; "Xóa dữ liệu" → xác nhận → lịch sử rỗng, key biến mất.

### Task 8: Rà soát giao diện bằng ba skill

- [ ] **Step 1:** `node <taste>/scripts/lint.mjs --app src index.html` và `node <taste>/scripts/inspect.mjs --app <url preview>` → 0 FAIL; mọi WARN sửa hoặc nêu lý do.
- [ ] **Step 2:** `node <hallmark>/scripts/sloplint.mjs src index.html --scope app --render --url <url preview>` → 0 FAIL; Reflex sửa hoặc ghi waive vào stamp.
- [ ] **Step 3:** `impeccable detect --json src index.html` → xử lý phát hiện.
- [ ] **Step 4:** Chụp 1440, 1280×720 (máy chiếu), 768, 390 cho cả 4 màn; viết critique theo app-screens.md §2.7; sửa 3 lỗi nặng nhất; chụp lại (tối đa 3 vòng).
- [ ] **Step 5:** Kiểm tra bàn phím (Tab qua mọi điều khiển, phím mũi tên trên thanh trượt), reduced motion, localStorage bị chặn.

### Task 9: Xác minh cuối

- [ ] **Step 1:** `npm test` → mọi test PASS (dán số test).
- [ ] **Step 2:** `npm run build` → PASS; `npm run preview` chơi trọn 1 ván, không lỗi console.
- [ ] **Step 3:** Báo cáo: cách chạy, cấu trúc thư mục, khác biệt so với bản gốc, kết quả các bộ kiểm tra.

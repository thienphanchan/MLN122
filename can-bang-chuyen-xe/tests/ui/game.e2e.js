import { expect, test } from '@playwright/test';
import { buildRecord } from '../../src/game/records.js';
import { confirm, createInitialState, next, start, toSaved } from '../../src/game/state.js';
import { simulate } from '../../src/game/simulate.js';

const KEY = 'cbcx:v1';
const FLOOR = 'Sàn thu nhập + bảo hiểm tai nạn Bảo vệ tài xế, nền tảng tốn thêm chi phí';
const DIALOGUE = 'Đối thoại ba bên định kỳ Nền tảng – tài xế – cơ quan quản lý';
const CHOICES = [[20, false, false], [22, true, true], [22, false, true], [22, true, true], [16, true, true]];

function savedRecord() {
  let state = start(createInitialState());
  for (let day = 1; day <= 5; day++) state = next(confirm(state));
  return buildRecord(state.history, new Date('2026-10-26T08:30:00.000Z'));
}

async function seed(page, data) {
  await page.goto('/');
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: KEY, data });
  await page.reload();
}

async function startGame(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ngày 1' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ngày 1/5' })).toBeFocused();
}

async function setCommission(page, value) {
  const slider = page.getByRole('slider', { name: 'Mức chiết khấu của nền tảng' });
  await slider.focus();
  await slider.press('Home');
  for (let n = 15; n < value; n++) await slider.press('ArrowRight');
  await expect(slider).toHaveValue(String(value));
}

test('policy controls announce state once and keep a stable accessible name', async ({ page }) => {
  await startGame(page);
  await expect(page.getByRole('heading', { name: 'Chính sách của Nhà nước và xã hội', level: 2 })).toBeVisible();
  for (const name of [FLOOR, DIALOGUE]) {
    const toggle = page.getByRole('button', { name, exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAccessibleName(name);
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  }
});

test('market shocks change the live bars and adjusting decisions restores green', async ({ page }) => {
  const state = next(confirm({ ...start(createInitialState()), commission: 20 }));
  await seed(page, { version: 1, current: toSaved(state), games: [], best: null });
  const values = page.locator('[data-value]');
  await expect(values).toHaveText(['58', '43', '65', '52']);
  await expect(page.locator('[data-metric="P"] [data-status]')).toHaveText('Nguy hiểm');
  await expect(page.locator('.metric-change')).toHaveText([
    '-12 điểm so với ngày trước', '-9 điểm so với ngày trước', '-7 điểm so với ngày trước', '-7 điểm so với ngày trước',
  ]);
  await setCommission(page, 22);
  await page.locator('#toggle-floor').click();
  await page.locator('#toggle-dialogue').click();
  await expect(values).toHaveText(['70', '51', '68', '81']);
  await expect(page.locator('[data-status]')).toHaveText(['Ổn', 'Ổn', 'Ổn', 'Ổn']);
  await page.reload();
  await expect(values).toHaveText(['70', '51', '68', '81']);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).current.days.length, KEY)).toBe(1);
  await page.getByRole('button', { name: 'Chốt quyết định' }).click();
  await expect(values).toHaveText(['70', '51', '68', '81']);
  await page.getByRole('button', { name: 'Sang ngày 3' }).click();
  await expect(values).toHaveText(['82', '43', '75', '88']);
  await expect(page.locator('[data-metric="P"] [data-status]')).toHaveText('Nguy hiểm');
  await page.locator('#toggle-floor').click();
  await expect(values).toHaveText(['70', '52', '72', '69']);
  await expect(page.locator('[data-status]')).toHaveText(['Ổn', 'Ổn', 'Ổn', 'Ổn']);
});

test('peak-hour complaints depend on driver supply and clear after a suitable adjustment', async ({ page }) => {
  let state = start(createInitialState());
  for (const [commission, floor, dialogue] of CHOICES.slice(0, 4)) {
    state = next(confirm({ ...state, commission, floor, dialogue }));
  }
  await seed(page, { version: 1, current: toSaved(state), games: [], best: null });
  await expect(page.getByRole('heading', { name: /Khách phàn nàn chờ xe lâu/ })).toBeVisible();
  await expect(page.locator('[data-value]')).toHaveText(['82', '61', '43', '82']);
  await expect(page.locator('[data-metric="K"] [data-status]')).toHaveText('Nguy hiểm');
  await setCommission(page, 16);
  await expect(page.locator('[data-value]')).toHaveText(['100', '53', '86', '99']);
  await expect(page.locator('[data-status]')).toHaveText(['Ổn', 'Ổn', 'Ổn', 'Ổn']);
  await page.getByRole('button', { name: 'Chốt quyết định' }).click();
  const feedback = page.getByRole('region', { name: 'Thông điệp ngày 5', exact: true });
  await expect(feedback).toHaveAttribute('data-feedback', 'ok');
  await expect(feedback).toContainText('áp lực chờ do thiếu xe đã được giải tỏa');
  await page.reload();
  await expect(page.locator('[data-value]')).toHaveText(['100', '53', '86', '99']);
  await expect(feedback).toContainText('áp lực chờ do thiếu xe đã được giải tỏa');
});

test('five days preserve scores, choices, focus, history and the best result after reload', async ({ page }) => {
  await startGame(page);
  await expect(page.locator('[data-value]')).toHaveText(['55', '51', '63', '50']);
  for (const [i, [commission, floor, dialogue]] of CHOICES.entries()) {
    const day = i + 1;
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Ngày ${day}/5`);
    await setCommission(page, commission);
    for (const [id, on] of [['toggle-floor', floor], ['toggle-dialogue', dialogue]]) {
      const toggle = page.locator(`#${id}`);
      if ((await toggle.getAttribute('aria-pressed') === 'true') !== on) await toggle.click();
    }
    await page.getByRole('button', { name: 'Chốt quyết định' }).click();
    const scores = simulate(day, commission, floor, dialogue);
    for (const key of ['D', 'P', 'K', 'X']) {
      await expect(page.locator(`[data-metric="${key}"] [data-value]`)).toHaveText(String(scores[key]));
    }
    await expect(page.getByRole('slider')).toBeDisabled();
    await expect(page.locator('#toggle-floor')).toBeDisabled();
    await expect(page.locator('#toggle-dialogue')).toBeDisabled();
    const advance = page.getByRole('button', { name: day < 5 ? `Sang ngày ${day + 1}` : 'Xem tổng kết' });
    await expect(page.getByRole('heading', { name: 'Bốn thanh lợi ích' })).toBeFocused();
    const feedback = page.getByRole('region', { name: `Thông điệp ngày ${day}`, exact: true });
    await expect(feedback).toHaveAttribute('data-feedback', 'ok');
    await expect(feedback.getByRole('heading', { name: 'Vì sao?' })).toBeVisible();
    await expect(feedback.getByRole('heading', { name: 'Hướng giải quyết' })).toBeVisible();
    const answer = page.locator('.answer-body');
    const reveal = page.locator('.answer summary');
    await expect(answer).not.toBeVisible();
    await reveal.focus();
    await reveal.press('Enter');
    await expect(answer).toBeVisible();
    expect((await answer.innerText()).length).toBeGreaterThan(80);
    await reveal.press('Space');
    await expect(answer).not.toBeVisible();
    await reveal.click();
    await expect(answer).toBeVisible();
    if (day === 2) {
      await page.reload();
      await expect(page.getByRole('slider')).toHaveValue('22');
      await expect(page.getByRole('slider')).toBeDisabled();
      await expect(answer).not.toBeVisible();
      await expect(feedback).toHaveAttribute('data-feedback', 'ok');
    }
    await advance.click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toContainText('cả 5 ngày');
  await expect(page.getByRole('heading', { name: 'Nhận diện đúng mâu thuẫn' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mâu thuẫn không đối kháng', exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('link', { name: 'Lịch sử chơi', exact: true }).click();
  await expect(page.locator('[data-game]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Kết quả tốt nhất: 5/5 ngày' })).toBeVisible();
  await expect(page.locator('.days tbody tr')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('red feedback explains the affected parties and the actual day-four log-off', async ({ page }) => {
  let state = start(createInitialState());
  for (let day = 1; day <= 4; day++) {
    state = confirm({ ...state, commission: 35, floor: false, dialogue: false });
    if (day < 4) state = next(state);
  }
  await seed(page, { version: 1, current: toSaved(state), games: [], best: null });
  const feedback = page.getByRole('region', { name: 'Thông điệp ngày 4', exact: true });
  await expect(feedback).toHaveAttribute('data-feedback', 'DPKX');
  await expect(feedback.getByRole('heading', { name: 'Cả hệ thống cùng bị thiệt' })).toBeVisible();
  await expect(feedback).toContainText('tắt app hàng loạt');
  await expect(feedback.getByRole('heading', { name: 'Hướng giải quyết' })).toBeVisible();
  const sources = feedback.locator('.teaching-note');
  await expect(sources.locator('.teaching-note-body')).not.toBeVisible();
  await sources.locator('summary').focus();
  await sources.locator('summary').press('Enter');
  await expect(sources.locator('.teaching-note-body')).toBeVisible();
  await expect(sources.getByRole('link', { name: 'Giáo trình học phần Kinh tế chính trị Mác–Lênin' })).toHaveAttribute('href', /hcmunre\.edu\.vn/);
  await expect(page.locator('.answer-body')).not.toBeVisible();
  await page.locator('.answer summary').click();
  await expect(page.locator('.answer-body')).toContainText('không đối kháng');
  await expect(page.locator('.answer-body')).toContainText('Chưa đủ căn cứ');
  await expect(page.locator('.answer-body')).not.toContainText('đây là mâu thuẫn không đối kháng');
  await expect(page.locator('.answer-body').getByRole('link', { name: 'Giáo trình Triết học Mác–Lênin, Hà Nội 2019' })).toHaveAttribute('href', /upt\.edu\.vn/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sang ngày 5' }).click();
  await expect(page.getByRole('region', { name: 'Thông điệp ngày 5', exact: true })).toHaveCount(0);
  await expect(page.locator('.answer')).toHaveCount(0);
});

test('clearing only an unfinished game uses accurate inline copy and keeps the history screen', async ({ page }) => {
  await startGame(page);
  await page.getByRole('link', { name: 'Lịch sử chơi', exact: true }).click();
  const clear = page.getByRole('button', { name: 'Xóa dữ liệu', exact: true });
  await clear.click();
  await expect(page.locator('#confirm-text')).not.toContainText('0 ván');
  await expect(page.locator('#confirm-text')).toContainText('ván đang chơi dở');
  await expect(page.getByRole('button', { name: 'Giữ lại' })).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Giữ lại' }).click();
  await expect(clear).toBeFocused();
  await clear.click();
  await page.getByRole('button', { name: 'Xóa hẳn' }).click();
  await expect(page).toHaveURL(/#lich-su$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Lịch sử chơi' })).toBeFocused();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBeNull();
  await expect(clear).toHaveCount(0);
});

test('duplicate game IDs render once while edited scores are rejected', async ({ page }) => {
  const record = savedRecord();
  const edited = { ...record, id: 'edited', total: 2000, wins: 5,
    days: record.days.map((day) => ({ ...day, scores: { D: 100, P: 100, K: 100, X: 100 }, allGreen: true })) };
  await seed(page, { version: 1, current: null, games: [record, record, edited], best: record });
  await page.getByRole('link', { name: 'Lịch sử chơi', exact: true }).click();
  await expect(page.locator('[data-game]')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Các ván đã chơi (1)' })).toBeVisible();
  const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test('fonts declare character ranges and load Vietnamese and Latin offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const faces = await page.evaluate(() => Array.from(document.fonts)
    .filter((font) => font.family.includes('Be Vietnam Pro'))
    .map((font) => ({ range: font.unicodeRange, weight: font.weight, status: font.status })));
  for (const weight of ['400', '700', '800']) {
    expect(faces.some((font) => font.weight === weight && font.status === 'loaded')).toBe(true);
  }
  expect(faces.every((font) => font.range !== 'U+0-10FFFF')).toBe(true);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Bắt đầu ngày 1' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ngày 1/5' })).toBeVisible();
  expect(await page.evaluate(() => document.fonts.check('16px "Be Vietnam Pro"', 'Cân bằng chuyến xe'))).toBe(true);
});

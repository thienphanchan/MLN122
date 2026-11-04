import { expect, test } from '@playwright/test';

async function joinRoom(page, code, name) {
  await page.goto(`/#tham-gia/${code}`);
  await page.getByLabel('Tên hiển thị').fill(name);
  await page.getByRole('button', { name: 'Vào phòng', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chờ chủ phòng bắt đầu' })).toBeVisible();
}
async function finishDays(page) {
  for (let day = 1; day <= 5; day++) {
    await expect(page.getByRole('heading', { name: `Ngày ${day}/5`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Chốt quyết định', exact: true }).click();
    await page.getByRole('button', { name: day < 5 ? `Sang ngày ${day + 1}` : 'Làm trắc nghiệm', exact: true }).click();
  }
}
async function submitQuiz(page, choices) {
  const groups = page.getByRole('group', { name: /Câu \d/ });
  await expect(groups).toHaveCount(5);
  for (const [index, choice] of choices.entries()) await groups.nth(index).getByRole('radio').nth(choice).check();
  await page.getByRole('button', { name: 'Nộp trắc nghiệm', exact: true }).click();
}

test('host and two players complete five days and quiz with live scores and refresh recovery', async ({ page, browser }) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const computerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const phone = await phoneContext.newPage();
    const computer = await computerContext.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
    const code = await page.getByTestId('room-code').innerText();
    await expect(page.getByRole('img', { name: 'Mã QR tham gia phòng' })).toBeVisible();
    await joinRoom(phone, code, 'An');
    await joinRoom(computer, code, 'Bình');
    await expect(page.getByRole('row', { name: /An/ })).toBeVisible();
    await page.getByRole('button', { name: 'Bắt đầu phòng', exact: true }).click();
    await expect(phone.getByRole('heading', { name: 'Ngày 1/5', exact: true })).toBeVisible();
    await phone.getByRole('button', { name: 'Chốt quyết định', exact: true }).click();
    await expect(phone.getByRole('heading', { name: 'Bốn thanh lợi ích', exact: true })).toBeFocused();
    await expect(page.getByRole('row', { name: /An/ })).toContainText('219');
    await page.screenshot({ path: `test-results/live-host-${test.info().project.name}.png`, fullPage: true });
    await phone.reload();
    await expect(phone.getByText('Đã chốt quyết định ngày 1.')).toBeVisible();
    await phone.getByRole('button', { name: 'Sang ngày 2', exact: true }).click();
    const slider = phone.getByRole('slider', { name: 'Mức chiết khấu của nền tảng' });
    await slider.focus();
    await slider.press('ArrowLeft');
    await expect(slider).toHaveValue('24');
    await phoneContext.setOffline(true);
    await expect(phone.getByRole('button', { name: 'Chốt quyết định', exact: true })).toBeDisabled();
    await phoneContext.setOffline(false);
    await expect(phone.getByRole('button', { name: 'Chốt quyết định', exact: true })).toBeEnabled();
    await expect(slider).toHaveValue('24');
    for (let day = 2; day <= 5; day++) {
      await phone.getByRole('button', { name: 'Chốt quyết định', exact: true }).click();
      await phone.getByRole('button', { name: day < 5 ? `Sang ngày ${day + 1}` : 'Làm trắc nghiệm', exact: true }).click();
    }
    await expect(phone.getByRole('heading', { name: 'Trắc nghiệm cuối hành trình' })).toBeVisible();
    await phone.screenshot({ path: `test-results/quiz-form-${test.info().project.name}.png`, fullPage: true });
    await expect(phone.getByRole('button', { name: 'Nộp trắc nghiệm', exact: true })).toBeDisabled();
    await submitQuiz(phone, [1, 2, 0, 3, 1]);
    await expect(phone.getByText('50/50 điểm')).toBeVisible();
    await expect(phone.getByRole('heading', { name: 'Đáp án và giải thích' })).toHaveCount(0);
    await expect(page.getByRole('row', { name: /An/ })).toContainText('50/50');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Bảng điểm trực tiếp' })).toBeVisible();
    await finishDays(computer);
    await submitQuiz(computer, [0, 0, 0, 0, 0]);
    await expect(page.getByRole('heading', { name: 'Kết quả phòng' })).toBeVisible();
    await expect(phone.getByRole('heading', { name: 'Đáp án và giải thích' })).toBeVisible();
    await expect(computer.getByText('10/50 điểm')).toBeVisible();
    expect(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/room-${test.info().project.name}.png`, fullPage: true });
    await phone.screenshot({ path: `test-results/quiz-${test.info().project.name}.png`, fullPage: true });
  } finally {
    await phoneContext.close();
    await computerContext.close();
  }
});

test('room join errors are recoverable and the host can explicitly finish early', async ({ page, browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const player = await context.newPage();
    await player.goto('/#tham-gia/ZZZZZZ');
    await player.getByLabel('Tên hiển thị').fill('An');
    await player.getByRole('button', { name: 'Vào phòng', exact: true }).click();
    await expect(player.getByRole('alert')).toContainText('Không tìm thấy phòng');
    await page.goto('/');
    await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
    const code = await page.getByTestId('room-code').innerText();
    await joinRoom(player, code, 'An');
    await page.getByRole('button', { name: 'Bắt đầu phòng', exact: true }).click();
    await page.getByRole('button', { name: 'Kết thúc sớm', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Xác nhận kết thúc', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận kết thúc', exact: true }).click();
    await expect(player.getByRole('heading', { name: 'Kết quả của bạn' })).toBeVisible();
    await expect(player.getByText('0/50 điểm')).toBeVisible();
  } finally { await context.close(); }
});

test('opening a different invitation in the same tab switches to the intended room', async ({ page, browser }) => {
  const secondHostContext = await browser.newContext();
  const playerContext = await browser.newContext();
  try {
    const secondHost = await secondHostContext.newPage();
    const player = await playerContext.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
    const firstCode = await page.getByTestId('room-code').innerText();
    await secondHost.goto('/');
    await secondHost.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
    const secondCode = await secondHost.getByTestId('room-code').innerText();
    await joinRoom(player, firstCode, 'An');
    await player.goto(`/#tham-gia/${firstCode}`);
    await expect(player.getByRole('heading', { name: 'Chờ chủ phòng bắt đầu' })).toBeVisible();
    await player.goto(`/#tham-gia/${secondCode}`);
    await expect(player.getByLabel('Mã phòng')).toHaveValue(secondCode);
    await player.getByLabel('Tên hiển thị').fill('An');
    await player.getByRole('button', { name: 'Vào phòng', exact: true }).click();
    await expect(secondHost.getByRole('row', { name: /An/ })).toBeVisible();
    await expect(player.locator('.room-identity')).toContainText(secondCode);
  } finally { await secondHostContext.close(); await playerContext.close(); }
});

test('the host keeps access in the same tab when session storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { value: {
      getItem() { throw new Error('Storage unavailable'); },
      setItem() { throw new Error('Storage unavailable'); },
      removeItem() { throw new Error('Storage unavailable'); },
    } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
  await expect(page.getByTestId('room-code')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu phòng', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Trình duyệt đang chặn lưu phiên' })).toBeVisible();
});

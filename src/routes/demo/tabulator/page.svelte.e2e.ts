import { expect, test } from '@playwright/test';

// Clipboard read/write is needed to assert what Ctrl+C placed on the clipboard.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const cell = (rowIndex: number, field: string) =>
	`.tabulator-row:nth-child(${rowIndex + 1}) .tabulator-cell[tabulator-field="${field}"]`;

const nameFilterInput = '.tabulator-col[tabulator-field="name"] .tabulator-header-filter input';

test('renders the Tabulator tree grid with all rows visible', async ({ page }) => {
	await page.goto('/demo/tabulator');

	await expect(page.getByRole('heading', { name: 'Tabulator tree data demo' })).toBeVisible();
	await expect(page.getByTestId('tabulator-grid').locator('.tabulator-table')).toBeVisible();
	// 60 rows total (4 roots × tree fan-out) generated deterministically by faker.seed(42).
	await expect(page.getByTestId('visible-row-count')).toContainText('60 / 60');
});

test('searches the name column, revealing nested matches and their ancestors', async ({ page }) => {
	await page.goto('/demo/tabulator');

	const input = page.locator(nameFilterInput);
	await expect(input).toBeVisible();

	// "Dr. Brendan Keebler" is nested two levels deep; searching for it keeps the
	// full ancestor chain (root → manager → match) visible, and nothing else.
	await input.click();
	await input.pressSequentially('Brendan', { delay: 20 });

	await expect(page.getByTestId('visible-row-count')).toContainText('3 / 60');
	const visibleNames = page.locator('.tabulator-cell[tabulator-field="name"]');
	await expect(visibleNames).toHaveCount(3);
	await expect(page.getByText('Dr. Brendan Keebler')).toBeVisible();

	// A term that matches nobody hides every row.
	await input.fill('');
	await input.pressSequentially('нет такого', { delay: 10 });
	await expect(page.getByTestId('visible-row-count')).toContainText('0 / 60');

	// Clearing the filter restores the whole tree.
	await input.fill('');
	await input.press('Backspace');
	await expect(page.getByTestId('visible-row-count')).toContainText('60 / 60');
});

test('copies the selected cell range to the clipboard with Ctrl+C', async ({ page }) => {
	await page.goto('/demo/tabulator');

	const firstDept = page.locator(cell(0, 'department'));
	await expect(firstDept).toBeVisible();
	const expected = (await firstDept.innerText()).trim();

	// Single click selects a one-cell range (editing is bound to dblclick).
	await firstDept.click();
	await page.keyboard.press('ControlOrMeta+c');

	const clipboard = await page.evaluate(() => navigator.clipboard.readText());
	expect(clipboard.trim()).toBe(expected);
});

test('pastes a copied cell into a nested tree child row', async ({ page }) => {
	await page.goto('/demo/tabulator');

	// Source is a top-level root row; target is one of its tree children — this
	// exercises the custom tree-aware paste action (the built-in `range` action
	// silently no-ops on child rows because they are absent from activeRows).
	const source = page.locator(cell(0, 'salary'));
	const target = page.locator(cell(1, 'salary'));
	await expect(source).toBeVisible();
	await expect(target).toBeVisible();

	const sourceText = (await source.innerText()).trim();
	const targetBefore = (await target.innerText()).trim();
	expect(sourceText).not.toBe(targetBefore);

	// Copy the source cell with a real Ctrl+C (Tabulator writes to the OS
	// clipboard via the copy event).
	await source.click();
	await page.keyboard.press('ControlOrMeta+c');

	await expect
		.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).trim())
		.not.toBe('');
	const clipboardText = (await page.evaluate(() => navigator.clipboard.readText())).trim();

	// Select the target, then feed Tabulator a real `paste` event carrying the
	// copied clipboard text. (Headless Chromium does not deliver OS-clipboard
	// data through a synthetic Ctrl+V, so we dispatch the event directly — this
	// still exercises Tabulator's range paste parser and write action.)
	await target.click();
	await target.evaluate((el, text) => {
		const data = new DataTransfer();
		data.setData('text/plain', text);
		el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
	}, clipboardText);

	await expect(target).toHaveText(sourceText);
});

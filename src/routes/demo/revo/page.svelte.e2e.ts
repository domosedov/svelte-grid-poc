import { expect, test } from '@playwright/test';

test('renders RevoGrid with tree grouping, custom cells and spreadsheet props', async ({
	page
}) => {
	await page.goto('/demo/revo');

	await expect(page.getByRole('heading', { name: 'RevoGrid tree rows demo' })).toBeVisible();
	await expect(page.locator('revo-grid')).toBeVisible();
	await expect(page.getByTestId('visible-row-count')).toHaveText('12 из 12');
	await expect(page.getByTestId('status-cell-active').first()).toBeVisible();

	const spreadsheetProps = await page.locator('revo-grid').evaluate((grid) => ({
		range: (grid as HTMLElement & { range?: boolean }).range,
		useClipboard: (grid as HTMLElement & { useClipboard?: boolean }).useClipboard
	}));

	expect(spreadsheetProps).toEqual({ range: true, useClipboard: true });
});

test('filters RevoGrid demo rows by employee name', async ({ page }) => {
	await page.goto('/demo/revo');

	await page.getByTestId('name-filter').fill('Никита');

	await expect(page.getByTestId('visible-row-count')).toHaveText('1 из 12');
	await expect(page.getByTestId('active-filter')).toHaveText('Никита');
	await expect(page.getByText('Нет сотрудников по такому фильтру')).toBeHidden();

	await page.getByTestId('name-filter').fill('не существует');

	await expect(page.getByTestId('visible-row-count')).toHaveText('0 из 12');
	await expect(page.getByText('Нет сотрудников по такому фильтру')).toBeVisible();
});

test('opens typed editors for date and number cells', async ({ page }) => {
	await page.goto('/demo/revo');

	const grid = page.locator('revo-grid');
	await expect(grid).toBeVisible();

	await grid.evaluate((element) =>
		(
			element as HTMLElement & { setCellEdit(row: number, prop: string): Promise<void> }
		).setCellEdit(0, 'budget')
	);
	await expect(page.locator('revogr-edit input')).toHaveAttribute('type', 'number');

	await page.keyboard.press('Escape');

	await grid.evaluate((element) =>
		(
			element as HTMLElement & { setCellEdit(row: number, prop: string): Promise<void> }
		).setCellEdit(0, 'startDate')
	);
	await expect(page.locator('revogr-edit input')).toHaveAttribute('type', 'date');
});

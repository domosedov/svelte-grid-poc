import { expect, test } from '@playwright/test';

test('supports Excel-like cell, row, column and range selection', async ({ page }) => {
	await page.goto('/demo/grid');

	await expect(page.getByRole('heading', { name: 'TanStack grid selection demo' })).toBeVisible();
	await expect(page.getByRole('grid', { name: 'Deals selection grid' })).toBeVisible();

	const acmeArrCell = page.getByRole('gridcell', { name: 'Acme Analytics ARR $2.4M' });
	await acmeArrCell.hover();
	await expect(acmeArrCell).toHaveAttribute('data-hovered-cell', 'true');

	await acmeArrCell.click();
	await expect(page.getByTestId('selected-cells-count')).toHaveText('1');
	await expect(acmeArrCell).toHaveAttribute('data-selected-cell', 'true');

	await page.getByRole('rowheader', { name: 'Выбрать строку Acme Analytics' }).click();
	await expect(page.getByTestId('selected-rows-count')).toHaveText('1');
	await expect(page.getByRole('row', { name: /Acme Analytics/ })).toHaveAttribute(
		'data-selected-row',
		'true'
	);

	await page.getByRole('columnheader', { name: 'Выбрать колонку ARR' }).click();
	await expect(page.getByTestId('selected-columns-count')).toHaveText('1');
	await expect(page.getByRole('columnheader', { name: /ARR/ })).toHaveAttribute(
		'data-selected-column',
		'true'
	);

	await page.getByRole('button', { name: 'Очистить выбор' }).click();
	await expect(page.getByTestId('selected-rows-count')).toHaveText('0');
	await expect(page.getByTestId('selected-columns-count')).toHaveText('0');
	await expect(page.getByTestId('selected-cells-count')).toHaveText('0');

	await page.getByRole('gridcell', { name: 'Acme Analytics Company Acme Analytics' }).click();
	await page
		.getByRole('gridcell', { name: 'Vector Logistics Region APAC' })
		.click({ modifiers: ['Shift'] });
	await expect(page.getByTestId('selected-cells-count')).toHaveText('9');
	await expect(
		page.getByRole('gridcell', { name: 'Northstar Payments Segment Mid-market' })
	).toHaveAttribute('data-selected-cell', 'true');

	await page.getByRole('button', { name: 'Очистить выбор' }).click();
	await page
		.getByRole('gridcell', { name: 'Northstar Payments Segment Mid-market' })
		.dragTo(page.getByRole('gridcell', { name: 'Orbit Clinic ARR $310K' }));
	await expect(page.getByTestId('selected-cells-count')).toHaveText('9');
	await expect(
		page.getByRole('gridcell', { name: 'Vector Logistics Region APAC' })
	).toHaveAttribute('data-selected-cell', 'true');
});

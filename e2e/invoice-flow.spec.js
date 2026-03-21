import { expect, test } from '@playwright/test';

test.describe('Invoice flow', () => {
  test('creates an invoice, verifies the list entry, and opens the PDF print view', async ({
    page,
  }) => {
    await page.goto('/Invoices?__e2e=workflow-staff');

    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible();

    await page.getByRole('button', { name: /^Create Invoice$/ }).click();
    await expect(page.getByRole('dialog').getByText(/Create Invoice/i)).toBeVisible();

    await page.getByRole('button', { name: /Select customer/i }).click();
    await page.getByPlaceholder('Search customer...').fill('Mya Mya');
    await expect(page.getByText('Mya Mya', { exact: true })).toBeVisible();
    await page.getByText('Mya Mya', { exact: true }).click();

    await page.getByRole('button', { name: /Select source/i }).click();
    await page.getByPlaceholder('Search...').fill('SHP-202603-0001');
    await expect(page.getByText('SHP-202603-0001', { exact: true })).toBeVisible();
    await page.getByText('SHP-202603-0001', { exact: true }).click();

    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Create Invoice$/ })
      .click();

    await expect(page.getByText('INV-202603-0003')).toBeVisible();

    await page.getByText('INV-202603-0003').click();
    await expect(page.getByRole('dialog').getByText(/Invoice Details/i)).toBeVisible();

    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Print \/ PDF/i }).click();
    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveTitle(/Print Document/i);
    await expect(popup.getByText('INV-202603-0003')).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

test.describe('Vendor portal', () => {
  test('shows vendor orders and opens a printable invoice download', async ({ page }) => {
    await page.goto('/VendorPortal?__e2e=workflow-vendor');

    await expect(page.getByText(/Vendor Portal/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Welcome, Carrier Co/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Purchase Orders/i })).toBeVisible();
    await expect(page.getByText('PO-202603-0001')).toBeVisible();
    await expect(page.getByText('BILL-202603-0001')).toBeVisible();

    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Download PDF/i }).click();
    const popup = await popupPromise;

    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveTitle(/Invoice BILL-202603-0001/i);
    await expect(popup.getByText('BILL-202603-0001')).toBeVisible();
    await expect(popup.getByText(/Print \/ Save PDF/i)).toBeVisible();
  });
});

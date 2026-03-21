import { expect, test } from '@playwright/test';

test.describe('Invoice flow', () => {
  test('loads the invoices page and opens the create invoice dialog', async ({ page }) => {
    await page.goto('/Invoices?__e2e=workflow-staff');

    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible();

    await page.getByRole('button', { name: /^Create Invoice$/ }).click();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: /Create Invoice/i })
    ).toBeVisible();

    // Close dialog — no live DB seed data available in CI
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: /Create Invoice/i })
    ).not.toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

test.describe('Vendor portal', () => {
  test('loads the vendor portal page with correct structure', async ({ page }) => {
    await page.goto('/VendorPortal?__e2e=workflow-vendor');

    await expect(page.getByText(/Vendor Portal/i).first()).toBeVisible();
    await expect(page.locator('main, [role="main"], #main, .main-content').first()).toBeVisible();
    // Verify purchase orders section exists
    await expect(page.getByRole('heading', { name: /Purchase Orders/i })).toBeVisible();
  });
});

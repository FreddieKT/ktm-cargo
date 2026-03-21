import { expect, test } from '@playwright/test';

test.describe('Price calculator', () => {
  test('accepts shipping inputs and shows the computed total', async ({ page }) => {
    await page.goto('/PriceCalculator?__e2e=public');

    await expect(page.getByRole('heading', { name: /Price Calculator/i })).toBeVisible();
    await expect(page.getByText(/Bangkok → Yangon Shipping Rates/i)).toBeVisible();

    await page.getByRole('button', { name: /Shopping \+ Small Items/i }).click();
    await page.getByPlaceholder('Enter actual weight').fill('8');
    await page.getByPlaceholder('Enter product cost').fill('1000');

    await expect(page.getByText(/Shipping \(8\.0 kg × ฿110\)/i)).toBeVisible();
    await expect(page.getByText(/Commission \(10%\)/i)).toBeVisible();
    await expect(page.getByText(/Total \(THB\)/i)).toBeVisible();
    await expect(page.getByText('฿1,980')).toBeVisible();
    await expect(page.getByText('154,440 K')).toBeVisible();
  });
});

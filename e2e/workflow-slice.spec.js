import { expect, test } from '@playwright/test';

test.describe('KTM workflow slice', () => {
  test('staff sees the canonical operations spine and seeded business records', async ({
    page,
  }) => {
    await page.goto('/Operations?__e2e=workflow-staff');

    await expect(page.getByRole('heading', { name: /KTM Cargo Workflow Spine/i })).toBeVisible();
    await expect(page.getByText(/Client Inquiry & Quote/i)).toBeVisible();
    await expect(page.getByText(/Payment & Order Confirmation/i)).toBeVisible();
    await expect(page.getByText(/Accounting & After-sales/i)).toBeVisible();

    await page.goto('/ShoppingOrders?__e2e=workflow-staff');
    await expect(page.getByRole('heading', { name: /Shopping Orders/i })).toBeVisible();
    await expect(page.getByText('SHOP-202603-0001')).toBeVisible();
    await expect(page.getByText(/Kitchen appliances bundle/i)).toBeVisible();

    await page.goto('/Shipments?__e2e=workflow-staff');
    await expect(page.getByRole('heading', { name: /Shipments/i })).toBeVisible();
    await expect(page.getByText('SHP-202603-0001')).toBeVisible();
    await expect(page.getByText('Mya Mya').first()).toBeVisible();
    await expect(page.getByText(/delivered/i).first()).toBeVisible();

    await page.goto('/Procurement?__e2e=workflow-staff');
    await expect(page.getByRole('heading', { name: /Procurement Portal/i })).toBeVisible();
    await expect(page.getByText('PO-202603-0001')).toBeVisible();
    await expect(page.getByText(/Approved/i).first()).toBeVisible();

    await page.goto('/Invoices?__e2e=workflow-staff');
    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible();
    await expect(page.getByText('INV-202603-0001')).toBeVisible();
    await expect(page.getByText('BILL-202603-0001')).toBeVisible();

    await page.goto('/FeedbackQueue?__e2e=workflow-staff');
    await expect(page.getByRole('heading', { name: /Feedback Queue/i })).toBeVisible();
    await expect(
      page.getByText(/Staff-facing queue for delivery feedback follow-up/i)
    ).toBeVisible();
  });

  test('public client portal reads as a brochure only', async ({ page }) => {
    await page.goto('/ClientPortal?__e2e=public');

    await expect(page.getByRole('heading', { name: /Company Profile/i })).toBeVisible();
    await expect(page.getByText(/no self-service ordering/i)).toBeVisible();
    await expect(page.getByText(/current business flow/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back Home/i })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test('homepage has title and main elements', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Symbria Delivery Logistics/);

  // Check for the main heading
  await expect(page.getByRole('heading', { name: /Streamline Your/i })).toBeVisible();
  
  // Check for login link
  await expect(page.getByRole('link', { name: /Login or Register/i })).toBeVisible();
});

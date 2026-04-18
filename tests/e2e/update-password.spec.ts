import { test, expect } from '@playwright/test';

test.describe('Update Password Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the update password page
    await page.goto('/update-password');
  });

  test('displays update password form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Update Password' })).toBeVisible();
    await expect(page.getByPlaceholder('New Password', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Confirm New Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();
  });

  test('validates form fields and shows error for mismatched passwords', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('New Password', { exact: true });
    const confirmInput = page.getByPlaceholder('Confirm New Password');
    const submitButton = page.getByRole('button', { name: 'Update Password' });

    await passwordInput.fill('newsecurepassword123');
    await confirmInput.fill('mismatchedpassword123');
    
    await submitButton.click();

    await expect(page.getByText('Error: Passwords do not match.')).toBeVisible();
  });
});

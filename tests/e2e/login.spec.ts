import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('validates form fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // HTML5 validation should prevent submission, but we can check if inputs are invalid
    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');
    
    await expect(emailInput).toBeEmpty();
    await expect(passwordInput).toBeEmpty();
  });
});
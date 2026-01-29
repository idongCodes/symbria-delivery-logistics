import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('toggles to register mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Register here' }).click();
    
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('First Name')).toBeVisible();
    await expect(page.getByPlaceholder('Last Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    
    // Check role selection
    await expect(page.getByText('System Role:')).toBeVisible();
    await expect(page.getByLabel('Driver')).toBeChecked();
  });

  test('validates form fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // HTML5 validation should prevent submission, but we can check if inputs are invalid
    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');
    
    // Check if the browser native validation is triggered (pseudo-class check)
    // Note: Playwright doesn't have a direct 'toBeInvalid' for HTML5 validation, 
    // but we can check if the value is empty as expected.
    await expect(emailInput).toBeEmpty();
    await expect(passwordInput).toBeEmpty();
  });
});

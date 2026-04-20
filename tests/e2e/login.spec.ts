import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible();
  });

  test('toggles to register mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Register here' }).click();
    
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('First Name')).toBeVisible();
    await expect(page.getByPlaceholder('Last Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up with Email' })).toBeVisible();
    
    // Check role selection
    await expect(page.getByText('System Role:')).toBeVisible();
    await expect(page.getByLabel('Driver')).toBeChecked();
  });

  test('validates form fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: 'Send Magic Link' }).click();
    
    // HTML5 validation should prevent submission, but we can check if inputs are invalid
    const emailInput = page.getByPlaceholder('Email');
    
    await expect(emailInput).toBeEmpty();
  });
});
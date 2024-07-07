import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await expect(page).toHaveTitle('Open Source Test Case Management System');
});

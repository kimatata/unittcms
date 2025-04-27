import { test, expect } from '@playwright/test';

test('First User signup and create project', async ({ page }) => {
  const screenshotDir = 'playwright-screenshots/first-user-signup';

  // Move to Sign up page
  await page.goto('http://localhost:8000/en/account/signup');

  // Fill sign up form
  await page.getByRole('textbox', { name: 'Email*' }).fill('user1@example.com');
  await page.getByRole('textbox', { name: 'User name*' }).fill('user1');
  await page.getByRole('textbox', { name: 'Password Password' }).fill('password');
  await page.getByRole('textbox', { name: 'Password (confirm)' }).fill('password');

  // Sign up
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.waitForURL('**/en/account');
  await page.screenshot({ path: `${screenshotDir}/after-sign-up.png`, fullPage: true });

  // Move to projects page
  await page.getByRole('button', { name: 'Find Projects' }).click();
  await page.waitForURL('**/en/projects');

  // Create new project
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByLabel('Project Name').fill('sample project');
  await page.getByRole('button', { name: 'Create' }).click();

  // Move to new project
  const projectLink = await page.getByRole('link', { name: 'sample project' });
  await expect(projectLink).toBeVisible();
  await projectLink.click();
  await page.waitForURL('**/en/projects/1/home');

  await page.screenshot({
    path: `${screenshotDir}/after-create-project.png`,
    fullPage: true,
  });
});

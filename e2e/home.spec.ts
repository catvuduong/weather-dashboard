import { test, expect } from '@playwright/test';
import { mockOpenMeteo } from './fixtures/open-meteo';

test.beforeEach(async ({ page }) => {
  await mockOpenMeteo(page);
});

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

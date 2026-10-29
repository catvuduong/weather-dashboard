import { expect, test, type Page } from '@playwright/test';
import { FORECAST_PATTERN, mockOpenMeteo } from './fixtures/open-meteo';

test.beforeEach(async ({ page }) => {
  await mockOpenMeteo(page);
});

async function searchFor(page: Page, query: string, city: string) {
  await page.getByTestId('city-search').fill(query);
  await page.getByRole('option', { name: new RegExp(`^${city}`) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(city);
}

test('default city renders with chart and forecast fully loaded', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ho Chi Minh City');
  await expect(page.getByTestId('current-temp')).toHaveText('30°C');
  await expect(page.getByTestId('hourly-chart').locator('svg.recharts-surface')).toBeVisible();
  await expect(page.getByTestId('forecast-day')).toHaveCount(7);
  await expect(page.getByTestId('forecast-day').first()).toContainText('Today');
  await expect(page.getByTestId('skeleton')).toHaveCount(0);
});

test('searching a city updates the heading and weather', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('city-search').fill('Han');
  await expect(page.getByRole('option', { name: /Hanoi/ })).toBeVisible();
  await page.getByRole('option', { name: /Hanoi/ }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hanoi');
  await expect(page.getByTestId('current-temp')).toHaveText('22°C');
  await expect(page.getByTestId('sky')).toHaveClass(/sky--rain/);
});

test('unit toggle converts values and keeps the choice after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('current-temp')).toHaveText('30°C');

  await page.getByTestId('unit-toggle').click();
  await expect(page.getByTestId('current-temp')).toHaveText('86°F');
  await expect(page.getByTestId('forecast-day').first().locator('.forecast-max')).toHaveText('91°F');

  await page.reload();
  await expect(page.getByTestId('current-temp')).toHaveText('86°F');

  await page.getByTestId('unit-toggle').click();
  await expect(page.getByTestId('current-temp')).toHaveText('30°C');
});

test('remembers the last five searched cities and reopens the latest one', async ({ page }) => {
  await page.goto('/');

  const searches: [string, string][] = [
    ['Hanoi', 'Hanoi'],
    ['Da Nang', 'Da Nang'],
    ['Hue', 'Hue'],
    ['Can Tho', 'Can Tho'],
    ['Nha Trang', 'Nha Trang'],
    ['Hai Phong', 'Hai Phong'],
  ];
  for (const [query, city] of searches) {
    await searchFor(page, query, city);
  }

  await page.getByTestId('city-search').click();
  const recent = page.getByTestId('city-option');
  await expect(recent).toHaveCount(5);
  await expect(recent.first()).toContainText('Hai Phong');
  await expect(page.getByRole('option', { name: /^Hanoi/ })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hai Phong');
  await expect(page.getByTestId('current-temp')).toHaveText('23°C');
});

test('shows loading skeletons until the forecast arrives', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(FORECAST_PATTERN, async (route) => {
    await gate;
    return route.fallback();
  });

  await page.goto('/');
  await expect(page.getByTestId('skeleton').first()).toBeVisible();
  await expect(page.getByTestId('current-temp')).toHaveCount(0);

  release();
  await expect(page.getByTestId('current-temp')).toHaveText('30°C');
  await expect(page.getByTestId('skeleton')).toHaveCount(0);
});

test('a failed forecast shows an error and retry loads the data', async ({ page }) => {
  let failing = true;
  await page.route(FORECAST_PATTERN, (route) =>
    failing ? route.fulfill({ status: 500, body: 'server error' }) : route.fallback(),
  );

  await page.goto('/');
  await expect(page.getByTestId('error-panel')).toContainText("couldn't be loaded");
  await expect(page.getByTestId('forecast-day')).toHaveCount(0);

  failing = false;
  await page.getByTestId('retry-button').click();
  await expect(page.getByTestId('current-temp')).toHaveText('30°C');
  await expect(page.getByTestId('forecast-day')).toHaveCount(7);
});

test('offline shows an offline message and retry recovers', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('current-temp')).toHaveText('30°C');

  // Going offline blocks navigation to localhost, so drop the network after load and
  // trigger a forecast request by picking another city.
  let offline = true;
  await page.route(FORECAST_PATTERN, (route) => (offline ? route.abort() : route.fallback()));
  await context.setOffline(true);

  await searchFor(page, 'Hanoi', 'Hanoi');
  await expect(page.getByTestId('error-panel')).toContainText("You're offline");

  offline = false;
  await context.setOffline(false);
  await page.getByTestId('retry-button').click();
  await expect(page.getByTestId('current-temp')).toHaveText('22°C');
});

test('a search with no matches says so', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('city-search').fill('zzzz');
  await expect(page.getByRole('status')).toHaveText('No matching cities');
  await expect(page.getByRole('option')).toHaveCount(0);
});

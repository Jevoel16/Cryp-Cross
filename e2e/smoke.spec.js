import { expect, test } from '@playwright/test';

// The main flow: a guest opens today's puzzle, types into the grid and checks it.
test('a guest can open, fill and check the daily puzzle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A daily crossword with encrypted clues');

  await page.getByRole('link', { name: /Play today.s puzzle/ }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Today.s Puzzle/);
  await expect(page.getByText('Guest · unranked')).toBeVisible();

  // Clicking the grid focuses its hidden input; typing fills the first entry.
  const grid = page.locator('.crossword-grid');
  await expect(grid).toBeVisible();
  await grid.locator('.cell:not(.block)').first().click();
  await page.keyboard.type('abc');
  await expect(grid.locator('.cell-letter').filter({ hasText: /^[ABC]$/ })).toHaveCount(3);
  await expect(page.locator('.timer')).not.toHaveClass(/idle/);

  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText(/\d+ right, \d+ wrong, \d+ unfinished\./)).toBeVisible();

  // Typed letters survive a reload.
  await page.reload();
  await expect(grid.locator('.cell-letter').filter({ hasText: /^[ABC]$/ })).toHaveCount(3);

  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404 Not Found');

  expect(errors).toEqual([]);
});

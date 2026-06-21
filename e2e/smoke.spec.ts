import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke tests for the main flows. Each test runs in an isolated browser context
 * (clean localStorage), so the app starts at the join gate with an empty local
 * plan (no Supabase env → local-only sync).
 */

async function join(page: Page, name = 'QA Tester') {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Walt Disney World Planner/ })).toBeVisible();
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  // Joined: the top-level nav appears.
  await expect(page.getByRole('button', { name: 'Wishlist' })).toBeVisible();
}

test('join gate lets you in and shows the top-level groups', async ({ page }) => {
  await join(page);
  await expect(page.getByRole('button', { name: 'Wishlist' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trip' })).toBeVisible();
});

test('onboarding points to the wishlist and the park picker is shown', async ({ page }) => {
  await join(page);
  await expect(page.getByText('Start with your wishlist')).toBeVisible();
  await page.getByRole('button', { name: /Tag your wishlist/ }).click();
  await expect(page.getByRole('button', { name: 'Magic Kingdom' })).toBeVisible();
});

test('wishlist shows a personal tagging-progress readout', async ({ page }) => {
  await join(page);
  // Starts at 0 tagged for a fresh user.
  await expect(page.getByText(/You've tagged/)).toContainText('0 of');
});

test('Trip group defaults to Lists with collapsible card blocks', async ({ page }) => {
  await join(page);
  await page.getByRole('button', { name: 'Trip' }).click();

  // Lists is the default sub-tab.
  await expect(page.getByRole('heading', { name: 'Group sign-up' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My checklist' })).toBeVisible();

  // Items list is collapsed by default; its add box appears once expanded.
  const itemsToggle = page.getByRole('button', { name: /Items ·/ });
  await expect(itemsToggle).toBeVisible();
  await expect(page.getByPlaceholder('Add a packing item…')).toBeHidden();
  await itemsToggle.click();
  await expect(page.getByPlaceholder('Add a packing item…')).toBeVisible();
});

test('save-money section shows an estimated total', async ({ page }) => {
  await join(page);
  await page.getByRole('button', { name: 'Trip' }).click();
  const saveMoney = page.getByRole('button', { name: /Bring it, don't buy it/ });
  await expect(saveMoney).toBeVisible();
  await expect(saveMoney).toContainText(/save ~\$/);
});

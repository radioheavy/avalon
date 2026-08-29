import { expect, test } from '@playwright/test';

const VIDEO_BRIEF = `# STRANGER — THE WAYSTATION

Create a 30-second cinematic short film.

# 0.0–15.0 SEC — ARRIVE

A stranger reaches a stone waystation in cold rain.

# 15.0–30.0 SEC — LEAVE

He reads one sentence, closes the shutter, and leaves.

# MUSIC

One restrained low bowed note.

# CAMERA LANGUAGE

Locked observational frames.`;

test('creates a video workspace from a markdown directing treatment', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('avalon-onboarding-complete', 'true');
    localStorage.setItem('avalon-storage', JSON.stringify({
      state: { prompts: [], currentPromptId: null, expandedPaths: [] },
      version: 0,
    }));
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'New prompt' }).click();
  await page.getByLabel('Source brief or JSON (optional)').fill(VIDEO_BRIEF);

  await expect(page.getByText('video workspace', { exact: true })).toBeVisible();
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('30s', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Create document' }).click();
  await expect(page.getByTestId('timeline-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ARRIVE' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'LEAVE' })).toBeVisible();
});

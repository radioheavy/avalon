import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const brief = readFileSync(resolve(process.cwd(), 'tests/fixtures/victory-day-brief.txt'), 'utf8');

test('plain-text brief stays connected from import through video generation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('avalon-onboarding-complete', 'true');
    localStorage.setItem('avalon-ai-provider', 'anthropic');
    localStorage.setItem('avalon-image-gen-provider', 'fal');
    sessionStorage.setItem('avalon-image-gen-api-key', 'test-fal-key');
  });

  await page.route('**/api/video/generate', async (route) => {
    const body = route.request().postDataJSON() as { action?: string; prompt?: string };
    if (body.action === 'submit') {
      expect(body.prompt).toContain('GLOBAL VISUAL LANGUAGE');
      expect(body.prompt).toContain('THE PAPER BREATHES');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { request_id: 'video-request-1234' } }) });
      return;
    }
    if (body.action === 'status') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'COMPLETED' } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { video: { url: 'https://media.example/segment.mp4', content_type: 'video/mp4' } } }) });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'New prompt' }).first().click();
  await page.getByLabel('Source brief or JSON (optional)').fill(brief);
  await expect(page.getByLabel('Detected document details')).toContainText('Plain-text brief');
  await expect(page.getByLabel('Detected document details')).toContainText('video');
  await expect(page.getByLabel('Detected document details')).toContainText('8 timeline segments');
  await page.getByRole('button', { name: 'Create document' }).click();

  await expect(page.getByRole('heading', { name: 'WATER, EARTH, DAWN' })).toBeVisible();
  await page.getByRole('tab', { name: 'Brief' }).click();
  await expect(page.getByLabel('Source brief')).toContainText('watercolor wash animation');
  await page.getByRole('tab', { name: 'Timeline' }).click();
  await expect(page.getByTestId('timeline-view')).toContainText('MEMORY HOLDS');
  await page.getByRole('button', { name: 'Open video studio' }).click();
  await expect(page.getByText('fal.ai queue connected')).toBeVisible();
  await expect(page.getByTestId('compiled-video-prompt')).toContainText('GLOBAL VISUAL LANGUAGE');
  await page.getByRole('button', { name: 'Generate selected segment' }).click();
  await expect(page.getByTestId('generated-video')).toHaveAttribute('src', 'https://media.example/segment.mp4', { timeout: 10_000 });

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('avalon-storage') || '{}'));
  expect(persisted.version).toBe(2);
  expect(persisted.state.prompts[0].source.raw).toContain('WATER, EARTH, DAWN');
  expect(persisted.state.prompts[0].projection.timeline).toHaveLength(8);
  expect(persisted.state.prompts[0].artifacts[0]).toMatchObject({
    kind: 'video',
    provider: 'fal.ai',
    status: 'complete',
  });
});

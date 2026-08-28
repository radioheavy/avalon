import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const brief = readFileSync(resolve(process.cwd(), 'tests/fixtures/victory-day-brief.txt'), 'utf8');
const tinyVideo = readFileSync(resolve(process.cwd(), 'tests/fixtures/tiny-video.mp4'));

test('plain-text brief stays connected from import through video generation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('avalon-onboarding-complete', 'true');
    localStorage.setItem('avalon-ai-provider', 'anthropic');
    localStorage.setItem('avalon-image-gen-provider', 'fal');
    sessionStorage.setItem('avalon-image-gen-api-key', 'test-fal-key');
  });

  await page.route('**/api/video', async (route) => {
    const body = route.request().postDataJSON() as { action?: string; request?: { prompt?: string }; job?: unknown };
    if (body.action === 'submit') {
      expect(body.request?.prompt).toContain('Global visual language');
      expect(body.request?.prompt).toContain('THE PAPER BREATHES');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, job: { id: 'job-1', provider: 'fal', capabilityId: 'fal:seedance-2.5:text-to-video', providerRequestId: 'video-request-1234', status: 'queued', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }) });
      return;
    }
    if (body.action === 'status') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, job: { ...(body.job as object), status: 'completed' } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, job: { ...(body.job as object), status: 'completed', outputs: [{ url: 'http://127.0.0.1:3000/__tiny-video.mp4', contentType: 'video/mp4' }] } }) });
  });
  await page.route('**/__tiny-video.mp4', (route) => route.fulfill({ status: 200, contentType: 'video/mp4', body: tinyVideo }));

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
  await expect(page.getByTestId('film-timeline')).toContainText('THE PAPER BREATHES');
  await page.getByRole('button', { name: 'Generate scene take' }).click();
  await expect(page.getByTestId('generated-video')).toHaveAttribute('src', 'http://127.0.0.1:3000/__tiny-video.mp4', { timeout: 10_000 });
  await expect.poll(() => page.getByTestId('generated-video').evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2);
  await page.getByTestId('use-next-first-frame').click();
  await expect(page.getByTestId('scene-inspector')).toContainText('SILHOUETTES FROM INK');
  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('avalon-storage') || '{}');
    return stored.state?.prompts?.[0]?.filmProject?.scenes?.[1]?.continuityIn?.status;
  })).toBe('ready');

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('avalon-storage') || '{}'));
  expect(persisted.version).toBe(3);
  expect(persisted.state.prompts[0].source.raw).toContain('WATER, EARTH, DAWN');
  expect(persisted.state.prompts[0].projection.timeline).toHaveLength(8);
  expect(persisted.state.prompts[0].filmProject.jobs[0]).toMatchObject({ provider: 'fal', status: 'complete' });
  expect(persisted.state.prompts[0].filmProject.scenes[0].takes).toHaveLength(1);
  expect(persisted.state.prompts[0].filmProject.scenes[0].takes[0]).toMatchObject({ status: 'complete' });
  expect(persisted.state.prompts[0].filmProject.scenes[1].continuityIn).toMatchObject({ role: 'continuity', status: 'ready' });

  const storedFrames = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolveDatabase, reject) => {
      const request = indexedDB.open('avalon-film-assets');
      request.onsuccess = () => resolveDatabase(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise<number>((resolveCount, reject) => {
      const request = database.transaction('blobs').objectStore('blobs').count();
      request.onsuccess = () => resolveCount(request.result);
      request.onerror = () => reject(request.error);
    });
  });
  expect(storedFrames).toBe(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Filmmaking workspace' })).toBeVisible();
  await expect(page.getByLabel('Scene navigator')).toBeHidden();
  await expect(page.getByTestId('scene-inspector')).toBeVisible();
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

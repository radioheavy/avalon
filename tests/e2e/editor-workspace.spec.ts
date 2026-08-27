import { expect, test, type Page } from '@playwright/test';

const promptContent = {
  image_generation: {
    subject: {
      description: 'A thoughtful editorial portrait of a creative director',
      wardrobe: 'Black wool jacket with a minimal silhouette',
      expression: 'Calm, direct and self-assured',
    },
    camera: {
      framing: 'Medium close-up',
      lens: '85mm prime lens',
      angle: 'Eye level',
    },
    lighting: {
      direction: 'Soft diffused window light from camera left',
      fill: 'Subtle negative fill on the shadow side',
      mood: 'Quiet and cinematic',
    },
    composition: {
      placement: 'Subject slightly off-center',
      depth: 'Shallow depth of field',
    },
    style: {
      aesthetic: 'Refined contemporary editorial photography',
      palette: 'Warm neutrals with restrained contrast',
    },
    negative_guidance: [
      'No plastic skin texture',
      'No exaggerated color grading',
      'No decorative overlays',
    ],
    quality: {
      resolution: 'High detail',
      realism: true,
    },
  },
};

async function seedWorkspace(page: Page) {
  await page.addInitScript(({ content }) => {
    localStorage.setItem('avalon-onboarding-complete', 'true');
    localStorage.setItem('avalon-ai-provider', 'anthropic');
    localStorage.setItem('avalon-storage', JSON.stringify({
      state: {
        prompts: [{
          id: 'qa-prompt',
          name: 'Cinematic Portrait',
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        currentPromptId: 'qa-prompt',
        expandedPaths: [],
      },
      version: 0,
    }));
  }, { content: promptContent });
}

test.beforeEach(async ({ page }) => {
  await seedWorkspace(page);
  await page.route('**/api/ai/update', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        updatedValue: 'Directional north-window light with a soft silver bounce',
        explanation: 'Adds a clearer direction and a practical fill reference.',
      }),
    });
  });
});

test('desktop editor supports the core prompt workflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/');

  await expect(page.getByTestId('editor-workspace')).toBeVisible();
  await expect(page.getByTestId('prompt-map')).toBeVisible();
  await expect(page.getByTestId('document-canvas')).toBeVisible();
  await expect(page.getByTestId('enhance-panel')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cinematic Portrait' })).toBeVisible();

  await page.getByRole('button', { name: /Lighting/ }).click();
  await expect(page.getByRole('heading', { name: 'Lighting' })).toBeVisible();

  const direction = page.getByTestId('document-canvas').locator('input').first();
  await expect(direction).toHaveValue('Soft diffused window light from camera left');
  await direction.fill('North-window light with a soft bounce');
  await expect(page.getByTestId('enhance-panel')).toContainText('image_generation.lighting.direction');

  await page.getByRole('button', { name: 'Add useful visual detail' }).click();
  await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible();
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(direction).toHaveValue('Directional north-window light with a soft silver bounce');

  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.getByTestId('document-canvas').getByText('Directional north-window light with a soft silver bounce')).toBeVisible();

  await page.getByRole('tab', { name: 'Raw JSON' }).click();
  const rawEditor = page.getByLabel('Raw JSON editor');
  await rawEditor.fill('{ invalid json');
  await page.getByRole('button', { name: 'Apply JSON' }).click();
  await expect(page.getByTestId('document-canvas').locator('p.text-red-300')).toContainText(/Expected property name|JSON/);

  await rawEditor.fill(JSON.stringify(promptContent, null, 2));
  await page.getByRole('button', { name: 'Apply JSON' }).click();
  await expect(page.getByText('Edit the complete document. Changes are validated before saving.')).toBeVisible();

  await page.getByRole('tab', { name: 'Editor' }).click();
  await page.getByTestId('document-canvas').locator('input').first().focus();
  await page.getByRole('heading', { name: 'Lighting' }).click();
  await page.getByRole('button', { name: 'Add useful visual detail' }).click();
  await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible();

  await page.screenshot({ path: 'artifacts/design-qa/editor-desktop.png', fullPage: true });
  expect(consoleErrors).toEqual([]);
});

test('compact editor exposes each pane without duplicate mounts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByTestId('document-canvas')).toBeVisible();
  await expect(page.getByTestId('prompt-map')).toBeHidden();
  await expect(page.getByTestId('enhance-panel')).toBeHidden();

  await page.getByRole('tab', { name: 'Prompt map' }).click();
  await expect(page.getByTestId('prompt-map')).toBeVisible();
  await page.getByRole('button', { name: /Lighting/ }).click();
  await expect(page.getByTestId('document-canvas')).toBeVisible();

  await page.getByRole('tab', { name: 'Enhance' }).click();
  await expect(page.getByTestId('enhance-panel')).toBeVisible();
  await expect(page.getByTestId('enhance-panel').getByText('image_generation.lighting', { exact: true })).toBeVisible();

  await page.screenshot({ path: 'artifacts/design-qa/editor-mobile.png', fullPage: true });
});

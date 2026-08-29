import { expect, test } from '@playwright/test';

const content = {
  image_generation: {
    subject: {
      description: 'A thoughtful editorial portrait of a creative director',
      wardrobe: 'Black wool jacket with a minimal silhouette',
      expression: 'Calm, direct and self-assured',
    },
    camera: { framing: 'Medium close-up', lens: '85mm prime lens', angle: 'Eye level' },
    lighting: {
      direction: 'Soft diffused window light from camera left',
      fill: 'Subtle negative fill on the shadow side',
      mood: 'Quiet and cinematic',
    },
    composition: { placement: 'Subject slightly off-center', depth: 'Shallow depth of field' },
    style: { aesthetic: 'Refined contemporary editorial photography', palette: 'Warm neutrals' },
    negative_guidance: ['No plastic skin texture', 'No decorative overlays'],
  },
};

async function seed(page: import('@playwright/test').Page) {
  await page.addInitScript(({ promptContent }) => {
    localStorage.setItem('avalon-onboarding-complete', 'true');
    localStorage.setItem('avalon-ai-provider', 'anthropic');
    localStorage.setItem('avalon-image-gen-provider', 'fal');
    sessionStorage.setItem('avalon-image-gen-api-key', 'test-image-key');
    localStorage.setItem('avalon-storage', JSON.stringify({
      state: {
        prompts: [{
          id: 'image-flow-prompt',
          name: 'Cinematic Portrait',
          content: promptContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        currentPromptId: 'image-flow-prompt',
        expandedPaths: [],
      },
      version: 0,
    }));
  }, { promptContent: content });
}

test('image studio stays connected to the active prompt', async ({ page }) => {
  let generationBody: Record<string, unknown> | null = null;
  await page.route('**/api/image/expand', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        expandedPrompt: {
          expanded_prompt: 'Editorial portrait, quiet confidence, 85mm lens, north-window light, warm neutral palette',
          scene: 'Minimal portrait studio',
          subjects: [{ type: 'person', description: 'Creative director in a black wool jacket', position: 'foreground' }],
          style: 'Contemporary editorial photography',
          lighting: 'Soft north-window light with negative fill',
          mood: 'Quiet and cinematic',
          color_palette: { primary: '#2a2522', secondary: '#c9b8a5', accent: '#7c3aed', description: 'Warm restrained neutrals' },
          composition: { framing: 'Medium close-up', angle: 'Eye level', focus: 'Eyes' },
          text_elements: null,
          technical: { aspect_ratio: '1:1', resolution: '1K', output_format: 'png' },
          negative_guidance: 'plastic skin, decorative overlays',
        },
      }),
    });
  });
  await page.route('https://fal.run/**', async (route) => {
    generationBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ images: [{ url: 'https://images.example/generated.png', content_type: 'image/png' }] }),
    });
  });
  await page.route('https://images.example/generated.png', async (route) => {
    await route.fulfill({ path: 'artifacts/design-qa/source-option-3-normalized.png', contentType: 'image/png' });
  });

  await seed(page);
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/');
  await expect(page.getByTestId('editor-workspace')).toBeVisible();

  await page.screenshot({ path: 'artifacts/flow-audit/01-editor-source.png', fullPage: true });
  await page.getByRole('tab', { name: /Generate/ }).click();
  await page.getByRole('button', { name: 'Generate image' }).click();
  await expect(page.getByRole('heading', { name: 'Image Studio' })).toBeVisible();
  await expect(page.getByText('Connected to Cinematic Portrait')).toBeVisible();
  await expect(page.getByTestId('enhance-panel')).toBeHidden();
  await expect(page.getByTestId('image-source-preview')).toContainText('thoughtful editorial portrait');
  await expect(page.getByTestId('image-source-preview')).toContainText('85mm prime lens');
  await expect(page.getByText('Basit Prompt')).toHaveCount(0);

  await page.getByRole('tab', { name: 'Current section' }).click();
  await expect(page.getByTestId('image-source-preview')).toContainText('thoughtful editorial portrait');
  await expect(page.getByTestId('image-source-preview')).not.toContainText('85mm prime lens');

  await page.getByLabel('Optional direction').fill('Keep the expression calm and make the light slightly warmer.');
  await page.getByRole('button', { name: 'Prepare with AI' }).click();
  await expect(page.getByText('Prepared recipe', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Editorial portrait, quiet confidence, 85mm lens, north-window light, warm neutral palette')).toBeVisible();

  await page.getByRole('button', { name: 'Generate prepared image' }).click();
  await expect(page.getByRole('img', { name: 'Generated result 1' })).toBeVisible();
  expect(generationBody).toMatchObject({
    prompt: 'Editorial portrait, quiet confidence, 85mm lens, north-window light, warm neutral palette',
    negative_prompt: 'plastic skin, decorative overlays',
  });

  await page.getByRole('button', { name: 'Back to editor' }).first().click();
  await expect(page.getByRole('heading', { name: 'Subject' })).toBeVisible();
  await page.getByRole('tab', { name: /Generate/ }).click();
  await page.getByRole('button', { name: 'Generate image' }).click();
  await expect(page.getByRole('img', { name: 'Generated result 1' })).toBeVisible();

  await page.getByRole('button', { name: 'Live source' }).click();
  await page.getByRole('button', { name: 'Generate from live prompt' }).click();
  expect(generationBody).toMatchObject({
    prompt: expect.stringContaining('Description: A thoughtful editorial portrait of a creative director'),
  });

  await page.screenshot({ path: 'artifacts/flow-audit/03-image-studio-after.png', fullPage: true });
});

test('mobile can enter studio and change the live source section', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('tab', { name: /Generate/ }).click();
  await page.getByRole('button', { name: 'Generate image' }).click();
  await expect(page.getByRole('heading', { name: 'Image Studio' })).toBeVisible();
  await expect(page.getByTestId('image-source-preview')).toContainText('85mm prime lens');
  await expect(page.getByRole('tab', { name: 'Enhance' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Sections' }).click();
  await page.getByRole('button', { name: /^Lighting / }).click();
  await page.getByRole('tab', { name: 'Current section' }).click();
  await expect(page.getByTestId('image-source-preview')).toContainText('Soft diffused window light');
  await expect(page.getByTestId('image-source-preview')).not.toContainText('Black wool jacket');

  await page.screenshot({ path: 'artifacts/flow-audit/04-image-studio-mobile.png', fullPage: true });
});

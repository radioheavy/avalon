'use client';

import type { Prompt } from '@/types/prompt';
import type { PromptDocument } from '@/types/prompt-document';
import type { FrameReference, VideoGenerationRequest as ProjectVideoRequest } from '@/types/filmmaking';
import type { VideoCredentials, VideoGenerationRequest, VideoJob, VideoJobStatus } from '@/lib/video/types';
import { compileVideoScenePrompt } from '@/lib/prompt-document/compiler';
import { blobToDataUrl, getFilmAssetBlob, saveFilmAssetBlob } from '@/lib/video/asset-store';
import { submitVideoJob, waitForVideoJob } from '@/lib/video/client';
import { usePromptStore } from '@/lib/store/promptStore';
import { FilmmakingWorkspace, type CapturedFrame, type SceneGenerationInput } from './FilmmakingWorkspace';

function credentialsFor(provider: 'fal' | 'wiro'): VideoCredentials {
  const configuredProvider = localStorage.getItem('avalon-image-gen-provider');
  const apiKey = sessionStorage.getItem('avalon-image-gen-api-key') || '';
  if (configuredProvider !== provider || !apiKey) {
    throw new Error(`Connect ${provider === 'fal' ? 'fal.ai' : 'Wiro'} in setup before generating with this model.`);
  }
  const apiSecret = provider === 'wiro' ? sessionStorage.getItem('avalon-wiro-api-secret') || undefined : undefined;
  return { apiKey, ...(apiSecret ? { apiSecret } : {}) };
}

function domainStatus(status: VideoJobStatus): 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' {
  if (status === 'completed') return 'complete';
  if (status === 'in-progress' || status === 'unknown') return 'running';
  return status;
}

async function persistedFrameValue(document: PromptDocument, reference?: FrameReference): Promise<string | undefined> {
  if (!reference?.imageAssetId || !document.filmProject) return undefined;
  const blob = await getFilmAssetBlob(reference.imageAssetId);
  if (blob) return blobToDataUrl(blob);
  const asset = document.filmProject.assets.find((item) => item.id === reference.imageAssetId);
  if (asset?.url && /^https?:\/\//i.test(asset.url)) return asset.url;
  throw new Error('The continuity frame is missing from this browser. Capture it again or attach a hosted image.');
}

export function ConnectedFilmmakingWorkspace({ prompt, onReturn }: { prompt: Prompt; onReturn: () => void }) {
  const document = prompt as PromptDocument;
  const actions = usePromptStore();

  const persistCapture = async (capture: CapturedFrame, role: FrameReference['role']): Promise<FrameReference> => {
    const project = usePromptStore.getState().getFilmProject(document.id);
    if (!project) throw new Error('Film project is not available.');
    const scene = project.scenes.find((item) => item.id === capture.sceneId);
    const sourceTake = scene?.takes.find((take) => take.id === scene.selectedTakeId) ?? scene?.takes.find((take) => take.outputAssetId);
    const assetId = `frame-${crypto.randomUUID()}`;
    await saveFilmAssetBlob(assetId, capture.blob);
    actions.addFilmAsset(document.id, {
      id: assetId,
      kind: 'frame',
      origin: 'derived',
      mimeType: capture.blob.type || 'image/png',
      sizeBytes: capture.blob.size,
      ...(sourceTake?.outputAssetId ? { sourceAssetId: sourceTake.outputAssetId } : {}),
      label: `Frame at ${capture.timeSeconds.toFixed(2)}s`,
    });
    return {
      id: `frame-ref-${crypto.randomUUID()}`,
      sourceAssetId: sourceTake?.outputAssetId ?? assetId,
      ...(sourceTake ? { sourceTakeId: sourceTake.id } : {}),
      timeSeconds: capture.timeSeconds,
      role,
      imageAssetId: assetId,
      status: 'ready',
      createdAt: new Date().toISOString(),
    };
  };

  const useAsNextSceneFirstFrame = async (capture: CapturedFrame) => {
    const project = usePromptStore.getState().getFilmProject(document.id);
    const current = project?.scenes.find((scene) => scene.id === capture.sceneId);
    const next = project?.scenes.filter((scene) => current && scene.order > current.order).sort((a, b) => a.order - b.order)[0];
    if (!project || !current || !next) throw new Error('No following scene is available.');
    const reference = await persistCapture(capture, 'continuity');
    actions.setSceneContinuity(document.id, current.id, 'out', reference);
    actions.setSceneContinuity(document.id, next.id, 'in', reference);
    actions.markDownstreamNeedsReview(document.id, current.id);
  };

  const generateScene = async (input: SceneGenerationInput) => {
    let latest = usePromptStore.getState().prompts.find((item) => item.id === document.id) as PromptDocument | undefined;
    const scene = latest?.filmProject?.scenes.find((item) => item.id === input.sceneId);
    if (!latest?.filmProject || !scene) throw new Error('Selected scene could not be found.');
    actions.updateSceneDirection(document.id, scene.id, { promptOverride: input.prompt });
    latest = usePromptStore.getState().prompts.find((item) => item.id === document.id) as PromptDocument | undefined;
    const updatedScene = latest?.filmProject?.scenes.find((item) => item.id === input.sceneId);
    if (!latest?.filmProject || !updatedScene) throw new Error('Selected scene could not be updated.');

    const firstReference = input.firstFrame
      ? await persistCapture(input.firstFrame, 'first-frame')
      : updatedScene.continuityIn;
    const lastReference = input.lastFrame
      ? await persistCapture(input.lastFrame, 'last-frame')
      : undefined;
    latest = usePromptStore.getState().prompts.find((item) => item.id === document.id) as PromptDocument | undefined;
    if (!latest?.filmProject) throw new Error('Film project is not available.');

    const compiledPrompt = compileVideoScenePrompt(latest.projection, {
      title: updatedScene.title,
      startSeconds: updatedScene.startSeconds,
      plannedDuration: input.duration,
      direction: { ...updatedScene.direction, promptOverride: input.prompt },
    });
    const firstFrameUrl = input.firstFrame
      ? await blobToDataUrl(input.firstFrame.blob)
      : await persistedFrameValue(latest, firstReference);
    const lastFrameUrl = input.lastFrame ? await blobToDataUrl(input.lastFrame.blob) : undefined;
    if (firstFrameUrl && !input.capability.inputs.firstFrame) {
      throw new Error('This scene has a continuity frame. Select the image-to-video operation for the chosen model.');
    }

    const providerRequest: VideoGenerationRequest = {
      capabilityId: input.capability.id,
      prompt: compiledPrompt,
      duration: input.duration,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      ...(firstFrameUrl ? { firstFrameUrl } : {}),
      ...(lastFrameUrl ? { lastFrameUrl } : {}),
      options: { outputFormat: input.outputFormat, ...(typeof input.generateAudio === 'boolean' ? { generateAudio: input.generateAudio } : {}) },
    };
    const projectRequest: ProjectVideoRequest = {
      capabilityId: input.capability.id,
      prompt: compiledPrompt,
      durationSeconds: input.duration,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      ...(input.capability.output.fps ? { fps: input.capability.output.fps } : {}),
      ...(typeof input.generateAudio === 'boolean' ? { audio: input.generateAudio } : {}),
      inputReferences: [firstReference, lastReference].filter((value): value is FrameReference => Boolean(value)),
      settings: { outputFormat: input.outputFormat },
    };
    const credentials = credentialsFor(input.capability.provider);
    const localJobId = actions.addGenerationJob(document.id, {
      sceneId: scene.id,
      capabilityId: input.capability.id,
      provider: input.capability.provider,
      model: input.capability.modelId,
      request: projectRequest,
    });
    if (!localJobId) throw new Error('Generation job could not be saved.');
    const takeId = actions.createTakeForJob(document.id, localJobId, {
      capabilityId: input.capability.id,
      compiledPrompt,
      requestSnapshot: projectRequest,
      inputReferences: projectRequest.inputReferences,
      status: 'queued',
      label: `Take ${updatedScene.takes.length + 1}`,
    });
    if (!takeId) throw new Error('Scene take could not be created.');

    try {
      const providerJob = await submitVideoJob(input.capability.provider, providerRequest, credentials);
      actions.updateGenerationJob(document.id, localJobId, { providerJobId: providerJob.providerRequestId, status: 'running' });
      actions.updateTake(document.id, scene.id, takeId, { status: 'running' });
      const result = await waitForVideoJob(providerJob, credentials, {
        onUpdate: (job: VideoJob) => actions.updateGenerationJob(document.id, localJobId, {
          status: domainStatus(job.status),
          ...(job.error ? { error: job.error } : {}),
        }),
      });
      const output = result.outputs[0];
      if (!output) throw new Error('The provider completed without a video output.');
      const outputAssetId = actions.addFilmAsset(document.id, {
        kind: 'video',
        origin: 'provider',
        mimeType: output.contentType || 'video/mp4',
        url: output.url,
        ...(output.duration ? { durationSeconds: output.duration } : {}),
        ...(output.width ? { width: output.width } : {}),
        ...(output.height ? { height: output.height } : {}),
        label: `${updatedScene.title} · Take ${updatedScene.takes.length + 1}`,
      });
      if (!outputAssetId) throw new Error('Generated video could not be added to the project.');
      actions.updateGenerationJob(document.id, localJobId, { status: 'complete', outputAssetIds: [outputAssetId] });
      actions.updateTake(document.id, scene.id, takeId, { status: 'complete', outputAssetId });
      actions.selectSceneTake(document.id, scene.id, takeId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation failed.';
      actions.updateGenerationJob(document.id, localJobId, { status: 'failed', error: message });
      actions.updateTake(document.id, scene.id, takeId, { status: 'failed', error: message });
      throw error;
    }
  };

  return (
    <FilmmakingWorkspace
      prompt={prompt}
      onReturn={onReturn}
      onScenePromptChange={(sceneId, value) => actions.updateSceneDirection(document.id, sceneId, { promptOverride: value })}
      onGenerateScene={generateScene}
      onUseAsNextSceneFirstFrame={useAsNextSceneFirstFrame}
      onSelectTake={(sceneId, takeId) => {
        actions.selectSceneTake(document.id, sceneId, takeId);
        actions.markDownstreamNeedsReview(document.id, sceneId);
      }}
    />
  );
}

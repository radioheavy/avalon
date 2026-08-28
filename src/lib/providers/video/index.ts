import { falVideoAdapter } from './fal';
import { wiroVideoAdapter } from './wiro';
import type { VideoAdapter, VideoProvider } from '@/lib/video/types';

export const videoAdapters: Record<VideoProvider, VideoAdapter> = {
  fal: falVideoAdapter,
  wiro: wiroVideoAdapter,
};

export function getVideoAdapter(provider: VideoProvider): VideoAdapter {
  return videoAdapters[provider];
}

export * from './fal';
export * from './wiro';

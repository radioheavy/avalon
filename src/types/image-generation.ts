// Image Generation Types for Nano Banana Pro

export interface Subject {
  type: string;
  description: string;
  position: 'foreground' | 'midground' | 'background';
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export interface Composition {
  framing: string;
  angle: string;
  focus: string;
}

export interface TextElement {
  content: string;
  style: string;
  placement: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '3:2' | '2:3' | '5:4' | '4:5';
export type Resolution = '1K' | '2K' | '4K';
export type OutputFormat = 'png' | 'jpeg' | 'webp';

export interface TechnicalSettings {
  aspect_ratio: AspectRatio;
  resolution: Resolution;
  output_format: OutputFormat;
}

export interface ExpandedImagePrompt {
  expanded_prompt: string;
  scene: string;
  subjects: Subject[];
  style: string;
  lighting: string;
  mood: string;
  color_palette: ColorPalette;
  composition: Composition;
  text_elements: TextElement[] | null;
  technical: TechnicalSettings;
  negative_guidance: string;
}

export interface ImageExpandResponse {
  success: boolean;
  expandedPrompt?: ExpandedImagePrompt;
  error?: string;
}

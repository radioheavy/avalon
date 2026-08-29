// Shared data for the landing surface. Kept in one place so copy and links
// stay consistent across sections.

export const BRAND = {
  name: 'Avalon',
  tagline: 'A structured prompt workspace for image and video',
  short: 'Avalon',
} as const;

export const LINKS = {
  primaryCta: '#editor',
  github: 'https://github.com/radioheavy/avalon',
  liveDemo: 'https://avalon.oesnada.com',
  macDownload:
    'https://pub-7c0a7463d6c24d1bafdec3a1e227ec2c.r2.dev/releases/Avalon_0.3.0_aarch64.dmg',
  windowsDownload: 'https://github.com/radioheavy/avalon/releases/latest',
  twitter: 'https://x.com/dakmaybe',
  authorHandle: '@dakmaybe',
  anthropic: 'https://console.anthropic.com/',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/apikey',
  wiro: 'https://wiro.ai/',
} as const;

export const PRODUCT_VIEWS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    alt: 'Avalon dashboard with recent prompts and workspace actions',
    description: 'Start a prompt, browse the library, or return to recent work.',
  },
  {
    key: 'editor',
    label: 'Build',
    alt: 'Avalon Build workspace with prompt map and editable fields',
    description: 'Edit complex prompts as a navigable tree.',
  },
  {
    key: 'refine',
    label: 'Refine',
    alt: 'Avalon Refine workspace with the Enhance panel',
    description: 'Improve one field with a reviewable AI suggestion.',
  },
  {
    key: 'generate',
    label: 'Generate',
    alt: 'Avalon Generate step with image and video studio choices',
    description: 'Carry the same structured document into the right studio.',
  },
  {
    key: 'image',
    label: 'Image Studio',
    alt: 'Avalon Image Studio with source prompt and generation controls',
    description: 'Prepare the live prompt, tune the recipe, and generate stills.',
  },
  {
    key: 'video',
    label: 'Video Studio',
    alt: 'Avalon Video Studio with player and scene timeline',
    description: 'Direct scenes and keep visual continuity across a film.',
  },
] as const;

export type ProductViewKey = (typeof PRODUCT_VIEWS)[number]['key'];

export const FEATURES = [
  {
    title: 'Structured editing',
    body: 'Work through title, subject, style, constraints, and timeline as distinct decisions—not one fragile block of text.',
    icon: 'TreePine',
  },
  {
    title: 'Useful expansion',
    body: 'Begin with a short direction, then develop a fuller brief you can still inspect and edit field by field.',
    icon: 'Sparkles',
  },
  {
    title: 'Reference, translated',
    body: 'Use a reference image to establish a starting point, then make its visual choices your own.',
    icon: 'Wand2',
  },
  {
    title: 'The right studio',
    body: 'Keep image and video work in dedicated studios, with the controls and context each medium needs.',
    icon: 'KeyRound',
  },
  {
    title: 'A research shelf',
    body: 'Browse prompts.chat without leaving the workspace. Import an idea, study its structure, and adapt it.',
    icon: 'Library',
  },
  {
    title: 'Your setup, kept local',
    body: 'Bring your own provider key. Prompts and credentials stay on your device, without an Avalon account.',
    icon: 'ShieldCheck',
  },
] as const;

export const PROVIDERS = [
  { name: 'Anthropic', key: 'anthropic' },
  { name: 'OpenAI', key: 'openai' },
  { name: 'Google Gemini', key: 'google' },
  { name: 'fal.ai', key: 'fal' },
  { name: 'Wiro.ai', key: 'wiro' },
] as const;

export const STEPS = [
  {
    n: '01',
    title: 'Build the structure',
    body: 'Edit subject, camera, light, style, and constraints as a navigable document. The source brief and its projection stay attached to the same record, ready to revise.',
  },
  {
    n: '02',
    title: 'Refine one field at a time',
    body: 'Pick a single field, ask the model for a reviewable suggestion, and keep the rest of the prompt intact. Apply, discard, or hand-edit the suggestion before it lands.',
  },
  {
    n: '03',
    title: 'Generate from the same document',
    body: 'Send the live structure to the image or video studio. Pick a take, capture a continuity frame, or return to the source for a sharper next pass.',
  },
] as const;

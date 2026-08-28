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

export const SCREENSHOTS = [
  {
    key: 'editor',
    label: 'Editor',
    src: '/a/new-3-editor.png',
    alt: 'Avalon visual JSON editor',
    description: 'Edit complex prompts as a navigable tree.',
  },
  {
    key: 'expander',
    label: 'Expander',
    src: '/a/new-4-expander.png',
    alt: 'AI prompt expander',
    description: 'Turn a one-liner into a structured prompt.',
  },
  {
    key: 'reverse',
    label: 'Reverse',
    src: '/a/new-6-reverse-result.png',
    alt: 'Reverse engineer an image back into a prompt',
    description: 'Drop a reference image, get the prompt.',
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    src: '/a/new-2-dashboard.png',
    alt: 'Avalon dashboard with community prompts',
    description: 'Browse, remix, and ship from a single workspace.',
  },
] as const;

export type ScreenshotKey = (typeof SCREENSHOTS)[number]['key'];

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
    body: 'Start with the brief, then give its subject, medium, composition, and constraints their own place to live.',
  },
  {
    n: '02',
    title: 'Refine the decisions',
    body: 'Open a single field when it needs attention, use AI where it helps, and keep the rest of the prompt intact.',
  },
  {
    n: '03',
    title: 'Generate and compare',
    body: 'Send the finished direction to the image or video studio, review the result, then return with a sharper next pass.',
  },
] as const;

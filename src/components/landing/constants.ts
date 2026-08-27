// Shared data for the landing surface. Kept in one place so copy and links
// stay consistent across sections.

export const BRAND = {
  name: 'Avalon',
  tagline: 'The AI prompt editor for image creators',
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
    title: 'Visual JSON editor',
    body: 'A tree view for complex prompts. Click, edit, and never wrestle with raw JSON again.',
    icon: 'TreePine',
  },
  {
    title: 'AI expansion',
    body: 'Start with a one-liner. Avalon shapes it into a production-ready prompt in seconds.',
    icon: 'Sparkles',
  },
  {
    title: 'Reverse engineer',
    body: 'Drop a reference image and recover a starting prompt you can iterate on.',
    icon: 'Wand2',
  },
  {
    title: 'Multi-provider',
    body: 'Anthropic, OpenAI, Google, fal.ai, Wiro.ai. Bring your own key, switch per task.',
    icon: 'KeyRound',
  },
  {
    title: 'Community prompts',
    body: 'Browse prompts.chat directly inside Avalon. Remix what works, ship faster.',
    icon: 'Library',
  },
  {
    title: 'Local-first & open',
    body: 'Your keys and prompts stay on your device. CC BY-NC, no telemetry, no account.',
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
    title: 'Pick a provider',
    body: 'Anthropic, OpenAI, Google, fal.ai, or Wiro.ai — switch any time.',
  },
  {
    n: '02',
    title: 'Drop your key',
    body: 'Stored locally in your browser. Never sent to a server we run.',
  },
  {
    n: '03',
    title: 'Start crafting',
    body: 'Write, expand, reverse-engineer, generate. Save what works.',
  },
] as const;

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileCode2,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Map,
  MessageSquareText,
  MoreHorizontal,
  Palette,
  PlayCircle,
  Search,
  Settings,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

export type ProductPreviewView =
  | 'dashboard'
  | 'editor'
  | 'refine'
  | 'generate'
  | 'image'
  | 'video';

type ProductPreviewProps = {
  view: ProductPreviewView;
  compact?: boolean;
};

const sections = [
  ['Title', 'Cinematic portrait study'],
  ['Subject', 'A lone figure at first light'],
  ['Composition', 'Wide frame, quiet negative space'],
  ['Style', 'Soft grain, muted film palette'],
  ['Lighting', 'Low morning side light'],
  ['Constraints', 'No text, no logos'],
];

function AppHeader({ title = 'Cinematic Portrait' }: { title?: string }) {
  return (
    <div className="flex h-11 min-w-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 text-left sm:h-14 sm:gap-3 sm:px-4">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-[10px] font-semibold text-white">A</span>
      <span className="hidden h-5 w-px bg-zinc-200 sm:block" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold text-zinc-900 sm:text-xs">{title}</p>
        <p className="flex items-center gap-1 text-[9px] text-zinc-400 sm:text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Saved locally</p>
      </div>
      <span className="hidden rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-medium text-zinc-500 sm:inline-flex">Anthropic</span>
      <button type="button" aria-label="Document actions" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 sm:h-8 sm:w-auto sm:gap-1 sm:px-2 sm:text-[10px]"><span className="hidden sm:inline">Document actions</span><MoreHorizontal className="h-3.5 w-3.5 sm:hidden" /><ChevronDown className="hidden h-3 w-3 sm:block" /></button>
    </div>
  );
}

function WorkflowNav({ active }: { active: 'Build' | 'Refine' | 'Generate' }) {
  return (
    <div className="grid h-12 grid-cols-3 gap-1 border-b border-zinc-200 bg-white px-2 sm:h-16 sm:gap-3 sm:px-4">
      {([['1', 'Build', 'Shape the prompt'], ['2', 'Refine', 'Improve with AI'], ['3', 'Generate', 'Create the output']] as const).map(([number, label, description]) => {
        const selected = active === label;
        return <div key={label} className={`flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 sm:justify-start sm:gap-2 sm:px-2 ${selected ? 'border-violet-600' : 'border-transparent'}`}>
          <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold sm:h-6 sm:w-6 sm:text-[10px] ${selected ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{number}</span>
          <span className="min-w-0"><span className={`block truncate text-[10px] font-semibold sm:text-xs ${selected ? 'text-zinc-950' : 'text-zinc-400'}`}>{label}</span><span className="hidden truncate text-[9px] text-zinc-400 sm:block">{description}</span></span>
        </div>;
      })}
    </div>
  );
}

function PromptMap() {
  return <aside className="hidden w-[31%] min-w-0 shrink-0 border-r border-zinc-200 bg-white sm:block">
    <div className="border-b border-zinc-200 px-3 py-3 sm:px-4 sm:py-4"><div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-950 sm:text-xs"><Map className="h-3.5 w-3.5" /> Prompt map</div><div className="relative mt-2"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" /><span className="block rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-6 text-[9px] text-zinc-400 sm:py-2 sm:text-[10px]">Search sections</span></div></div>
    <div className="space-y-0.5 overflow-hidden px-1.5 py-2 sm:px-2 sm:py-3">{sections.map(([label, value], index) => <div key={label} className={`border-l-2 px-2 py-2 sm:px-3 sm:py-2.5 ${index === 0 ? 'border-violet-600 bg-violet-50/70' : 'border-transparent'}`}><div className="flex min-w-0 items-start gap-2"><FileCode2 className={`mt-0.5 h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${index === 0 ? 'text-violet-700' : 'text-zinc-400'}`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-1"><p className="truncate text-[10px] font-semibold text-zinc-800 sm:text-[11px]">{label}</p><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" /></div><p className="mt-0.5 truncate text-[9px] text-zinc-400 sm:text-[10px]">{value}</p></div></div></div>)}</div>
  </aside>;
}

function FieldRows({ selected = false }: { selected?: boolean }) {
  return <div className="divide-y divide-zinc-100">{sections.slice(0, selected ? 5 : 4).map(([label, value], index) => <div key={label} className={`grid gap-1.5 px-3 py-2.5 sm:grid-cols-[minmax(80px,.7fr)_minmax(0,1.3fr)] sm:items-center sm:gap-3 sm:px-5 sm:py-3.5 ${selected && index === 1 ? 'bg-violet-50/60' : ''}`}><div><p className="text-[10px] font-semibold text-zinc-800 sm:text-xs">{label}</p><p className="text-[9px] text-zinc-400 sm:text-[10px]">string</p></div><div className="min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[10px] leading-4 text-zinc-600 sm:text-[11px]">{value}</div></div>)}</div>;
}

function EditorSurface({ view }: { view: 'editor' | 'refine' }) {
  return <div className="flex min-h-0 flex-1 flex-col bg-zinc-50"><AppHeader /><WorkflowNav active={view === 'refine' ? 'Refine' : 'Build'} /><div className="flex min-h-0 flex-1 overflow-hidden"><PromptMap /><main className="min-w-0 flex-1 overflow-hidden bg-white"><div className="flex min-h-12 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 sm:min-h-16 sm:px-5"><div className="flex min-w-0 items-center gap-2"><Palette className="h-4 w-4 shrink-0 text-zinc-800 sm:h-5 sm:w-5" /><div className="min-w-0"><h2 className="truncate text-xs font-semibold text-zinc-950 sm:text-sm">{view === 'refine' ? 'Subject' : 'Title'}</h2><p className="truncate text-[9px] text-zinc-500 sm:text-[10px]">Structured prompt section</p></div></div><div className="flex shrink-0 items-center gap-1 rounded-lg bg-zinc-100 p-0.5"><span className="rounded-md bg-white px-2 py-1 text-[9px] font-medium text-zinc-900 shadow-sm sm:px-2.5 sm:text-[10px]">Edit</span><span className="px-1.5 py-1 text-[9px] text-zinc-400 sm:px-2 sm:text-[10px]">Preview</span></div></div>{view === 'refine' ? <RefinePanel /> : <FieldRows />}</main></div><div className="flex h-7 items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 px-3 text-[8px] text-zinc-400 sm:h-9 sm:px-4 sm:text-[9px]"><span className="truncate">prompt.title</span><span className="flex shrink-0 items-center gap-1 text-emerald-700"><CheckCircle2 className="h-2.5 w-2.5" /> Valid JSON</span></div></div>;
}

function RefinePanel() {
  return <div className="grid min-h-0 h-full grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(12rem,29%)]"><div className="min-w-0 overflow-hidden"><FieldRows selected /></div><aside className="hidden min-w-0 border-l border-zinc-200 bg-white lg:block"><div className="flex items-center gap-1.5 border-b border-zinc-200 px-3 py-3 text-[10px] font-semibold text-zinc-900 sm:px-4 sm:text-xs"><MessageSquareText className="h-3.5 w-3.5" /> Enhance<span className="ml-auto rounded-md bg-zinc-50 px-1.5 py-1 text-[8px] font-normal text-zinc-400">Claude Sonnet 5</span></div><div className="space-y-3 p-3 sm:p-4"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400 sm:text-[10px]">Selected field</p><code className="block break-all rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-[9px] text-violet-800">prompt.subject</code><div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[10px] leading-4 text-zinc-600">A lone figure at first light</div><p className="pt-1 text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400">Quick actions</p>{['Make this clearer and more precise', 'Add useful visual detail'].map((action) => <div key={action} className="rounded-lg border border-zinc-200 px-2.5 py-2 text-[9px] leading-3 text-zinc-600">{action}</div>)}<div className="rounded-lg border border-zinc-200 px-2.5 py-2 text-[9px] text-zinc-400">Describe the change you want…</div><div className="rounded-full bg-zinc-950 py-2 text-center text-[9px] font-medium text-white">Review suggestion</div></div></aside></div>;
}

function GenerateSurface() {
  return <div className="flex min-h-0 flex-1 flex-col bg-zinc-50"><AppHeader /><WorkflowNav active="Generate" /><main className="min-h-0 flex-1 overflow-hidden px-3 py-5 sm:px-8 sm:py-9"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-violet-700 sm:text-[10px]">Step 3 · Generate</p><h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950 sm:text-2xl">Turn the prompt into an output</h2><p className="mt-2 max-w-lg text-[10px] leading-4 text-zinc-600 sm:text-xs sm:leading-5">Your structured prompt is ready. Choose the kind of output you want to create.</p><div className="mt-5 grid gap-2.5 sm:mt-7 sm:gap-3 md:grid-cols-2"><StudioChoice icon={<ImageIcon />} title="Generate image" body="Prepare the live prompt, tune the recipe, and create still images." tone="violet" /><StudioChoice icon={<Film />} title="Create video" body="Use the brief and timeline to direct scenes and maintain continuity." tone="cyan" /></div><div className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[9px] text-zinc-500 sm:mt-4 sm:px-3 sm:py-2.5 sm:text-[10px]"><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />Connected to <strong className="truncate text-zinc-800">Cinematic Portrait</strong></div></main></div>;
}

function StudioChoice({ icon, title, body, tone }: { icon: React.ReactNode; title: string; body: string; tone: 'violet' | 'cyan' }) {
  return <div className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 sm:rounded-2xl sm:p-4"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${tone === 'violet' ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700'}`}>{icon}</span><h3 className="mt-3 text-xs font-semibold text-zinc-950 sm:mt-4 sm:text-sm">{title}</h3><p className="mt-1 text-[10px] leading-4 text-zinc-500 sm:text-xs sm:leading-5">{body}</p><p className={`mt-3 flex items-center gap-1 text-[9px] font-semibold sm:mt-4 sm:text-[10px] ${tone === 'violet' ? 'text-violet-700' : 'text-cyan-700'}`}>Open studio <ArrowRight className="h-3 w-3" /></p></div>;
}

function ImageSurface() {
  return <div className="flex min-h-0 flex-1 flex-col bg-zinc-50"><AppHeader /><div className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="flex min-h-12 items-center gap-2 border-b border-zinc-200 bg-white px-3 sm:min-h-14 sm:px-5"><ImageIcon className="h-4 w-4 text-violet-700 sm:h-5 sm:w-5" /><div><h2 className="text-xs font-semibold text-zinc-950 sm:text-sm">Image studio</h2><p className="text-[9px] text-zinc-500 sm:text-[10px]">Prepare, tune, and generate from your live prompt</p></div></div><div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_13rem]"><div className="min-w-0 overflow-hidden bg-white p-3 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400 sm:text-[10px]">Source prompt</p><span className="rounded-full bg-zinc-100 px-2 py-1 text-[8px] text-zinc-500">Document</span></div><div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-[10px] leading-4 text-zinc-600 sm:mt-3 sm:p-3 sm:text-[11px]">A lone figure at first light, wide frame, muted film palette, soft grain, quiet negative space.</div><div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/60 p-2.5 sm:mt-4 sm:p-3"><div className="flex items-center gap-1.5 text-[9px] font-semibold text-violet-800 sm:text-[10px]"><WandSparkles className="h-3 w-3" /> Ready to generate</div><p className="mt-1 text-[9px] leading-4 text-violet-700/80">Expand the prompt with AI, then choose a provider and size.</p></div></div><aside className="hidden border-l border-zinc-200 bg-white p-3 lg:block"><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400">Generation</p><label className="mt-3 block text-[9px] text-zinc-500">Provider<span className="mt-1 block rounded-lg border border-zinc-200 px-2 py-2 text-[10px] text-zinc-700">fal.ai <ChevronDown className="float-right h-3 w-3" /></span></label><label className="mt-2 block text-[9px] text-zinc-500">Image size<span className="mt-1 block rounded-lg border border-zinc-200 px-2 py-2 text-[10px] text-zinc-700">Square HD</span></label><div className="mt-4 rounded-full bg-zinc-950 py-2 text-center text-[9px] font-medium text-white">Generate image</div></aside></div></div></div>;
}

function VideoSurface() {
  return <div className="flex min-h-0 flex-1 flex-col bg-zinc-950 text-white"><div className="flex h-11 items-center gap-2 border-b border-white/10 px-3 sm:h-14 sm:px-5"><span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[10px] font-semibold text-zinc-950">A</span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold sm:text-xs">Cinematic Portrait · Video studio</p><p className="text-[9px] text-white/40 sm:text-[10px]">Timeline connected</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-white/50">Wiro.ai</span></div><div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_15rem]"><div className="flex min-h-0 flex-col p-3 sm:p-5"><div className="flex min-h-32 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] sm:min-h-48"><div className="text-center"><PlayCircle className="mx-auto h-8 w-8 text-white/30 sm:h-10 sm:w-10" /><p className="mt-2 text-[10px] text-white/50 sm:text-xs">Your generated film will appear here</p></div></div><div className="mt-2 flex items-center gap-2 text-[9px] text-white/45"><span>00:00</span><div className="h-1 flex-1 rounded-full bg-white/15"><div className="h-1 w-1/3 rounded-full bg-violet-400" /></div><span>00:30</span></div></div><aside className="hidden border-l border-white/10 p-3 sm:p-4 lg:block"><div className="flex items-center gap-1.5 text-[10px] font-semibold sm:text-xs"><Film className="h-3.5 w-3.5" /> Scenes</div><div className="mt-3 space-y-2">{['Dawn / Establishing', 'Figure enters frame', 'Hold on the horizon'].map((scene, index) => <div key={scene} className={`rounded-lg border px-2.5 py-2 text-[9px] ${index === 0 ? 'border-violet-400/50 bg-violet-400/10 text-white' : 'border-white/10 text-white/50'}`}><span className="mr-1.5 text-violet-300">0{index + 1}</span>{scene}</div>)}</div></aside></div></div>;
}

function DashboardSurface() {
  return <div className="min-h-0 flex-1 overflow-hidden bg-white"><div className="flex h-11 items-center justify-between border-b border-zinc-200 px-3 sm:h-14 sm:px-5"><div className="flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-[10px] font-semibold text-white">A</span><span className="text-xs font-semibold text-zinc-900">Avalon</span></div><div className="flex items-center gap-1.5"><span className="hidden rounded-full border border-zinc-200 px-2 py-1 text-[9px] text-zinc-500 sm:inline-flex">Anthropic</span><Settings className="h-3.5 w-3.5 text-zinc-400" /></div></div><div className="border-b border-zinc-200 bg-zinc-50 px-3 py-5 sm:px-6 sm:py-8"><span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[9px] text-zinc-500"><Sparkles className="h-3 w-3 text-violet-600" /> Your prompt workspace</span><h1 className="mt-3 max-w-md text-xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-3xl">Welcome back. Let&apos;s make the next prompt <span className="text-violet-700">your best one.</span></h1><p className="mt-2 max-w-md text-[10px] leading-4 text-zinc-600 sm:text-xs sm:leading-5">Build structured prompts, refine them with AI, or reverse-engineer a visual into an editable JSON workflow.</p><div className="mt-4 flex gap-2"><span className="rounded-full bg-zinc-950 px-3 py-1.5 text-[9px] font-medium text-white">New prompt</span><span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[9px] font-medium text-zinc-600">Browse library</span></div></div><div className="grid gap-2 p-3 sm:grid-cols-3 sm:p-5"><div className="col-span-full mb-1 flex items-center justify-between"><p className="text-xs font-semibold text-zinc-900">Recent prompts</p><span className="text-[9px] text-zinc-400">View all</span></div>{[['Cinematic Portrait', 'Image · 6 sections'], ['WATER, EARTH, DAWN', 'Video · 13 segments'], ['Editorial still life', 'Image · 8 sections']].map(([title, meta]) => <div key={title} className="min-w-0 rounded-xl border border-zinc-200 p-2.5"><div className="flex items-start gap-2"><FolderOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-700" /><div className="min-w-0"><p className="truncate text-[10px] font-semibold text-zinc-800">{title}</p><p className="mt-1 text-[9px] text-zinc-400">{meta}</p></div></div></div>)}</div></div>;
}

export function ProductPreview({ view, compact = false }: ProductPreviewProps) {
  return <div className={`flex min-h-0 w-full overflow-hidden rounded-[inherit] border border-zinc-200 bg-white text-left shadow-inner ${compact ? 'aspect-[1.18/1]' : 'aspect-[16/9]'}`} aria-label={`Avalon ${view} preview`}>
    {view === 'dashboard' && <DashboardSurface />}
    {(view === 'editor' || view === 'refine') && <EditorSurface view={view} />}
    {view === 'generate' && <GenerateSurface />}
    {view === 'image' && <ImageSurface />}
    {view === 'video' && <VideoSurface />}
  </div>;
}

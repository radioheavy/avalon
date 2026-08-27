# Image Studio Flow Audit

## Overall verdict

The original Generate image path was disconnected from the editor: it opened an empty prompt-expander form, kept image-expansion state globally, and left the unrelated Enhance panel visible. The revised flow treats the active prompt document as the source of truth from entry through generation.

## Flow evidence

1. Editor source — healthy
   - Screenshot: `artifacts/flow-audit/01-editor-source.png`
   - The structured prompt exists and its sections are visible before entering image generation.

2. Original Image Studio — blocked
   - Screenshot: `artifacts/flow-audit/02-image-studio-before.png`
   - The main field starts empty and asks for a second prompt.
   - Quick Generate is another separate prompt path.
   - The right-side Enhance panel remains visible even though it no longer matches the active task.
   - The screen gives no evidence that the current document will be used.

3. Revised integrated flow — healthy
   - Screenshot: `artifacts/flow-audit/03-image-studio-after.png`
   - The live document is attached automatically and can be scoped to the full prompt or current section.
   - Optional direction supplements the document instead of replacing it.
   - AI preparation, provider settings, the exact prompt version sent, generation, and output review live in one continuous workspace.
   - Prepared recipes and generated results remain available when returning to the editor and reopening Studio, as long as their source is still current.

4. Revised mobile flow — healthy
   - Screenshot: `artifacts/flow-audit/04-image-studio-mobile.png`
   - Studio now has a direct mobile navigation entry.
   - Prompt map and Studio remain connected, so choosing Lighting immediately changes the current-section source.
   - The unrelated Enhance tab is removed while Studio is active.

## Highest-impact changes

- Removed the blank re-entry prompt and standalone Quick Generate branch.
- Removed global image-expansion state that could leak between prompt documents.
- Added deterministic live-document serialization for full-prompt and section-level generation.
- Kept optional AI preparation, but made direct generation from the live prompt equally valid.
- Preserved the active Image Studio run while moving between Studio and the editor.
- Replaced the desktop three-panel editor layout with Prompt Map plus a unified Studio workspace during generation.

## Accessibility checks

- Scope controls use tab semantics and expose selected state.
- Instruction and generation selectors have explicit labels.
- Errors use alert roles and generated output uses a polite live region.
- Mobile keeps persistent, labeled navigation and avoids hover-only primary actions.

Screenshot evidence cannot prove complete keyboard order, screen-reader output, provider authentication behavior, or color contrast under every OS/browser setting; those require runtime checks beyond visual inspection.

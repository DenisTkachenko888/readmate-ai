---
name: asset-workflow
description: Use when a task involves images, media, logos, icons, illustrations, backgrounds, avatars, screenshots, generated visual assets, or UI work that needs files from .vibecraft/assets. Guides asset discovery, reuse-first selection, generation fallback, and Next.js wiring in this template.
---

# Asset Workflow

Use this skill only when visual or media assets matter. Do not inspect `.vibecraft/assets` for unrelated data, API, CRUD, or layout-only tasks.

## Workflow

1. Check existing assets first. Use one filesystem glob over `.vibecraft/assets/**/*`; in a shell-only environment, `find .vibecraft/assets -type f -print` is equivalent. If the directory does not exist or is empty, continue to the fallback step.
2. Select an existing file when its name, apparent content, or intended function matches the task. Prefer adapting layout, crop, sizing, copy, or composition around a suitable existing asset before creating a replacement.
3. Inspect only plausible candidates. Start from filenames and paths; preview or read metadata only when the choice is ambiguous. Avoid loading every asset into context.
4. Make chosen assets browser-readable. For this Next.js template, copy static files that the browser must request into `public/assets/` and reference them as `/assets/<filename>`, unless the repo already has a clearer established asset pattern.
5. Use `next/image` for content images when dimensions are known. Use CSS backgrounds only for decorative imagery. Keep lucide-react as the source for routine UI icons.
6. Create or generate a new asset only when no suitable existing file is available. Save new source assets under `.vibecraft/assets` with descriptive lowercase hyphenated names, then expose them through `public/assets/` if the app needs to render them.
7. In the final response, mention which existing assets were reused and which new asset files, if any, were added.

## Fallback Creation

- For bitmap photos, illustrations, textures, sprites, mockups, or transparent cutouts, use the image generation workflow available in the environment.
- For simple code-native UI decoration, prefer CSS, shadcn/ui, and lucide-react over adding image files.
- Do not fetch remote stock assets when a local asset can satisfy the same function.

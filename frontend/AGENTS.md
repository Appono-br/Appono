<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI color standard

- Primary buttons use the same dark brown (`#4c2f20`) in light and dark themes, with `#3a2318` on hover and `#f5ebdd` for text/icons. Use the shared `--app-botao-primario*` variables in `app/globals.css`; do not introduce alternate primary browns or invert the primary color in dark mode.
- Use `app-button-primary` for primary buttons and action links, and `app-button-secondary` for secondary actions. Tailwind also exposes `app-primaria`, `app-primaria-hover`, `app-sobre-primaria`, `app-secundaria`, `app-secundaria-hover`, and `app-sobre-secundaria` color tokens.
- Selected tabs use the primary brown; inactive tabs use the neutral secondary palette. Destructive actions retain their danger colors.
- Home profile choices (`home-profile-option`) have a slightly darker beige background and no border. Home language and account-creation actions (`home-header-soft-action`) have a transparent background and a thin shared border, including hover/focus states. The home header's login action uses terracotta (`home-header-login-action`) in both themes; this is a specific exception to the primary brown.
- The public home showcases at most six Appono partners after the About section, in one horizontal row showing only their logos. Image frames follow each logo's natural proportions, with thin vertical dividers between items; restaurant names remain accessible through image alternative text. Partner items are static, with no links, buttons, or detail dialogs. Calendar dates remain transparent and borderless except for the current/selected date indicators. Do not apply filled-button styles to these components.

- The public home's About, four-step guide, and FAQ titles share the responsive `discover-section-title` style (32–56px). Partners must have their own logo; exclude `[DEMO]` / `demo.rotina.*` seed records and illustrative Unsplash stock photos before applying the six-partner limit.

## UI border standard

- Use a single 1px border (`--app-borda-espessura`) for panels, form fields, images, and dividers. Avoid combining a decorative Tailwind ring with an existing border. Keep keyboard focus indicators distinct and visible.
- Buttons and action links are borderless in both themes, including hover, selected, disabled, and destructive states, except the explicitly requested 1px border on `home-header-soft-action`. Remove decorative rings as well; preserve keyboard focus indicators. Public partner items have a transparent background.
- Dark theme borders use `--app-borda-cor` (brown at 28% opacity), shared by `--ui-borda` and `--ui-borda-controle`. Preserve semantic error colors, selected states, and intentionally borderless calendar dates. Do not change block backgrounds when adjusting borders.

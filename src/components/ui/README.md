# UI primitives

These are the shadcn-shaped components for RetainerSnap. They use the tokens in `src/app/globals.css` (paper, ink, moss, clay, line) rather than the default zinc theme.

`components.json` at the repo root points `ui` at this folder and `utils` at `@/lib/utils`. Add a new primitive here, export it from its own file, and keep submit and navigation controls at `h-11`.

# AGENTS.md

## Project

This repository contains a Japanese seminar design SPA called Seminar Design Compass.

## Rules

- Keep the core seminar design logic generic.
- Put TKC-specific labels, templates, and checks in `src/contextPacks/tkc.ts`.
- Do not hard-code seminar duration, speaker names, or TKC-specific rules in React components.
- Do not add server-side code or external API calls for the MVP.
- Do not commit confidential materials, slide images, or internal TKC documents.
- Keep all generated UI text in Japanese unless code identifiers require English.
- Run `npm run test` and `npm run build` before reporting completion.
- Use sub-agents when they materially help review or split work, without overlapping file ownership.

## Architecture

- Domain types and pure functions live under `src/domain`.
- Context packs live under `src/contextPacks`.
- UI components live under `src/components`.
- Export generators must be deterministic and testable.

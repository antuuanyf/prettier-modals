# AGENTS.md — Prettier Modals

Rules and conventions for agents (and humans) working in this repo.

## Git workflow

- **From now on: branches + PRs to `main`.** Do **not** commit directly to `main`.
  - Branch from up-to-date `main`: `git switch -c <type>/<short-desc>` (e.g. `feat/angular-demo`, `test/core-vitest`, `fix/...`).
  - Open a PR to `main` with `gh pr create`. Keep PRs focused.
- Remote: `origin` = `antuuanyf/prettier-modals` (push here). Standalone repo — not a fork.
- Commit only when asked. End commit messages with the `Co-Authored-By: Claude …` trailer.
- Never commit `dist/` or `node_modules/` (both git-ignored). Builds happen at publish time.

## Monorepo layout

npm workspaces:

```
packages/core/      → prettier-modals          (vanilla core, tsup)
packages/angular/   → prettier-modals-angular  (Angular wrapper, ng-packagr)
demo/               → vanilla demo (no build; served over HTTP)
```

> `docs/` holds local-only planning notes — it's git-ignored and not pushed.

### Build

```bash
npm install            # install all workspaces
npm run build:core     # tsup → ESM + CJS + .d.ts
npm run build:angular  # ng-packagr → APF (build core first; it's a peer)
npm run build          # both
```

## Core (`packages/core`) conventions

- **GSAP is a peer dependency** (`>=3.12`) — never bundle it (`external` in tsup). Import as modules: `gsap`, `gsap/Flip`, `gsap/CustomEase`; `registerPlugin` once at module load.
- **No global `event`**: the trigger element is explicit (`{ trigger }`). A fallback to `event.currentTarget` exists only for inline handlers; don't rely on it.
- API accepts **id string or `HTMLElement`** for both dialog and trigger.
- **SSR-safe**: guard any `document`/`window` access (`typeof … !== 'undefined'`).
- Types come from **JSDoc** (`tsup` `dts` + `tsconfig` `allowJs`/`emitDeclarationOnly`). Keep public methods' JSDoc complete and accurate — it *is* the type surface.
- `data-flip-id` must be shared between trigger and dialog before `Flip.getState` — it's how Flip morphs one into the other. Removing it silently breaks the animation.

## Angular wrapper (`packages/angular`) conventions

- **Standalone** only (no `NgModule`). Peer dep `@angular/* >=17`.
- Run GSAP animations with `NgZone.runOutsideAngular`; emit outputs back inside the zone (`zone.run`).
- Browser-only: instantiate the core lazily behind `isPlatformBrowser`.
- ng-packagr auto-discovers `tsconfig.json` (not `tsconfig.lib.json`) in the package dir; compiles Ivy **partial** mode.
- Keep `@angular/*` and `prettier-modals` external in the FESM bundle.

## Demo (no bundler)

- Served over **HTTP** (ES modules + import maps don't work from `file://`): `npx serve .` → `http://localhost:3000/demo/`.
- Import map must point `gsap`, `gsap/Flip`, `gsap/CustomEase` all to **`gsap/all.js/+esm`** (one shared instance). Per-plugin `+esm` bundles each ship their own GSAP copy and break Flip.

## Verifying animations

The animation is the product — verify it for real, not just unit-mocked. Pattern used here: static server + headless Chrome via CDP (Node has a global `WebSocket`), sample `getComputedStyle` over time. Automate as Playwright e2e (see the local `docs/` planning notes).

## Publishing

Publish `prettier-modals` first, then `prettier-modals-angular` (it peer-depends on the core). Bump versions together.

For the Angular wrapper, **publish the `ng-packagr` output (`packages/angular/dist`), never the source folder.** Publishing from `packages/angular/` ships raw `src/` with no `module`/`typings`/`exports` and breaks consumers (`TS2307: Cannot find module 'prettier-modals-angular'`). This happened in 0.2.0 and was fixed in 0.2.1.

Use the root scripts (they build then target the right dir):

```bash
npm run publish:core      # builds + publishes packages/core
npm run publish:angular   # builds + publishes packages/angular/dist
```

A `prepublishOnly` guard in `packages/angular/package.json` aborts any accidental `npm publish` from the source folder (ng-packagr strips `scripts` from the dist manifest, so the guard only fires from source).

# Prettier Modals

[![npm core](https://img.shields.io/npm/v/prettier-modals?label=core)](https://www.npmjs.com/package/prettier-modals)
[![npm angular](https://img.shields.io/npm/v/prettier-modals-angular?label=angular)](https://www.npmjs.com/package/prettier-modals-angular)
[![GitHub Release](https://img.shields.io/github/v/release/antuuanyf/prettier-modals)](https://github.com/antuuanyf/prettier-modals/releases)
[![CI](https://github.com/antuuanyf/prettier-modals/actions/workflows/ci.yml/badge.svg)](https://github.com/antuuanyf/prettier-modals/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/antuuanyf/prettier-modals)](LICENSE)

Beautiful open/close animations for native `<dialog>` elements, powered by [GSAP](https://gsap.com/) and its [Flip plugin](https://gsap.com/docs/v3/Plugins/Flip/). The modal morphs **from** its trigger and collapses **back into it** — with elastic easing, blur, and fade.

This is a monorepo with two packages:

| Package | Description |
|---|---|
| [`prettier-modals`](packages/core) | Framework-agnostic vanilla JS core. |
| [`prettier-modals-angular`](packages/angular) | Standalone Angular directives + service over the core. |

## Installation

### From npm (recommended)

```bash
# Vanilla
npm install prettier-modals gsap
```

```bash
# Angular
npm install prettier-modals-angular prettier-modals gsap
```

GSAP is a peer dependency (`>=3.12`) in both packages.

See [`packages/core/README.md`](packages/core/README.md) and [`packages/angular/README.md`](packages/angular/README.md) for full usage.

### From a GitHub Release

Each [GitHub Release](https://github.com/antuuanyf/prettier-modals/releases) includes the publishable tarballs. Download them and install directly:

```bash
# vanilla
npm install prettier-modals-0.1.0.tgz gsap

# Angular — install both tarballs together so the wrapper's peer dependency resolves
npm install prettier-modals-0.1.0.tgz prettier-modals-angular-0.1.0.tgz gsap
```

### From local tarballs (offline / air-gapped)

If you have the repo cloned, build the tarballs locally:

```bash
npm run pack:all   # builds both packages → artifacts/*.tgz
```

Then install the `.tgz` files:

```bash
# vanilla
npm install artifacts/prettier-modals-0.1.0.tgz gsap

# Angular
npm install artifacts/prettier-modals-0.1.0.tgz artifacts/prettier-modals-angular-0.1.0.tgz gsap
```

## Demo

The vanilla demo loads the source directly (no build). Serve the repo over HTTP — ES modules and import maps don't work from `file://`:

```bash
npx serve .
# then open http://localhost:3000/demo/
```

## Development

This is an npm-workspaces monorepo. The two packages (`packages/core`, `packages/angular`) are workspaces, so a single install at the repo root covers both:

```bash
npm install            # root: installs both packages (workspaces)
npm run build:core     # build prettier-modals (tsup → ESM + CJS + .d.ts)
npm run build:angular  # build prettier-modals-angular (ng-packagr → APF)
npm run build          # build everything
npm test               # run the unit tests across workspaces
npm run test:e2e       # run the Playwright e2e suite
```

### Running the Angular demo

The Angular demo (`demos/angular`) is **not** part of the workspaces — it consumes the **built** packages via `file:` dependencies (`packages/angular/dist`). So it needs its own install, and the Angular package must be built first or its `file:` path won't exist:

```bash
npm install            # 1. root workspaces
npm run build:core     # 2. build the core (peer of the wrapper)
npm run build:angular  # 3. build the wrapper → packages/angular/dist
cd demos/angular
npm install            # 4. demo deps (use `npm ci` for a reproducible install)
npm start              # 5. ng serve
```

The vanilla demo (see [Demo](#demo) above) needs no build or install — just serve the repo over HTTP.

## Contributing

Contributions are welcome! The full repo conventions live in [`AGENTS.md`](AGENTS.md); the essentials:

- **Branch + PR to `main`** — never commit directly to `main`. Branch from an up-to-date `main`:
  ```bash
  git switch -c <type>/<short-desc>   # e.g. feat/anchor-offsets, fix/escape-close, docs/readme
  ```
- **Keep PRs focused** — one concern per PR; open it against `main` with `gh pr create`.
- **Before pushing**, make sure the build and tests pass:
  ```bash
  npm run build && npm test && npm run test:e2e
  ```
- **Conventions**:
  - GSAP stays a **peer dependency** — never bundle it.
  - The core is **SSR-safe**: guard every `document`/`window` access.
  - Public types come from **JSDoc** in `packages/core` — keep it accurate, it *is* the type surface.
  - The Angular wrapper is **standalone only** (no `NgModule`) and runs animations outside the Angular zone.

Spotted a bug or have an idea? Open an issue before a large change so we can align on the approach.

## License

MIT © Antonio Monreal Diaz

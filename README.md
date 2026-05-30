# Prettier Modals

Beautiful open/close animations for native `<dialog>` elements, powered by [GSAP](https://gsap.com/) and its [Flip plugin](https://gsap.com/docs/v3/Plugins/Flip/). The modal morphs **from** its trigger and collapses **back into it** — with elastic easing, blur, and fade.

This is a monorepo with two packages:

| Package | Description |
|---|---|
| [`prettier-modals`](packages/core) | Framework-agnostic vanilla JS core. |
| [`prettier-modals-angular`](packages/angular) | Standalone Angular directives + service over the core. |

## Quick start (vanilla)

```bash
npm install prettier-modals gsap
```

See [`packages/core/README.md`](packages/core/README.md) for full usage.

## Quick start (Angular)

```bash
npm install prettier-modals-angular prettier-modals gsap
```

See [`packages/angular/README.md`](packages/angular/README.md) for full usage.

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

## License

MIT © Antonio Monreal Diaz

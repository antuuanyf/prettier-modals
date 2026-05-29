# Pretty Modal

Beautiful open/close animations for native `<dialog>` elements, powered by [GSAP](https://gsap.com/) and its [Flip plugin](https://gsap.com/docs/v3/Plugins/Flip/). The modal morphs **from** its trigger and collapses **back into it** — with elastic easing, blur, and fade.

This is a monorepo with two packages:

| Package | Description |
|---|---|
| [`pretty-modal`](packages/core) | Framework-agnostic vanilla JS core. |
| [`pretty-modal-angular`](packages/angular) | Standalone Angular directives + service over the core. |

## Quick start (vanilla)

```bash
npm install pretty-modal gsap
```

See [`packages/core/README.md`](packages/core/README.md) for full usage.

## Quick start (Angular)

```bash
npm install pretty-modal-angular pretty-modal gsap
```

See [`packages/angular/README.md`](packages/angular/README.md) for full usage.

## Demo

The vanilla demo loads the source directly (no build). Serve the repo over HTTP — ES modules and import maps don't work from `file://`:

```bash
npx serve .
# then open http://localhost:3000/demo/
```

## Development

```bash
npm install            # install all workspaces
npm run build:core     # build pretty-modal (tsup → ESM + CJS + .d.ts)
npm run build:angular  # build pretty-modal-angular (ng-packagr → APF)
npm run build          # build everything
```

## License

MIT © srdavo

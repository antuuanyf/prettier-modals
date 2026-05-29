# Pretty Modal

A tiny JavaScript class that brings beautiful open/close animations to native `<dialog>` elements using [GSAP](https://gsap.com/) and its [Flip plugin](https://gsap.com/docs/v3/Plugins/Flip/).

The modal morphs **from** the trigger button and collapses **back into it** when closed — with elastic easing, blur, and fade effects. No frameworks, no dependencies beyond GSAP.

## Features

- Uses the native HTML `<dialog>` element (accessible by default)
- Smooth elastic open animation with blur fade-in
- Closing animation with border-radius morph, blur, and fade-out
- Automatic style injection (no extra CSS file needed)
- Respects `prefers-reduced-motion`
- SSR-safe, ships ESM + CJS + TypeScript types
- Lightweight — GSAP is the only (peer) dependency

## Installation

```bash
npm install pretty-modal gsap
```

GSAP is a **peer dependency** (`>=3.12`) — install it alongside Pretty Modal. The package ships ESM, CJS, and TypeScript types.

## Usage

### 1. Register the GSAP plugins

Pretty Modal imports GSAP, `Flip`, and `CustomEase` internally, but GSAP requires the plugins to be registered once in your app:

```js
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(Flip, CustomEase)
```

> With a bundler (Vite, webpack, Angular CLI…) this resolves GSAP to a single instance automatically. See [Running without a bundler](#running-without-a-bundler) for the CDN setup.

### 2. Create the instance

```js
import { PrettyModal } from 'pretty-modal'

const prettyModal = new PrettyModal()
```

### 3. Add a `<dialog>` and a trigger

The trigger element is **explicit** — pass the element the modal should morph from. From an inline handler, use `this`:

```html
<button onclick="prettyModal.open('my-modal', { trigger: this })">Open</button>

<dialog id="my-modal">
  <h1>Hello world!</h1>
  <button onclick="prettyModal.close('my-modal')">Close</button>
</dialog>
```

You can pass either an **id string** or an **`HTMLElement`** for both the dialog and the trigger — handy from frameworks where you hold element references:

```js
prettyModal.open(dialogEl, { trigger: buttonEl, anchor: 'origin' })
```

## API

### `new PrettyModal(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `anchor` | `'center' \| 'origin'` | `'center'` | Where the modal opens from. `origin` positions it near the trigger. |
| `duration` | `number` | `0.4` | Flip animation duration (seconds). |
| `ease` | `string` | elastic | `CustomEase` SVG path for the Flip tween. |
| `respectReducedMotion` | `boolean` | `true` | Skip animation when the user prefers reduced motion. |
| `onOpen` | `(dialog) => void` | — | Called after the open animation completes. |
| `onClose` | `(dialog) => void` | — | Called after the close animation completes. |

These act as defaults; any of them (plus `trigger`) can be overridden per call via the second argument of `open`/`close`.

### Methods

| Method | Description |
|---|---|
| `open(dialogRef, options?)` | Opens the `<dialog>` (id or element), morphing from `options.trigger`. |
| `close(dialogRef, options?)` | Closes the `<dialog>`, morphing back into its trigger. |
| `destroy()` | Removes the injected `<style>` tag. Call when tearing down. |

## How it works

1. **Open** — Pairs the trigger and dialog with a shared `data-flip-id`, captures the trigger's position with `Flip.getState()`, calls `dialog.showModal()`, then uses `Flip.from()` to morph the dialog out of the trigger with an elastic ease.
2. **Close** — Uses `Flip.to()` to morph the dialog back into its trigger with blur and fade, then calls `dialog.close()`.

CSS keyframe animations handle the blur/fade/border-radius effects during transitions. Styles are auto-injected on instantiation (once per page) so you don't need to import any CSS. The library is SSR-safe — it touches `document`/`window` only in the browser.

## Demo

The demo lives in `demo/` and loads the source directly via an [import map](demo/index.html) (no build step). Because ES modules and import maps require HTTP (not `file://`), serve it with any static server:

```bash
git clone https://github.com/srdavo/pretty-modal.git
cd pretty-modal

# any static server works, e.g.:
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000/demo/` (adjust the port) and click the buttons. The demo shows both `anchor: 'origin'` and `anchor: 'center'`.

## Running without a bundler

In a plain `<script type="module">` setup, point an import map at GSAP's combined ESM bundle so `gsap`, `Flip`, and `CustomEase` share **one instance** (separate per-plugin CDN bundles each ship their own GSAP copy and break Flip):

```html
<script type="importmap">
{
  "imports": {
    "gsap": "https://cdn.jsdelivr.net/npm/gsap@3.14.1/all.js/+esm",
    "gsap/Flip": "https://cdn.jsdelivr.net/npm/gsap@3.14.1/all.js/+esm",
    "gsap/CustomEase": "https://cdn.jsdelivr.net/npm/gsap@3.14.1/all.js/+esm"
  }
}
</script>
```

## Customization

Style your `<dialog>` however you want with regular CSS. Pretty Modal only handles the animation — layout, colors, and sizing are up to you.

```css
dialog {
  border: none;
  border-radius: 24px;
  width: 100%;
  height: 100%;
  max-width: 400px;
  max-height: 400px;
}
```

## Browser Support

Works in all modern browsers that support `<dialog>` and ES modules (Chrome, Firefox, Safari, Edge).

## License

MIT License

Copyright (c) 2026 srdavo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## Credits

Built by [srdavo](https://github.com/srdavo). Powered by [GSAP](https://gsap.com/).

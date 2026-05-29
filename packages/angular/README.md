# pretty-modal-angular

Angular directives and an injectable service for [Pretty Modal](https://github.com/srdavo/pretty-modal) — beautiful open/close animations for native `<dialog>` elements, powered by GSAP Flip.

Standalone (no `NgModule`), SSR-safe, and runs animations outside the Angular zone.

## Installation

```bash
npm install pretty-modal-angular pretty-modal gsap
```

`pretty-modal`, `gsap`, and `@angular/core`/`@angular/common` are peer dependencies (Angular `>=17`).

Register the GSAP plugins once, e.g. in `main.ts`:

```ts
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(Flip, CustomEase)
```

## Declarative usage (directives)

Import the directives you need — or `PRETTY_MODAL_DIRECTIVES` for all of them — into a standalone component:

```ts
import { Component } from '@angular/core'
import { PRETTY_MODAL_DIRECTIVES } from 'pretty-modal-angular'

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [PRETTY_MODAL_DIRECTIVES],
  template: `
    <button [prettyModalTrigger]="'settings'" anchor="origin">Open</button>

    <dialog id="settings" prettyModal anchor="origin"
            (opened)="onOpen()" (closed)="onClose()">
      <h1>Settings</h1>
      <button prettyModalClose>Close</button>
    </dialog>
  `,
})
export class SettingsComponent {
  onOpen() {}
  onClose() {}
}
```

No `ViewChild`, no `NgZone` boilerplate — the directives wire everything to the core.

### Directives

| Directive | Selector | Description |
|---|---|---|
| `PrettyModalDirective` | `dialog[prettyModal]` | Marks the dialog (needs an `id`). Inputs: `anchor`, `animateCancel`. Outputs: `(opened)`, `(closed)`. |
| `PrettyModalTriggerDirective` | `[prettyModalTrigger]` | Opens the dialog whose id/element it's bound to, morphing from the host. Input: `anchor`. |
| `PrettyModalCloseDirective` | `[prettyModalClose]` | Closes the nearest ancestor `<dialog>` (or a given id/element). |

`animateCancel` (default `true`) intercepts the native Escape key so it closes with the animation instead of instantly.

## Imperative usage (service)

```ts
import { Component, inject } from '@angular/core'
import { PrettyModalService } from 'pretty-modal-angular'

@Component({ /* … */ })
export class MyComponent {
  private readonly modal = inject(PrettyModalService)

  open(trigger: HTMLElement) {
    this.modal.open('settings', { trigger, anchor: 'origin' })
  }

  close() {
    this.modal.close('settings')
  }
}
```

`PrettyModalService` lazily creates the core in the browser only (SSR-safe) and runs every animation outside the Angular zone.

## License

MIT © srdavo

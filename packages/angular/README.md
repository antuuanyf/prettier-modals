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

## Trigger and dialog in separate components

The trigger and the `<dialog>` **don't have to live in the same component**. They're linked only by the dialog's `id`: the `PrettyModalService` is a root singleton shared by the whole app, and the core resolves the dialog through `document.getElementById`. So you can wrap each part in its own reusable component:

```ts
// button.component.ts — knows only the target dialog id
import { Component, Input } from '@angular/core'
import { PrettyModalTriggerDirective, type PrettyModalAnchor } from 'pretty-modal-angular'

@Component({
  selector: 'app-modal-button',
  standalone: true,
  imports: [PrettyModalTriggerDirective],
  template: `<button [prettyModalTrigger]="target" [anchor]="anchor"><ng-content /></button>`,
})
export class ModalButtonComponent {
  @Input({ required: true }) target!: string
  @Input() anchor?: PrettyModalAnchor
}
```

```ts
// modal.component.ts — owns the dialog, declared independently
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { PrettyModalDirective, PrettyModalCloseDirective, type PrettyModalAnchor } from 'pretty-modal-angular'

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [PrettyModalDirective, PrettyModalCloseDirective],
  template: `
    <dialog [id]="modalId" prettyModal [anchor]="anchor"
            (opened)="opened.emit($event)" (closed)="closed.emit($event)">
      <button prettyModalClose>Close</button>
      <ng-content />
    </dialog>
  `,
})
export class ModalComponent {
  // Don't name this input `id`: a native `id` would also be reflected onto the
  // host <app-modal>, duplicating the id and breaking document.getElementById.
  @Input({ required: true }) modalId!: string
  @Input() anchor?: PrettyModalAnchor
  @Output() opened = new EventEmitter<HTMLDialogElement>()
  @Output() closed = new EventEmitter<HTMLDialogElement>()
}
```

A parent just drops both in and matches the id:

```html
<app-modal-button target="settings" anchor="origin">Open</app-modal-button>

<app-modal modalId="settings" anchor="origin">
  <h1>Settings</h1>
</app-modal>
```

Two things to keep in mind:

- The dialog `id` must be **unique in the document** — Angular's view encapsulation scopes CSS, not `id` attributes. Avoid exposing a wrapper input literally named `id`: Angular reflects it onto the host element too, so it ends up duplicated (use `modalId` or similar, as above).
- The `<dialog>` must be **rendered in the DOM** when the trigger fires. Don't strip it with `@if`/`*ngIf`; it stays hidden until opened anyway.

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

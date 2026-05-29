import { Component } from '@angular/core'
import { PRETTY_MODAL_DIRECTIVES } from 'pretty-modal-angular'

/**
 * Mirrors the vanilla demo but driven entirely by the Angular directives, so it
 * exercises the published `pretty-modal-angular` artifact end to end:
 * `[prettyModalTrigger]`, `[prettyModal]`, `[prettyModalClose]` and the
 * `(opened)` / `(closed)` outputs.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...PRETTY_MODAL_DIRECTIVES],
  template: `
    <div class="container">
      <button [prettyModalTrigger]="'dialog-1'" anchor="origin">
        Abrir modal al origen
      </button>
      <button [prettyModalTrigger]="'dialog-2'" anchor="center">
        Abrir modal al centro
      </button>
    </div>

    <dialog
      id="dialog-1"
      prettyModal
      anchor="origin"
      (opened)="onOpened('dialog-1')"
      (closed)="onClosed('dialog-1')"
    >
      <button prettyModalClose>Cerrar</button>
      <h1>Modal abierto al origen</h1>
    </dialog>

    <dialog
      id="dialog-2"
      prettyModal
      anchor="center"
      (opened)="onOpened('dialog-2')"
      (closed)="onClosed('dialog-2')"
    >
      <button prettyModalClose>Cerrar</button>
      <h1>Modal abierto al centro</h1>
    </dialog>

    <p class="status">Último evento: {{ lastEvent || '—' }}</p>
  `,
})
export class AppComponent {
  lastEvent = ''

  onOpened(id: string): void {
    this.lastEvent = `opened: ${id}`
  }

  onClosed(id: string): void {
    this.lastEvent = `closed: ${id}`
  }
}

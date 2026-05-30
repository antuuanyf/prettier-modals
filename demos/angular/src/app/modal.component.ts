import { Component, EventEmitter, Input, Output } from '@angular/core'
import { PrettyModalDirective, PrettyModalCloseDirective } from 'pretty-modal-angular'
import type { PrettyModalAnchor } from 'pretty-modal-angular'

/**
 * Standalone "modal" component, declared separately from the trigger button.
 * It owns the `<dialog>` and re-exposes the directive's open/close events. A
 * parent can drop this anywhere and any `app-modal-trigger-button` with a
 * matching `target` will open it.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [PrettyModalDirective, PrettyModalCloseDirective],
  template: `
    <dialog
      [id]="modalId"
      prettyModal
      [anchor]="anchor"
      (opened)="opened.emit($event)"
      (closed)="closed.emit($event)"
    >
      <button prettyModalClose>Cerrar</button>
      <ng-content />
    </dialog>
  `,
})
export class ModalComponent {
  // Not named `id`: a native `id` input would also land as an attribute on the
  // host <app-modal>, duplicating the id and breaking document.getElementById.
  @Input({ required: true }) modalId!: string
  @Input() anchor?: PrettyModalAnchor

  @Output() opened = new EventEmitter<HTMLDialogElement>()
  @Output() closed = new EventEmitter<HTMLDialogElement>()
}

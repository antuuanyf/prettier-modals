import { Component, Input } from '@angular/core'
import { PrettyModalTriggerDirective } from 'pretty-modal-angular'
import type { PrettyModalAnchor } from 'pretty-modal-angular'

/**
 * Standalone "button" component that lives independently from the modal. It only
 * knows the target dialog's id, proving the trigger and the `<dialog>` do not
 * need to share a component — the root `PrettyModalService` + the global id
 * wire them together.
 */
@Component({
  selector: 'app-modal-trigger-button',
  standalone: true,
  imports: [PrettyModalTriggerDirective],
  template: `
    <button [prettyModalTrigger]="target" [anchor]="anchor">
      <ng-content />
    </button>
  `,
})
export class ModalTriggerButtonComponent {
  @Input({ required: true }) target!: string
  @Input() anchor?: PrettyModalAnchor
}

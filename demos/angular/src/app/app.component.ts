import { Component } from '@angular/core'
import { ModalTriggerButtonComponent } from './modal-trigger-button.component'
import { ModalComponent } from './modal.component'

/**
 * Demonstrates the cross-component pattern: the trigger buttons
 * (`app-modal-trigger-button`) and the modals (`app-modal`) are **separate
 * standalone components**, only linked by a shared dialog id. This works
 * because the `PrettyModalService` is a root singleton and the core resolves
 * dialogs through `document.getElementById`, so neither needs to know about the
 * other's component.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ModalTriggerButtonComponent, ModalComponent],
  template: `
    <div class="container">
      <app-modal-trigger-button target="dialog-1" anchor="origin">
        Abrir modal al origen
      </app-modal-trigger-button>
      <app-modal-trigger-button target="dialog-2" anchor="center">
        Abrir modal al centro
      </app-modal-trigger-button>
    </div>

    <app-modal
      modalId="dialog-1"
      anchor="origin"
      (opened)="onOpened('dialog-1')"
      (closed)="onClosed('dialog-1')"
    >
      <h1>Modal abierto al origen</h1>
    </app-modal>

    <app-modal
      modalId="dialog-2"
      anchor="center"
      (opened)="onOpened('dialog-2')"
      (closed)="onClosed('dialog-2')"
    >
      <h1>Modal abierto al centro</h1>
    </app-modal>

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

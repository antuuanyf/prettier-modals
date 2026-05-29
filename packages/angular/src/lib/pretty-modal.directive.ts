import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  booleanAttribute,
  inject,
} from '@angular/core'
import { PrettyModalService } from './pretty-modal.service'
import type { PrettyModalAnchor, PrettyModalRegistration } from './pretty-modal.types'

/**
 * Marks a `<dialog>` as Pretty Modal managed. The dialog **must have an id** so
 * triggers and close buttons can reference it.
 *
 * ```html
 * <dialog id="settings" prettyModal anchor="origin"
 *         (opened)="onOpen()" (closed)="onClose()">…</dialog>
 * ```
 */
@Directive({
  selector: 'dialog[prettyModal]',
  standalone: true,
})
export class PrettyModalDirective implements PrettyModalRegistration, OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLDialogElement>>(ElementRef)
  private readonly service = inject(PrettyModalService)
  private readonly zone = inject(NgZone)

  /** Default anchor for this dialog. Overridable per trigger. */
  @Input() anchor?: PrettyModalAnchor

  /** Animate the close when the user presses Escape (native `cancel`). */
  @Input({ transform: booleanAttribute }) animateCancel = true

  @Output() opened = new EventEmitter<HTMLDialogElement>()
  @Output() closed = new EventEmitter<HTMLDialogElement>()

  get element(): HTMLDialogElement {
    return this.host.nativeElement
  }

  ngOnInit(): void {
    const id = this.element.id
    if (!id) {
      console.warn('[prettyModal] The <dialog> needs an id to be linked to its triggers.')
      return
    }
    this.service.register(id, this)
    // Native Escape closes the dialog instantly, bypassing the animation.
    // Intercept it and route through the service so it animates.
    this.element.addEventListener('cancel', this.onCancel)
  }

  ngOnDestroy(): void {
    if (this.element.id) this.service.unregister(this.element.id)
    this.element.removeEventListener('cancel', this.onCancel)
  }

  notifyOpened(dialog: HTMLDialogElement): void {
    this.zone.run(() => this.opened.emit(dialog))
  }

  notifyClosed(dialog: HTMLDialogElement): void {
    this.zone.run(() => this.closed.emit(dialog))
  }

  private readonly onCancel = (event: Event): void => {
    if (!this.animateCancel) return
    event.preventDefault()
    this.service.close(this.element, { onClose: (d) => this.notifyClosed(d) })
  }
}

import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core'
import { PrettyModalService } from './pretty-modal.service'
import type { PrettyModalAnchor } from './pretty-modal.types'

/**
 * Opens a Pretty Modal dialog when the host element is clicked, morphing the
 * dialog out of this element.
 *
 * ```html
 * <button [prettyModalTrigger]="'settings'" anchor="origin">Open</button>
 * ```
 */
@Directive({
  selector: '[prettyModalTrigger]',
  standalone: true,
})
export class PrettyModalTriggerDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly service = inject(PrettyModalService)

  /** Dialog id or element to open. */
  @Input({ alias: 'prettyModalTrigger', required: true })
  target!: string | HTMLDialogElement

  /** Overrides the dialog's default anchor for this trigger. */
  @Input() anchor?: PrettyModalAnchor

  @HostListener('click')
  onClick(): void {
    const id = typeof this.target === 'string' ? this.target : this.target.id
    const registration = id ? this.service.registration(id) : undefined

    this.service.open(this.target, {
      trigger: this.host.nativeElement,
      anchor: this.anchor ?? registration?.anchor,
      onOpen: registration ? (d) => registration.notifyOpened(d) : undefined,
    })
  }
}

import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core'
import { PrettyModalService } from './pretty-modal.service'

/**
 * Closes a Pretty Modal dialog when the host element is clicked. By default it
 * closes the nearest ancestor `<dialog>`; pass an id/element to target another.
 *
 * ```html
 * <button prettyModalClose>Close</button>
 * ```
 */
@Directive({
  selector: '[prettyModalClose]',
  standalone: true,
})
export class PrettyModalCloseDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly service = inject(PrettyModalService)

  /** Optional dialog id/element. Defaults to the nearest ancestor `<dialog>`. */
  @Input({ alias: 'prettyModalClose' })
  target?: string | HTMLDialogElement | ''

  @HostListener('click')
  onClick(): void {
    const dialog = this.resolve()
    if (!dialog) return

    const id = typeof dialog === 'string' ? dialog : dialog.id
    const registration = id ? this.service.registration(id) : undefined

    this.service.close(dialog, {
      onClose: registration ? (d) => registration.notifyClosed(d) : undefined,
    })
  }

  private resolve(): string | HTMLDialogElement | null {
    if (this.target) return this.target
    return this.host.nativeElement.closest('dialog')
  }
}

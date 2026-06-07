import { Directive, ElementRef, HostListener, Input, booleanAttribute, numberAttribute, inject } from '@angular/core'
import { PrettyModalService } from './pretty-modal.service'
import type { PrettyModalAnchor, PrettyModalOptions } from './pretty-modal.types'

/**
 * Opens a Pretty Modal dialog when the host element is clicked, morphing the
 * dialog out of this element.
 *
 * ```html
 * <button [prettyModalTrigger]="'settings'" anchor="origin" [originGap]="8">Open</button>
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

  /** Base animation duration in seconds. */
  @Input({ transform: numberAttribute }) duration?: number

  /** Open animation duration in seconds. Defaults to `duration`. */
  @Input({ transform: numberAttribute }) openDuration?: number

  /** Flip `scale` mode. See {@link PrettyModalOptions.scale}. */
  @Input({ transform: booleanAttribute }) scale?: boolean

  /** Gap in px between the trigger and the modal for the `origin` anchor. */
  @Input({ transform: numberAttribute }) originGap?: number

  /** Skip animation when the user prefers reduced motion. */
  @Input({ transform: booleanAttribute }) respectReducedMotion?: boolean

  @HostListener('click')
  onClick(): void {
    const id = typeof this.target === 'string' ? this.target : this.target.id
    const registration = id ? this.service.registration(id) : undefined

    // Only forward options the caller actually set, so unset inputs fall back
    // to the core instance defaults instead of being overridden with undefined.
    const options: PrettyModalOptions = {
      trigger: this.host.nativeElement,
      anchor: this.anchor ?? registration?.anchor,
      onOpen: registration ? (d) => registration.notifyOpened(d) : undefined,
    }
    if (this.duration !== undefined) options.duration = this.duration
    if (this.openDuration !== undefined) options.openDuration = this.openDuration
    if (this.scale !== undefined) options.scale = this.scale
    if (this.originGap !== undefined) options.originGap = this.originGap
    if (this.respectReducedMotion !== undefined) options.respectReducedMotion = this.respectReducedMotion

    this.service.open(this.target, options)
  }
}

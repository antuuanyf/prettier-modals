import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { PrettyModal } from 'prettier-modals'
import type { PrettyModalOptions, PrettyModalRegistration } from './pretty-modal.types'

/**
 * Injectable wrapper around the vanilla `PrettyModal` core.
 *
 * - Lazily instantiates the core in the browser only (SSR-safe).
 * - Runs GSAP animations outside the Angular zone to avoid change detection
 *   on every animation frame.
 */
@Injectable({ providedIn: 'root' })
export class PrettyModalService {
  private readonly zone = inject(NgZone)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private modal: PrettyModal | null = null
  private readonly registry = new Map<string, PrettyModalRegistration>()

  /** Open a dialog (id or element), morphing from `options.trigger`. */
  open(dialog: string | HTMLDialogElement, options: PrettyModalOptions = {}): void {
    const modal = this.ensure()
    if (!modal) return
    this.zone.runOutsideAngular(() => modal.open(dialog, options))
  }

  /** Close a dialog, morphing back into its trigger. */
  close(dialog: string | HTMLDialogElement, options: PrettyModalOptions = {}): void {
    const modal = this.ensure()
    if (!modal) return
    this.zone.runOutsideAngular(() => modal.close(dialog, options))
  }

  /** Tear down the core instance and remove injected styles. */
  destroy(): void {
    this.modal?.destroy()
    this.modal = null
  }

  // --- directive wiring --------------------------------------------------

  register(id: string, registration: PrettyModalRegistration): void {
    this.registry.set(id, registration)
  }

  unregister(id: string): void {
    this.registry.delete(id)
  }

  registration(id: string): PrettyModalRegistration | undefined {
    return this.registry.get(id)
  }

  private ensure(): PrettyModal | null {
    if (!this.isBrowser) return null
    if (!this.modal) {
      this.zone.runOutsideAngular(() => {
        this.modal = new PrettyModal()
      })
    }
    return this.modal
  }
}

export type PrettyModalAnchor = 'center' | 'origin'

/** Options accepted by {@link PrettyModalService.open} / `.close`. */
export interface PrettyModalOptions {
  /** Element (or its id) the modal morphs from. */
  trigger?: string | HTMLElement
  anchor?: PrettyModalAnchor
  duration?: number
  respectReducedMotion?: boolean
  onOpen?: (dialog: HTMLDialogElement) => void
  onClose?: (dialog: HTMLDialogElement) => void
}

/**
 * Contract a `[prettyModal]` directive exposes to the service so triggers can
 * read its default anchor and notify it of open/close events. Kept as an
 * interface to avoid a circular dependency between the directive and service.
 */
export interface PrettyModalRegistration {
  readonly anchor?: PrettyModalAnchor
  notifyOpened(dialog: HTMLDialogElement): void
  notifyClosed(dialog: HTMLDialogElement): void
}

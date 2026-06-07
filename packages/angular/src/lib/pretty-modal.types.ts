export type PrettyModalAnchor = 'center' | 'origin'

/**
 * Per-call options accepted by {@link PrettyModalService.open} / `.close`.
 *
 * Note: `ease`/`originEase` are **not** here — the core compiles them once in
 * its constructor, so they are only configurable at instance level via
 * {@link PrettyModalConfig} / `providePrettyModal`.
 */
export interface PrettyModalOptions {
  /** Element (or its id) the modal morphs from. */
  trigger?: string | HTMLElement
  /** Where the modal opens from. */
  anchor?: PrettyModalAnchor
  /** Base animation duration in seconds (used when open/close durations are unset). */
  duration?: number
  /** Open animation duration in seconds. Defaults to `duration`. */
  openDuration?: number
  /** Close animation duration in seconds. Defaults to `duration`. */
  closeDuration?: number
  /**
   * Flip `scale` mode. `true` morphs via `transform: scale` (works even when the
   * final size is locked by CSS `!important`). `false` morphs `width`/`height`
   * directly for a cleaner aspect-ratio change.
   */
  scale?: boolean
  /**
   * Gap in px between the trigger and the modal for the `origin` anchor.
   * `0` overlaps the trigger; `>0` places the modal adjacent (popover/dropdown).
   */
  originGap?: number
  respectReducedMotion?: boolean
  onOpen?: (dialog: HTMLDialogElement) => void
  onClose?: (dialog: HTMLDialogElement) => void
}

/**
 * Instance-level defaults passed to the core `PrettyModal` constructor via
 * {@link providePrettyModal}. Unlike {@link PrettyModalOptions}, this also
 * covers `ease`/`originEase`, which the core only reads at construction time.
 */
export interface PrettyModalConfig {
  /** Default anchor for every modal. */
  anchor?: PrettyModalAnchor
  /** Base animation duration in seconds. */
  duration?: number
  /** Open animation duration in seconds. Defaults to `duration`. */
  openDuration?: number
  /** Close animation duration in seconds. Defaults to `duration`. */
  closeDuration?: number
  /** CustomEase SVG path used for the `center` anchor (and `origin` when fullscreen). */
  ease?: string
  /** CustomEase SVG path used for the `origin` anchor (overshoot by default). */
  originEase?: string
  /** Default Flip `scale` mode. See {@link PrettyModalOptions.scale}. */
  scale?: boolean
  /** Default gap in px between the trigger and the modal for the `origin` anchor. */
  originGap?: number
  /** Skip animation when the user prefers reduced motion. */
  respectReducedMotion?: boolean
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

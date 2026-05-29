import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(Flip, CustomEase)

const STYLE_ID = 'pretty-modal-styles'
const EASE = 'M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1'

export class PrettyModal {
    /**
     * @param {Object} [options]
     * @param {'center'|'origin'} [options.anchor='center'] Where the modal opens from.
     * @param {number} [options.duration=0.4] Animation duration in seconds.
     * @param {string} [options.ease] CustomEase SVG path used for the Flip tween.
     * @param {boolean} [options.respectReducedMotion=true] Skip animation when the user prefers reduced motion.
     * @param {(dialog: HTMLDialogElement) => void} [options.onOpen]
     * @param {(dialog: HTMLDialogElement) => void} [options.onClose]
     */
    constructor(options = {}) {
        this.defaults = {
            anchor: 'center',
            duration: 0.4,
            ease: EASE,
            respectReducedMotion: true,
            onOpen: null,
            onClose: null,
            ...options,
        }

        // Per-dialog state: trigger element + whether it is mid-animation.
        this.state = new WeakMap()

        if (typeof document !== 'undefined') {
            this.ease = CustomEase.create('pretty-modal-ease', this.defaults.ease)
            this.injectStyles()
        }
    }

    /**
     * Open a dialog, morphing from the trigger element.
     * @param {string|HTMLDialogElement} dialogRef Dialog element or its id.
     * @param {Object} [options]
     * @param {string|HTMLElement} [options.trigger] Element to animate from. Defaults to `event.currentTarget` when called from an inline handler.
     * @param {'center'|'origin'} [options.anchor]
     * @param {number} [options.duration]
     * @param {boolean} [options.respectReducedMotion]
     * @param {(dialog: HTMLDialogElement) => void} [options.onOpen]
     * @param {(dialog: HTMLDialogElement) => void} [options.onClose]
     */
    open(dialogRef, options = {}) {
        const dialog = this.#resolveEl(dialogRef)
        if (!dialog || dialog.open) return

        const opts = { ...this.defaults, ...options }
        const trigger = this.#resolveTrigger(options.trigger)
        if (!trigger) {
            console.warn('[PrettyModal] No trigger element found. Pass { trigger } explicitly.')
            return
        }

        const entry = this.state.get(dialog)
        if (entry?.animating) return

        this.state.set(dialog, { trigger, anchor: opts.anchor, animating: true })

        if (this.#reducedMotion(opts)) {
            dialog.showModal()
            this.state.set(dialog, { trigger, anchor: opts.anchor, animating: false })
            opts.onOpen?.(dialog)
            return
        }

        // Flip morphs elements that share a data-flip-id, so pair trigger and dialog.
        const flipId = this.state.get(dialog).flipId || Math.random().toString(16).slice(2)
        trigger.dataset.flipId = flipId
        dialog.dataset.flipId = flipId
        dialog.dataset.anchor = opts.anchor
        this.state.get(dialog).flipId = flipId

        const originState = Flip.getState(trigger)
        dialog.showModal()

        if (opts.anchor === 'origin') {
            this.#positionAtOrigin(dialog, trigger)
        }

        Flip.from(originState, {
            targets: dialog,
            scale: true,
            ease: this.ease,
            toggleClass: 'pretty-modal-opening',
            duration: opts.duration,
            onComplete: () => {
                const e = this.state.get(dialog)
                if (e) e.animating = false
                opts.onOpen?.(dialog)
            },
        })
    }

    /**
     * Close a dialog, morphing back into its trigger element.
     * @param {string|HTMLDialogElement} dialogRef Dialog element or its id.
     * @param {Object} [options]
     * @param {number} [options.duration]
     * @param {boolean} [options.respectReducedMotion]
     * @param {(dialog: HTMLDialogElement) => void} [options.onClose]
     */
    close(dialogRef, options = {}) {
        const dialog = this.#resolveEl(dialogRef)
        if (!dialog || !dialog.open) return

        const opts = { ...this.defaults, ...options }
        const entry = this.state.get(dialog)
        const trigger = entry?.trigger

        if (this.#reducedMotion(opts) || !trigger) {
            dialog.close()
            dialog.setAttribute('style', '')
            if (entry) entry.animating = false
            opts.onClose?.(dialog)
            return
        }

        if (entry) entry.animating = true

        const originState = Flip.getState(trigger)

        Flip.to(originState, {
            targets: dialog,
            scale: true,
            ease: this.ease,
            toggleClass: 'pretty-modal-closing',
            duration: opts.duration,
            onComplete: () => {
                dialog.setAttribute('style', '')
                dialog.close()
                if (entry) entry.animating = false
                opts.onClose?.(dialog)
            },
        })
    }

    /** Remove injected styles. Call when tearing down. */
    destroy() {
        if (typeof document === 'undefined') return
        document.getElementById(STYLE_ID)?.remove()
    }

    // --- internals ---------------------------------------------------------

    #resolveEl(ref) {
        if (!ref) return null
        if (typeof ref === 'string') return document.getElementById(ref)
        return ref
    }

    #resolveTrigger(trigger) {
        const resolved = this.#resolveEl(trigger)
        if (resolved) return resolved
        // Fallback for inline onclick handlers (Chromium exposes a global event).
        if (typeof event !== 'undefined' && event?.currentTarget) return event.currentTarget
        return null
    }

    #reducedMotion(opts) {
        if (!opts.respectReducedMotion) return false
        if (typeof window === 'undefined' || !window.matchMedia) return false
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    #positionAtOrigin(dialog, origin) {
        const originRect = origin.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight

        dialog.style.margin = '0'
        dialog.style.position = 'fixed'
        dialog.style.inset = 'auto'

        const dialogRect = dialog.getBoundingClientRect()
        const dialogW = dialogRect.width
        const dialogH = dialogRect.height

        const spaceRight = vw - originRect.left
        const spaceLeft = originRect.right
        const spaceBelow = vh - originRect.top
        const spaceAbove = originRect.bottom

        if (dialogW <= spaceRight) {
            dialog.style.left = `${originRect.left}px`
        } else if (dialogW <= spaceLeft) {
            dialog.style.right = `${vw - originRect.right}px`
        } else {
            dialog.style.left = `${Math.max(0, (vw - dialogW) / 2)}px`
        }

        if (dialogH <= spaceBelow) {
            dialog.style.top = `${originRect.top}px`
        } else if (dialogH <= spaceAbove) {
            dialog.style.bottom = `${vh - originRect.bottom}px`
        } else {
            dialog.style.top = `${Math.max(0, (vh - dialogH) / 2)}px`
        }
    }

    injectStyles() {
        if (document.getElementById(STYLE_ID)) return

        const styles = `
            .pretty-modal-opening {
                animation: pretty-modal-opening 500ms cubic-bezier(.56,.27,0,1);
            }

            @keyframes pretty-modal-opening {
                from { opacity: 0; filter: blur(8px); } to { opacity: 1; filter: blur(0px); }
            }

            .pretty-modal-closing {
                animation:
                    pretty-modal-closing-border-radius 500ms cubic-bezier(.56,.27,0,1),
                    pretty-modal-closing-blur 500ms cubic-bezier(.37,.35,0,1),
                    pretty-modal-closing-fade 700ms cubic-bezier(.56,.27,0,1)
                ;
            }

            @keyframes pretty-modal-closing-border-radius {
                to { border-radius: 400px; }
            }

            @keyframes pretty-modal-closing-blur {
                0% { filter: blur(0); } 100% { filter: blur(32px); }
            }

            @keyframes pretty-modal-closing-fade {
                from { opacity: 1; } to { opacity: 0; }
            }

            dialog[open]::backdrop {
                background: rgba(0,0,0,0.2);
                backdrop-filter: blur(2px);
            }

            dialog.pretty-modal-opening::backdrop {
                animation: pretty-modal-backdrop-in 400ms cubic-bezier(.56,.27,0,1);
            }

            dialog.pretty-modal-closing::backdrop {
                animation: pretty-modal-backdrop-out 400ms cubic-bezier(.56,.27,0,1) forwards;
            }

            @keyframes pretty-modal-backdrop-in {
                from { background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
                to   { background: rgba(0,0,0,0.2); backdrop-filter: blur(2px); }
            }

            @keyframes pretty-modal-backdrop-out {
                from { background: rgba(0,0,0,0.2); backdrop-filter: blur(2px); }
                to   { background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
            }

            @media (prefers-reduced-motion: reduce) {
                .pretty-modal-opening,
                .pretty-modal-closing,
                dialog.pretty-modal-opening::backdrop,
                dialog.pretty-modal-closing::backdrop {
                    animation: none;
                }
            }
        `

        const styleSheet = document.createElement('style')
        styleSheet.id = STYLE_ID
        styleSheet.textContent = styles
        document.head.appendChild(styleSheet)
    }
}

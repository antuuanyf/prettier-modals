import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(Flip, CustomEase)

const STYLE_ID = 'pretty-modal-styles'
const EASE = 'M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1'
// Overshoot ease: the box passes its final size and settles back, giving a
// satisfying "pop" when morphing from a small trigger. Used for the `origin`
// anchor (skipped when the modal ends up fullscreen — see #shouldScale).
const ORIGIN_EASE = 'M0,0 C0.249,-0.124 0.045,0.925 0.335,1 0.625,1.074 0.532,0.987 1,1'

export class PrettyModal {
    /**
     * @param {Object} [options]
     * @param {'center'|'origin'} [options.anchor='center'] Where the modal opens from.
     * @param {number} [options.duration=0.7] Base animation duration in seconds (used when `openDuration`/`closeDuration` are not set).
     * @param {number} [options.openDuration] Open animation duration in seconds. Defaults to `duration`.
     * @param {number} [options.closeDuration] Close animation duration in seconds. Defaults to `duration`.
     * @param {string} [options.ease] CustomEase SVG path used for the `center` anchor (and `origin` when fullscreen).
     * @param {string} [options.originEase] CustomEase SVG path used for the `origin` anchor (overshoot by default).
     * @param {boolean} [options.scale=true] Flip `scale` mode. `true` (default) morphs via `transform: scale`, which works even when the final size is locked by CSS `!important` (e.g. fullscreen on mobile). Set `false` to morph `width`/`height` directly for a cleaner aspect-ratio change — only works if the final size is animatable (not forced with `!important`).
     * @param {number} [options.originGap=0] Gap in px between the trigger and the modal for the `origin` anchor. `0` overlaps the trigger; `>0` places the modal adjacent (popover/dropdown style).
     * @param {boolean} [options.respectReducedMotion=true] Skip animation when the user prefers reduced motion.
     * @param {(dialog: HTMLDialogElement) => void} [options.onOpen]
     * @param {(dialog: HTMLDialogElement) => void} [options.onClose]
     */
    constructor(options = {}) {
        this.defaults = {
            anchor: 'center',
            duration: 0.5,
            openDuration: 0.7,
            closeDuration: null,
            ease: EASE,
            originEase: ORIGIN_EASE,
            scale: true,
            originGap: 0,
            respectReducedMotion: true,
            onOpen: null,
            onClose: null,
            ...options,
        }

        // Per-dialog state: trigger element + whether it is mid-animation.
        this.state = new WeakMap()

        if (typeof document !== 'undefined') {
            this.ease = CustomEase.create('pretty-modal-ease', this.defaults.ease)
            this.originEase = CustomEase.create('pretty-modal-ease-origin', this.defaults.originEase)
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
     * @param {number} [options.openDuration] Open animation duration in seconds. Defaults to `duration`.
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

        // Per-call values win over instance defaults; the specific
        // openDuration wins over the general duration at each level.
        const duration =
            options.openDuration ?? options.duration ?? this.defaults.openDuration ?? this.defaults.duration

        // Sync the ::backdrop CSS animation with the tween duration.
        dialog.style.setProperty('--pretty-modal-duration', `${duration}s`)

        const originState = Flip.getState(trigger)
        dialog.showModal()

        if (opts.anchor === 'origin') {
            this.#positionAtOrigin(dialog, trigger, opts.originGap)
        }

        // Default morph uses transform `scale` (works even when the final size
        // is locked by CSS `!important`, e.g. fullscreen on mobile). When the
        // modal ends up fullscreen we skip the overshoot so it never exceeds the
        // viewport.
        const fullscreen = this.#isFullscreen(dialog)
        const ease = opts.anchor === 'origin' && !fullscreen ? this.originEase : this.ease

        // Hijos directos del dialog: se animan como capa de contenido aparte.
        const content = gsap.utils.toArray(dialog.children)

        // Capa de geometría: Flip escala el dialog desde la caja del trigger
        // hasta su caja final (el morph en sí).
        Flip.from(originState, {
            targets: dialog,
            scale: opts.scale,
            ease,
            toggleClass: 'pretty-modal-opening',
            duration,
            onComplete: () => {
                const e = this.state.get(dialog)
                if (e) e.animating = false
                gsap.set([dialog, ...content], { clearProps: 'opacity,filter' })
                opts.onOpen?.(dialog)
            },
        })

        // Capa 1: el contenedor aparece rápido y suave mientras Flip lo escala,
        // de modo que el morph sea visible (no un simple fade a tamaño final).
        gsap.fromTo(
            dialog,
            { opacity: 0, filter: 'blur(4px)' },
            { opacity: 1, filter: 'blur(0px)', duration: duration * 0.45, ease: 'power2.out' }
        )

        // Capa 2: el contenido entra cuando la caja está casi a tamaño final,
        // evitando verlo estirado al escalar con `scale: true`.
        gsap.fromTo(
            content,
            { opacity: 0 },
            {
                opacity: 1,
                duration: duration * 0.5,
                delay: duration * 0.5,
                ease: 'power2.out',
            }
        )
    }

    /**
     * Close a dialog, morphing back into its trigger element.
     * @param {string|HTMLDialogElement} dialogRef Dialog element or its id.
     * @param {Object} [options]
     * @param {number} [options.duration]
     * @param {number} [options.closeDuration] Close animation duration in seconds. Defaults to `duration`.
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

        // Per-call values win over instance defaults; the specific
        // closeDuration wins over the general duration at each level.
        const duration =
            options.closeDuration ?? options.duration ?? this.defaults.closeDuration ?? this.defaults.duration

        // Sync the ::backdrop CSS animation with the tween duration.
        dialog.style.setProperty('--pretty-modal-duration', `${duration}s`)

        // Mirror the open animation's scale/ease so the modal collapses the same
        // way it grew.
        const fullscreen = this.#isFullscreen(dialog)
        const ease = entry?.anchor === 'origin' && !fullscreen ? this.originEase : this.ease

        const content = gsap.utils.toArray(dialog.children)
        const originState = Flip.getState(trigger)

        Flip.to(originState, {
            targets: dialog,
            scale: opts.scale,
            ease,
            toggleClass: 'pretty-modal-closing',
            duration,
            onComplete: () => {
                dialog.setAttribute('style', '')
                gsap.set(content, { clearProps: 'opacity,filter' })
                dialog.close()
                if (entry) entry.animating = false
                opts.onClose?.(dialog)
            },
        })

        // Reverse of the open content layer: the content fades out (with blur)
        // early, before the box collapses back into the trigger.
        gsap.to(content, {
            opacity: 0,
            filter: 'blur(4px)',
            duration: duration * 0.5,
            ease: 'power2.in',
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

    /** True when the dialog occupies (almost) the whole viewport. */
    #isFullscreen(dialog) {
        if (typeof window === 'undefined') return false
        const rect = dialog.getBoundingClientRect()
        return rect.width >= window.innerWidth * 0.98 && rect.height >= window.innerHeight * 0.98
    }

    #positionAtOrigin(dialog, origin, gap = 0) {
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

        if (dialogW <= spaceRight) {
            dialog.style.left = `${originRect.left}px`
        } else if (dialogW <= spaceLeft) {
            dialog.style.right = `${vw - originRect.right}px`
        } else {
            dialog.style.left = `${Math.max(0, (vw - dialogW) / 2)}px`
        }

        // gap === 0 overlaps the trigger (morph from on top of it); gap > 0
        // places the modal adjacent — below the trigger, or above if no room.
        const topEdge = gap > 0 ? originRect.bottom + gap : originRect.top
        const bottomEdge = gap > 0 ? originRect.top - gap : originRect.bottom
        const spaceBelow = vh - topEdge
        const spaceAbove = bottomEdge

        if (dialogH <= spaceBelow) {
            dialog.style.top = `${topEdge}px`
        } else if (dialogH <= spaceAbove) {
            dialog.style.bottom = `${vh - bottomEdge}px`
        } else {
            dialog.style.top = `${Math.max(0, (vh - dialogH) / 2)}px`
        }
    }

    injectStyles() {
        if (document.getElementById(STYLE_ID)) return

        const styles = `
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
                animation: pretty-modal-backdrop-in var(--pretty-modal-duration, 400ms) cubic-bezier(.56,.27,0,1);
            }

            dialog.pretty-modal-closing::backdrop {
                animation: pretty-modal-backdrop-out var(--pretty-modal-duration, 400ms) cubic-bezier(.56,.27,0,1) forwards;
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

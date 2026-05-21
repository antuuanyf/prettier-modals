export class PrettyModal {
    constructor(options = {}) {
        this.defaults = { anchor: 'center', ...options }
        this.injectStyles()
    }

    open(dialogId, options = {}){

        const dialog = document.getElementById(dialogId)
        if(!dialog) return

        const { anchor } = { ...this.defaults, ...options }

        const origin = event.currentTarget
        const randomId = Math.random().toString(16).slice(2)

        dialog.dataset.flipId = randomId
        dialog.dataset.anchor = anchor
        origin.dataset.flipId = randomId

        const originState = Flip.getState(origin)
        dialog.showModal()

        if (anchor === 'origin') {
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

        Flip.from(originState, {
            targets: dialog,
            scale: true,
            ease: CustomEase.create("custom", "M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1"),
            toggleClass: 'pretty-modal-opening',
            duration: 0.4,
        })

    }

    close(dialogId){

        const dialog = document.getElementById(dialogId)
        if(!dialog) return

        const originId = dialog.dataset.flipId;
        const origin = document.querySelector(`[data-flip-id="${originId}"]:not([open])`)

        const originState = Flip.getState(origin)

        Flip.to(originState, {
            targets: dialog,
            scale: true,
            ease: CustomEase.create("custom", "M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1"),
            onComplete: () => {
                dialog.setAttribute("style", "")
                dialog.close()
            },
            toggleClass: 'pretty-modal-closing',
            duration: 0.4,
        })

    }

    injectStyles() {
        // Evitar inyectar múltiples veces
        if (document.getElementById('pretty-modal-styles')) return;

        const styles = `

            .pretty-modal-opening {
                animation: pretty-modal-opening 500ms cubic-bezier(.56,.27,0,1);
            }

            @keyframes pretty-modal-opening{
                from { opactiy: 0; filter: blur(8px) } to { opacity: 1; filter: blur(0px) }
            }

            .pretty-modal-closing {
                animation: 
                    pretty-modal-closing-border-radius 500ms cubic-bezier(.56,.27,0,1), 
                    pretty-modal-closing-blur 500ms cubic-bezier(.37,.35,0,1), 
                    pretty-modal-closing-fade 700ms cubic-bezier(.56,.27,0,1)
                ;
            }

            @keyframes pretty-modal-closing-border-radius {
                to { border-radius:400px; }
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
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'pretty-modal-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}
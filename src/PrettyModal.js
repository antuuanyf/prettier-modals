export class PrettyModal {
    constructor() {
        this.injectStyles()
    }

    open(dialogId){

        const dialog = document.getElementById(dialogId)
        if(!dialog) return

        const origin = event.currentTarget
        const randomId = Math.random().toString(16).slice(2)

        dialog.dataset.flipId = randomId
        origin.dataset.flipId = randomId

        const originState = Flip.getState(origin, {
            props: "backgroundColor,borderRadius,color,borderColor"
        })
        dialog.showModal()

        const originRect = origin.getBoundingClientRect()
        dialog.style.margin = '0'
        dialog.style.position = 'fixed'
        dialog.style.top = `${originRect.top}px`
        dialog.style.left = `${originRect.left}px`

        Flip.from(originState, {
            targets: dialog,
            scale: true,
            props: "backgroundColor,borderRadius,color,borderColor",
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

        const originState = Flip.getState(origin, {
            props: "backgroundColor,borderRadius,color,borderColor"
        })
        
        Flip.to(originState, {
            targets: dialog,
            scale: true,
            props: "backgroundColor,borderRadius,color,borderColor",
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

            dialog.pretty-modal-opening,
            dialog[open] {
                margin: 0;
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
                backdrop-filter: blur(4px);
            }

            dialog.pretty-modal-opening::backdrop {
                animation: pretty-modal-backdrop-in 400ms cubic-bezier(.56,.27,0,1);
            }

            dialog.pretty-modal-closing::backdrop {
                animation: pretty-modal-backdrop-out 400ms cubic-bezier(.56,.27,0,1) forwards;
            }

            @keyframes pretty-modal-backdrop-in {
                from { background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
                to   { background: rgba(0,0,0,0.2); backdrop-filter: blur(4px); }
            }

            @keyframes pretty-modal-backdrop-out {
                from { background: rgba(0,0,0,0.2); backdrop-filter: blur(4px); }
                to   { background: rgba(0,0,0,0); backdrop-filter: blur(0px); }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'pretty-modal-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}
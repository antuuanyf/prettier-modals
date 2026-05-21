# Pretty Modal — Plan de distribución

Objetivo principal: poder usar `PrettyModal` en proyectos Angular, manteniendo el core reutilizable en cualquier framework o vanilla JS.

## Estrategia general

Dos capas:

1. **Core vanilla** (`pretty-modal`): librería JS pura sin dependencias de framework, publicada en npm. Base para todos los wrappers.
2. **Wrapper Angular** (`pretty-modal-angular` o entry point `pretty-modal/angular`): capa fina sobre el core que expone directivas y servicios Angular-nativos.

---

## Camino A — Librería JS vanilla, consumida desde Angular

Publicar `pretty-modal` como paquete npm normal (ESM) e importarlo desde Angular como cualquier dependencia.

**Uso típico:**

```ts
import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, NgZone } from '@angular/core'
import { PrettyModal } from 'pretty-modal'

@Component({...})
export class MyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog') dialogRef!: ElementRef<HTMLDialogElement>
  @ViewChild('trigger') triggerRef!: ElementRef<HTMLButtonElement>
  private modal!: PrettyModal

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.modal = new PrettyModal()
    })
  }

  open() {
    this.zone.runOutsideAngular(() => {
      this.modal.open(this.dialogRef.nativeElement, this.triggerRef.nativeElement)
    })
  }

  ngOnDestroy() { this.modal.destroy?.() }
}
```

**Pro:** una sola librería sirve para Angular, React, Vue, vanilla. Mantenimiento simple.
**Contra:** cada usuario Angular escribe boilerplate de `ViewChild` + `NgZone`.

---

## Camino B — Librería Angular dedicada (`ng-packagr`)

Publicar un paquete `pretty-modal-angular` (o entry point `pretty-modal/angular`) con directivas, servicios y/o componentes Angular-nativos sobre el core vanilla.

**API objetivo:**

```html
<button prettyModalTrigger="myDialog">Open</button>
<dialog prettyModal id="myDialog">
  <button prettyModalClose>Close</button>
</dialog>
```

Tres directivas (`prettyModal`, `prettyModalTrigger`, `prettyModalClose`) que internamente usan el core. El usuario Angular no escribe `ViewChild` ni `NgZone`.

**Pro:** integración nativa, sintaxis declarativa.
**Contra:** mantener dos paquetes (core + wrapper) y usar `ng-packagr` (formato APF — Angular Package Format).

---

## Recomendación

Hacer ambas cosas en este orden:

1. **Core vanilla** (`pretty-modal`) bien diseñado: API limpia con elementos pasados explícitamente, imports de GSAP como módulos, sin globales, método `destroy()`.
2. **Capa Angular** (`pretty-modal/angular` o paquete aparte):
   - `PrettyModalService` — wrapper inyectable del core.
   - Directivas: `[prettyModal]`, `[prettyModalTrigger]`, `[prettyModalClose]`.
   - Standalone (sin `NgModule`).

---

## Cosas específicas de Angular

- **`NgZone.runOutsideAngular`**: las animaciones GSAP disparan `requestAnimationFrame` por frame. Dentro de la zona Angular hace change detection cada frame → caída de rendimiento. Envolver siempre.
- **SSR (Angular Universal)**: el core toca `document`, `window`, `event`. En SSR no existen. Proteger con `isPlatformBrowser(this.platformId)` en el wrapper, o `typeof window !== 'undefined'` en el core.
- **Standalone components**: directivas con `standalone: true`. Importación granular sin NgModule.
- **Peer dependency de Angular**: el wrapper declara `@angular/core` como peer con rango amplio (`>=17`).
- **`ng-packagr`**: bundler oficial de Angular. Genera formato APF (ESM + tipos + metadata).
- **Versión mínima**: Angular 17+ (standalone por defecto, control flow nuevo).

---

## Empaquetado del core

- **`package.json`** con `name`, `version`, `main`, `module`, `exports`, `types`, `peerDependencies`.
- **Bundler**: `tsup` (esbuild, configuración mínima) o Vite library mode.
- **Formatos a publicar**:
  - **ESM** (`.mjs`) — bundlers modernos.
  - **CJS** (`.cjs`) — Node / proyectos legacy.
  - **UMD/IIFE** (`.js`) — uso via `<script>` desde CDN.
  - **`.d.ts`** — tipos TypeScript (generables desde JSDoc).

## GSAP

- **Peer dependency** recomendado: el usuario instala GSAP. El paquete lo importa pero no lo empaqueta. Sin duplicación.
- Cambiar globales (`Flip`, `CustomEase`) a imports explícitos:

```js
import { gsap } from "gsap"
import { Flip } from "gsap/Flip"
import { CustomEase } from "gsap/CustomEase"

gsap.registerPlugin(Flip, CustomEase)
```

## API del core (a rediseñar)

Estado actual: `new PrettyModal()` + `open(id)` + `close(id)` dependiendo de `event.currentTarget` global (frágil — falla en Firefox y en frameworks que no propagan event global).

Objetivo:

- **Elemento origen explícito**: `modal.open(dialog, origin)` o `modal.open({ dialog, trigger })`.
- **Selectores o elementos**: aceptar ambos.
- **Eventos / callbacks**: `onOpen`, `onClose`, `onBeforeClose`.
- **Opciones configurables**: duración, ease, props a animar.
- **Auto-bind opcional**: helper tipo `PrettyModal.autoBind('[data-pretty-modal]')` que escanee el DOM y conecte triggers automáticamente.

---

## Estructura de repositorio

Monorepo con npm workspaces o pnpm workspaces:

```
pretty-modal/
├── packages/
│   ├── core/          → pretty-modal (vanilla, tsup)
│   └── angular/       → pretty-modal-angular (ng-packagr)
├── demos/
│   ├── vanilla/       → HTML + script
│   └── angular/       → app Angular de prueba
└── package.json
```

---

## Cosas a arreglar antes de v1.0

- Eliminar dependencia de `event.currentTarget` global.
- Múltiples instancias y modales sin colisión de IDs.
- Bloqueo durante animaciones (o animación reversible interrumpible).
- Tests: Vitest + Playwright para demo real.
- Soporte `prefers-reduced-motion`.
- Método `destroy()` que limpie estilos inyectados y listeners.

---

## Distribución

- **npm**: `npm publish` (scoped `@usuario/pretty-modal` o nombre libre).
- **CDN automático**: jsDelivr y unpkg sirven el paquete tras publicar en npm. El bundle UMD permite `<script src="https://cdn.jsdelivr.net/npm/pretty-modal">`.
- **GitHub**: README con ejemplos, demo en GitHub Pages, CHANGELOG.

---

## Orden sugerido hacia v1.0

1. Refactor de la API del core (parámetros explícitos, opciones, sin globales).
2. Imports de GSAP como módulos.
3. Setup de `tsup` + `package.json` con `exports`.
4. Tipos vía JSDoc → `.d.ts`.
5. Demo HTML usando el bundle final (no el `src/` directo).
6. Publicar core en npm como `0.1.0`.
7. Wrapper Angular como paquete o entry point separado, con `ng-packagr`.
8. Demo Angular real.
9. Publicar wrapper Angular como `0.2.0`+.

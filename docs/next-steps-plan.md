# Pretty Modal — Plan: demo Angular y tests

Estado actual (hecho): monorepo npm workspaces con `packages/core` (`pretty-modal`, build tsup → ESM+CJS+`.d.ts`) y `packages/angular` (`pretty-modal-angular`, build ng-packagr → APF). Demo vanilla en `demo/` funcionando. Falta: demo Angular real, tests, publicar.

Este documento cubre los dos siguientes pasos: **demo Angular** y **tests**.

---

## 1. Demo Angular

Objetivo: una app Angular mínima que **consuma el paquete construido** (`pretty-modal-angular`), no el código fuente — así valida el artefacto real (APF, peer deps, registro de plugins GSAP).

### Ubicación

```
demos/
└── angular/        → app Angular standalone de prueba
```

(El demo vanilla puede moverse luego a `demos/vanilla/`; por ahora se queda en `demo/` para no romper el README.)

### Decisiones

- **Standalone app** (sin `NgModule`), Angular 19+, `bootstrapApplication`.
- **Cómo resolver `pretty-modal-angular`**: vía el workspace. Opciones:
  - **A (recomendada)**: añadir `demos/angular` a los `workspaces` del root. npm symlinkea `pretty-modal-angular` → `packages/angular/dist` si el `package.json` del demo lo declara como dependencia y se apunta a la build. Como ng-packagr publica en `packages/angular/dist`, lo más simple es un `tsconfig` path o `file:` dependency hacia `packages/angular/dist`.
  - **B**: `npm pack` del paquete y instalarlo en el demo (más fiel a producción, más fricción).
  - Decisión: empezar con **A** usando `"pretty-modal-angular": "file:../../packages/angular/dist"` para consumir la build real.
- **Registro de GSAP**: en `main.ts`, `gsap.registerPlugin(Flip, CustomEase)` antes de `bootstrapApplication`.

### Pasos

1. `demos/angular/` con estructura Angular CLI mínima:
   - `package.json` (scripts `start`/`build`, deps `@angular/*`, `gsap`, `pretty-modal`, `pretty-modal-angular` por `file:`).
   - `angular.json`, `tsconfig.json`, `tsconfig.app.json`.
   - `src/main.ts` (registro GSAP + `bootstrapApplication`).
   - `src/index.html`, `src/styles.css`.
   - `src/app/app.component.ts` standalone que importa `PRETTY_MODAL_DIRECTIVES`.
2. Componente demo que reproduzca el demo vanilla: dos botones (`anchor: 'origin'` y `anchor: 'center'`), dos `<dialog>` con `prettyModal`, botones `prettyModalClose`, y bindings `(opened)`/`(closed)` para mostrar que los outputs funcionan.
3. Verificación SSR opcional: comprobar que importar el servicio no rompe en build de producción (el guard `isPlatformBrowser` ya protege; un smoke test de `ng build` basta para v1).
4. Script en root: `npm run demo:angular` → `npm --prefix demos/angular start`.
5. Verificar a mano (`ng serve`) y, si se automatiza, con Playwright (ver sección 2).

### Riesgos / notas

- ng-packagr publica en `packages/angular/dist`; el demo debe consumir esa carpeta, así que **hay que construir el paquete Angular antes** de arrancar el demo (`npm run build:angular`). Documentarlo y/o encadenarlo en el script.
- Versiones: alinear Angular del demo con las `devDependencies` de `packages/angular` (19.2.x) para evitar mismatches de peer.
- Node 24: confirmar que la versión de Angular CLI elegida no avisa de engine incompatible.

---

## 2. Tests

Dos niveles: **unit** del core (Vitest) y **e2e** de la animación real (Playwright). El wrapper Angular se cubre con un par de tests de servicio/directiva.

### 2.1 Core — Vitest (`packages/core`)

- **Entorno**: `jsdom` o `happy-dom` (hay `document`/`dialog`; GSAP/Flip se mockea, no se mide animación real aquí).
- **Mock de GSAP**: `vi.mock('gsap')`, `gsap/Flip`, `gsap/CustomEase` → stubs que registran llamadas. Verificar comportamiento, no la animación.
- **Casos**:
  - `open(id)` con dialog inexistente → no lanza, no llama a Flip.
  - `open` sin trigger ni `event` → `console.warn` y no abre.
  - `open(el, { trigger })` → asigna `data-flip-id` igual en trigger y dialog, llama `dialog.showModal()`, `Flip.from` con la ease y duración correctas.
  - Reentrancia: segundo `open` mientras `animating` → ignorado.
  - `close` → `Flip.to`, en `onComplete` limpia `style` y llama `dialog.close()`.
  - `prefers-reduced-motion`: con `matchMedia` mockeado a `matches:true` → abre/cierra sin Flip y dispara `onOpen`/`onClose`.
  - `destroy()` → elimina el `<style id="pretty-modal-styles">`.
  - SSR: instanciar sin `document` (o con guard) → no peta, `ease` undefined.
- **Setup**: `vitest.config.ts` en `packages/core`, script `"test": "vitest run"`, `"test:watch"`.

### 2.2 Core — Playwright (animación real, e2e)

- **Objetivo**: validar la animación de verdad en navegador (lo que ya hice a mano con Chrome headless/CDP, pero automatizado y repetible).
- **Setup**: `@playwright/test` en el root (o en `packages/core`). `webServer` que sirva el repo (`npx serve` o `http-server`) y apunte a `demo/`.
- **Casos** (replican mi verificación manual):
  - Click en trigger → el dialog recibe la clase `pretty-modal-opening` y un `transform` no-`none`; al terminar, `opacity:1` y clase limpia.
  - Click en close → clase `pretty-modal-closing`, luego `open=false` y `style` vacío.
  - `anchor: 'origin'` posiciona el dialog cerca del trigger (comprobar `getBoundingClientRect` aproximado).
  - `prefers-reduced-motion` (emulado en Playwright) → abre sin animación.
- **CI**: GitHub Actions con `playwright install --with-deps chromium`.

### 2.3 Angular — pruebas mínimas (`packages/angular`)

- **Servicio**: con `TestBed`, mock de `PrettyModal` (o de la importación `pretty-modal`), verificar que `open`/`close` corren `runOutsideAngular` y que en `PLATFORM_ID='server'` no instancian el core.
- **Directivas**: componente host de test → click en `[prettyModalTrigger]` llama `service.open` con el `trigger` correcto; `[prettyModalClose]` resuelve el `<dialog>` ancestro; `(opened)`/`(closed)` se emiten al invocar los callbacks del registro.
- **Runner**: Vitest + `@analogjs/vitest-angular` o el web-test-runner; lo más ligero para una lib standalone es Vitest con `@angular/platform-browser-dynamic/testing`. Decidir al implementar.

### Orden sugerido

1. Vitest del core (rápido, sin navegador) — mayor retorno inmediato.
2. Demo Angular (sirve también de base para e2e y de validación del artefacto).
3. Playwright e2e del core (apunta al demo vanilla).
4. Tests del wrapper Angular.
5. CI (Actions): lint + unit + e2e + build de ambos paquetes.

---

## Checklist hacia la publicación (recordatorio)

- [ ] Demo Angular consumiendo la build real.
- [ ] Vitest core verde.
- [ ] Playwright e2e verde.
- [ ] Tests wrapper Angular.
- [ ] CI en verde.
- [ ] `npm publish` core `pretty-modal@0.1.0`.
- [ ] `npm publish` wrapper `pretty-modal-angular@0.1.0` (tras publicar el core, por el peer dep).

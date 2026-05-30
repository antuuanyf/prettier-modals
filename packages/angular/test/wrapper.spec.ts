import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  Component,
  ElementRef,
  EnvironmentInjector,
  NgZone,
  PLATFORM_ID,
  runInInjectionContext,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'

// Mock the vanilla core so no real GSAP animation runs; we only assert wiring.
const core = vi.hoisted(() => {
  const instance = { open: vi.fn(), close: vi.fn(), destroy: vi.fn() }
  // Regular function so it is usable with `new PrettyModal()` in the service.
  const ctor = vi.fn(function () {
    return instance
  })
  return { instance, ctor }
})
vi.mock('pretty-modal', () => ({ PrettyModal: core.ctor }))

import { PrettyModalService } from '../src/lib/pretty-modal.service'
import { PrettyModalTriggerDirective } from '../src/lib/pretty-modal-trigger.directive'
import { PrettyModalCloseDirective } from '../src/lib/pretty-modal-close.directive'
import { PrettyModalDirective } from '../src/lib/pretty-modal.directive'

/**
 * Construct a directive inside an injection context with the given providers.
 * NgZone is left to the real TestBed-provided instance (Angular's change
 * detection scheduler depends on its real observables), so callers spy on it.
 */
function createInContext<T>(ctor: new () => T, providers: unknown[]): T {
  const injector = TestBed.configureTestingModule({ providers: providers as never[] }).inject(
    EnvironmentInjector,
  )
  return runInInjectionContext(injector, () => new ctor())
}

beforeEach(() => {
  TestBed.resetTestingModule()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('PrettyModalService', () => {
  function makeService(platform: 'browser' | 'server') {
    TestBed.configureTestingModule({
      providers: [PrettyModalService, { provide: PLATFORM_ID, useValue: platform }],
    })
    const zone = TestBed.inject(NgZone)
    const runOutsideAngular = vi.spyOn(zone, 'runOutsideAngular')
    const service = TestBed.inject(PrettyModalService)
    return { service, runOutsideAngular }
  }

  it('lazily instantiates the core and forwards open() outside the zone', () => {
    const { service, runOutsideAngular } = makeService('browser')
    service.open('dialog-1', { trigger: 'btn' })

    expect(core.ctor).toHaveBeenCalledOnce()
    expect(runOutsideAngular).toHaveBeenCalled()
    expect(core.instance.open).toHaveBeenCalledWith('dialog-1', { trigger: 'btn' })
  })

  it('forwards close() to the core', () => {
    const { service } = makeService('browser')
    service.close('dialog-1')
    expect(core.instance.close).toHaveBeenCalledWith('dialog-1', {})
  })

  it('reuses a single core instance across calls', () => {
    const { service } = makeService('browser')
    service.open('a', { trigger: 'x' })
    service.open('a', { trigger: 'x' })
    expect(core.ctor).toHaveBeenCalledOnce()
  })

  it('does not instantiate the core on the server (SSR-safe)', () => {
    const { service } = makeService('server')
    service.open('dialog-1', { trigger: 'btn' })
    service.close('dialog-1')

    expect(core.ctor).not.toHaveBeenCalled()
    expect(core.instance.open).not.toHaveBeenCalled()
    expect(core.instance.close).not.toHaveBeenCalled()
  })
})

describe('PrettyModalTriggerDirective', () => {
  it('opens the target dialog, morphing from the host element', () => {
    const host = document.createElement('button')
    const service = { open: vi.fn(), registration: vi.fn(() => undefined) }
    const dir = createInContext(PrettyModalTriggerDirective, [
      { provide: ElementRef, useValue: new ElementRef(host) },
      { provide: PrettyModalService, useValue: service },
    ])
    dir.target = 'dialog-1'
    dir.anchor = 'center'

    dir.onClick()

    expect(service.open).toHaveBeenCalledOnce()
    const [target, opts] = service.open.mock.calls[0]
    expect(target).toBe('dialog-1')
    expect(opts.trigger).toBe(host)
    expect(opts.anchor).toBe('center')
  })

  it("falls back to the dialog's registered anchor and wires onOpen", () => {
    const host = document.createElement('button')
    const registration = { anchor: 'origin', notifyOpened: vi.fn(), notifyClosed: vi.fn() }
    const service = { open: vi.fn(), registration: vi.fn(() => registration) }
    const dir = createInContext(PrettyModalTriggerDirective, [
      { provide: ElementRef, useValue: new ElementRef(host) },
      { provide: PrettyModalService, useValue: service },
    ])
    dir.target = 'dialog-1'

    dir.onClick()

    const [, opts] = service.open.mock.calls[0]
    expect(opts.anchor).toBe('origin')
    expect(typeof opts.onOpen).toBe('function')

    // The wired onOpen notifies the registration so the directive can emit.
    opts.onOpen('dlg')
    expect(registration.notifyOpened).toHaveBeenCalledWith('dlg')
  })
})

describe('PrettyModalCloseDirective', () => {
  it('closes the nearest ancestor <dialog> and wires onClose', () => {
    const dialog = document.createElement('dialog')
    dialog.id = 'dialog-1'
    const host = document.createElement('button')
    dialog.appendChild(host)
    document.body.appendChild(dialog)

    const registration = { anchor: undefined, notifyOpened: vi.fn(), notifyClosed: vi.fn() }
    const service = { close: vi.fn(), registration: vi.fn(() => registration) }
    const dir = createInContext(PrettyModalCloseDirective, [
      { provide: ElementRef, useValue: new ElementRef(host) },
      { provide: PrettyModalService, useValue: service },
    ])

    dir.onClick()

    expect(service.close).toHaveBeenCalledOnce()
    const [target, opts] = service.close.mock.calls[0]
    expect(target).toBe(dialog)
    expect(typeof opts.onClose).toBe('function')
    opts.onClose('dlg')
    expect(registration.notifyClosed).toHaveBeenCalledWith('dlg')
  })

  it('does nothing when there is no dialog to close', () => {
    const host = document.createElement('button')
    document.body.appendChild(host)
    const service = { close: vi.fn(), registration: vi.fn() }
    const dir = createInContext(PrettyModalCloseDirective, [
      { provide: ElementRef, useValue: new ElementRef(host) },
      { provide: PrettyModalService, useValue: service },
    ])

    dir.onClick()
    expect(service.close).not.toHaveBeenCalled()
  })
})

describe('PrettyModalDirective', () => {
  function makeDialogDirective() {
    const dialog = document.createElement('dialog')
    dialog.id = 'settings'
    document.body.appendChild(dialog)
    const service = { register: vi.fn(), unregister: vi.fn(), close: vi.fn() }
    const dir = createInContext(PrettyModalDirective, [
      { provide: ElementRef, useValue: new ElementRef(dialog) },
      { provide: PrettyModalService, useValue: service },
    ])
    const zoneRun = vi.spyOn(TestBed.inject(NgZone), 'run')
    return { dir, dialog, service, zoneRun }
  }

  it('registers itself with the service on init', () => {
    const { dir, service } = makeDialogDirective()
    dir.ngOnInit()
    expect(service.register).toHaveBeenCalledWith('settings', dir)
  })

  it('emits opened/closed inside the Angular zone', () => {
    const { dir, dialog, zoneRun } = makeDialogDirective()
    const opened: HTMLDialogElement[] = []
    const closed: HTMLDialogElement[] = []
    dir.opened.subscribe((d) => opened.push(d))
    dir.closed.subscribe((d) => closed.push(d))

    dir.notifyOpened(dialog)
    dir.notifyClosed(dialog)

    expect(zoneRun).toHaveBeenCalled()
    expect(opened).toEqual([dialog])
    expect(closed).toEqual([dialog])
  })

  it('intercepts the native cancel (Escape) and routes the close through the service', () => {
    const { dir, dialog, service } = makeDialogDirective()
    dir.ngOnInit()

    const event = new Event('cancel', { cancelable: true })
    dialog.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(service.close).toHaveBeenCalledWith(
      dialog,
      expect.objectContaining({ onClose: expect.any(Function) }),
    )
  })

  it('unregisters on destroy', () => {
    const { dir, service } = makeDialogDirective()
    dir.ngOnInit()
    dir.ngOnDestroy()
    expect(service.unregister).toHaveBeenCalledWith('settings')
  })
})

describe('cross-component usage (separate Button and Modal components)', () => {
  // A "button" component that only knows the target dialog id.
  @Component({
    standalone: true,
    imports: [PrettyModalTriggerDirective],
    template: `<button [prettyModalTrigger]="target" anchor="center">Open</button>`,
  })
  class TriggerHostComponent {
    target = 'remote-dialog'
  }

  // A "modal" component declared independently of the trigger.
  @Component({
    standalone: true,
    imports: [PrettyModalDirective, PrettyModalCloseDirective],
    template: `<dialog id="remote-dialog" prettyModal anchor="origin">
      <button prettyModalClose>Close</button>
    </dialog>`,
  })
  class ModalHostComponent {}

  it('links a trigger and a dialog living in different components via the root service', () => {
    // Both components share the providedIn:'root' service in one TestBed module.
    const modalFixture = TestBed.createComponent(ModalHostComponent)
    const triggerFixture = TestBed.createComponent(TriggerHostComponent)
    modalFixture.detectChanges()
    triggerFixture.detectChanges()

    const service = TestBed.inject(PrettyModalService)
    const openSpy = vi.spyOn(service, 'open')

    // The dialog component registered itself, so the trigger can resolve it.
    expect(service.registration('remote-dialog')).toBeDefined()
    // Its registered anchor ('origin') is independent of the trigger's host attr.
    expect(service.registration('remote-dialog')?.anchor).toBe('origin')

    const button = triggerFixture.nativeElement.querySelector('button') as HTMLButtonElement
    button.click()

    expect(openSpy).toHaveBeenCalledOnce()
    const [target, opts] = openSpy.mock.calls[0]
    expect(target).toBe('remote-dialog')
    expect(opts?.anchor).toBe('center')
    // onOpen is wired to the dialog component's registration even across components.
    expect(typeof opts?.onOpen).toBe('function')
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Shared spies for the mocked GSAP modules. `vi.hoisted` lets the spies exist
// before `vi.mock` factories run (which are themselves hoisted above imports).
const h = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  fromTo: vi.fn(),
  to: vi.fn(),
  set: vi.fn(),
  toArray: vi.fn((v) => (v?.children ? Array.from(v.children) : Array.from(v ?? []))),
  flipFrom: vi.fn(),
  flipTo: vi.fn(),
  flipGetState: vi.fn(() => ({ __flipState: true })),
  customEaseCreate: vi.fn((name) => `ease:${name}`),
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: h.registerPlugin,
    fromTo: h.fromTo,
    to: h.to,
    set: h.set,
    utils: { toArray: h.toArray },
  },
}))
vi.mock('gsap/Flip', () => ({
  Flip: { from: h.flipFrom, to: h.flipTo, getState: h.flipGetState },
}))
vi.mock('gsap/CustomEase', () => ({ CustomEase: { create: h.customEaseCreate } }))

import { PrettyModal } from '../src/PrettyModal.js'

/** Build a `<dialog>` (with id) and a trigger button, both attached to the DOM. */
function fixture(id = 'd1') {
  const dialog = document.createElement('dialog')
  dialog.id = id
  // happy-dom may not flip `open` on showModal/close — stub the native methods.
  dialog.showModal = vi.fn(() => {
    dialog.setAttribute('open', '')
  })
  dialog.close = vi.fn(() => {
    dialog.removeAttribute('open')
  })
  const trigger = document.createElement('button')
  document.body.append(dialog, trigger)
  return { dialog, trigger }
}

/** Set what `window.matchMedia('(prefers-reduced-motion: reduce)')` reports. */
function setReducedMotion(matches) {
  window.matchMedia = vi.fn(() => ({ matches }))
}

beforeEach(() => {
  vi.clearAllMocks()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  setReducedMotion(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('constructor', () => {
  it('creates both eases and injects the stylesheet', () => {
    const m = new PrettyModal()
    expect(h.customEaseCreate).toHaveBeenCalledWith('pretty-modal-ease', expect.any(String))
    expect(h.customEaseCreate).toHaveBeenCalledWith('pretty-modal-ease-origin', expect.any(String))
    expect(m.ease).toBe('ease:pretty-modal-ease')
    expect(m.originEase).toBe('ease:pretty-modal-ease-origin')
    expect(document.getElementById('pretty-modal-styles')).not.toBeNull()
  })

  it('injects the stylesheet only once', () => {
    new PrettyModal()
    new PrettyModal()
    expect(document.querySelectorAll('#pretty-modal-styles')).toHaveLength(1)
  })

  it('merges custom options over the defaults', () => {
    const m = new PrettyModal({ anchor: 'origin', duration: 1 })
    expect(m.defaults.anchor).toBe('origin')
    expect(m.defaults.duration).toBe(1)
    expect(m.defaults.respectReducedMotion).toBe(true)
  })
})

describe('open', () => {
  it('does nothing for an unknown dialog id', () => {
    const m = new PrettyModal()
    expect(() => m.open('does-not-exist', { trigger: document.body })).not.toThrow()
    expect(h.flipFrom).not.toHaveBeenCalled()
  })

  it('is a no-op when the dialog is already open', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    dialog.setAttribute('open', '')
    m.open(dialog, { trigger })
    expect(h.flipFrom).not.toHaveBeenCalled()
  })

  it('warns and does not open when no trigger can be resolved', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const m = new PrettyModal()
    const { dialog } = fixture()
    m.open(dialog)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No trigger element found'))
    expect(dialog.showModal).not.toHaveBeenCalled()
    expect(h.flipFrom).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('pairs trigger and dialog with a shared data-flip-id and runs Flip.from', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger, duration: 0.6 })

    expect(trigger.dataset.flipId).toBeDefined()
    expect(dialog.dataset.flipId).toBe(trigger.dataset.flipId)
    expect(dialog.showModal).toHaveBeenCalledOnce()
    expect(h.flipGetState).toHaveBeenCalledWith(trigger)
    expect(h.flipFrom).toHaveBeenCalledOnce()

    const [state, config] = h.flipFrom.mock.calls[0]
    expect(state).toEqual({ __flipState: true })
    expect(config.targets).toBe(dialog)
    expect(config.ease).toBe(m.ease)
    expect(config.duration).toBe(0.6)
    expect(config.toggleClass).toBe('pretty-modal-opening')
  })

  it('uses the overshoot origin ease for the origin anchor', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger, anchor: 'origin' })

    expect(h.flipFrom.mock.calls[0][1].ease).toBe(m.originEase)
  })

  it('scales via transform by default', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger })
    expect(h.flipFrom.mock.calls[0][1].scale).toBe(true)
  })

  it('honors an explicit scale: false', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger, scale: false })
    expect(h.flipFrom.mock.calls[0][1].scale).toBe(false)
  })

  it('uses openDuration over the base duration for opening', () => {
    const m = new PrettyModal({ duration: 1, openDuration: 0.2 })
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger })
    expect(h.flipFrom.mock.calls[0][1].duration).toBe(0.2)
  })

  it('falls back to duration when openDuration is not set', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger, duration: 0.3 })
    expect(h.flipFrom.mock.calls[0][1].duration).toBe(0.3)
  })

  it('ignores a second open while the first is still animating', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    // First open leaves `animating: true` because the Flip mock never completes.
    m.open(dialog, { trigger })
    m.open(dialog, { trigger })
    expect(h.flipFrom).toHaveBeenCalledOnce()
  })

  it('fires onOpen and clears the animating flag when Flip completes', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    const onOpen = vi.fn()

    m.open(dialog, { trigger, onOpen })
    const { onComplete } = h.flipFrom.mock.calls[0][1]
    onComplete()

    expect(onOpen).toHaveBeenCalledWith(dialog)
    expect(m.state.get(dialog).animating).toBe(false)
  })

  it('fades in the container and its content as separate layers', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    dialog.append(document.createElement('h1'))

    m.open(dialog, { trigger, duration: 0.5 })

    // Container layer: dialog itself, blur + opacity, no delay.
    const container = h.fromTo.mock.calls.find(([t]) => t === dialog)
    expect(container).toBeDefined()
    expect(container[1]).toMatchObject({ opacity: 0, filter: 'blur(4px)' })
    expect(container[2]).toMatchObject({ opacity: 1, filter: 'blur(0px)' })

    // Content layer: dialog children, opacity only, delayed.
    const content = h.fromTo.mock.calls.find(([t]) => Array.isArray(t))
    expect(content).toBeDefined()
    expect(content[2].delay).toBeGreaterThan(0)
  })

  it('clears inline opacity/filter once the open animation completes', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger })
    const { onComplete } = h.flipFrom.mock.calls[0][1]
    onComplete()

    expect(h.set).toHaveBeenCalledWith(expect.any(Array), { clearProps: 'opacity,filter' })
  })
})

describe('reduced motion', () => {
  it('opens without Flip and still fires onOpen', () => {
    setReducedMotion(true)
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    const onOpen = vi.fn()

    m.open(dialog, { trigger, onOpen })

    expect(dialog.showModal).toHaveBeenCalledOnce()
    expect(h.flipFrom).not.toHaveBeenCalled()
    expect(onOpen).toHaveBeenCalledWith(dialog)
    expect(m.state.get(dialog).animating).toBe(false)
  })

  it('closes without Flip and still fires onClose', () => {
    setReducedMotion(true)
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    const onClose = vi.fn()

    m.open(dialog, { trigger })
    m.close(dialog, { onClose })

    expect(h.flipTo).not.toHaveBeenCalled()
    expect(dialog.close).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledWith(dialog)
  })
})

describe('close', () => {
  it('is a no-op when the dialog is not open', () => {
    const m = new PrettyModal()
    const { dialog } = fixture()
    m.close(dialog)
    expect(h.flipTo).not.toHaveBeenCalled()
  })

  it('runs Flip.to and, on complete, clears style and closes the dialog', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    const onClose = vi.fn()

    m.open(dialog, { trigger })
    m.close(dialog, { onClose })

    expect(h.flipTo).toHaveBeenCalledOnce()
    const config = h.flipTo.mock.calls[0][1]
    expect(config.targets).toBe(dialog)
    expect(config.toggleClass).toBe('pretty-modal-closing')

    // The dialog is not actually closed until Flip's onComplete fires.
    expect(dialog.close).not.toHaveBeenCalled()
    config.onComplete()
    expect(dialog.getAttribute('style')).toBe('')
    expect(dialog.close).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledWith(dialog)
  })

  it('fades the content out (opacity + blur) on close', () => {
    const m = new PrettyModal()
    const { dialog, trigger } = fixture()
    dialog.append(document.createElement('h1'))

    m.open(dialog, { trigger })
    h.to.mockClear()
    m.close(dialog)

    const fade = h.to.mock.calls.find(([t]) => Array.isArray(t))
    expect(fade).toBeDefined()
    expect(fade[1]).toMatchObject({ opacity: 0, filter: 'blur(4px)' })
  })

  it('uses closeDuration over the base duration for closing', () => {
    const m = new PrettyModal({ duration: 1, closeDuration: 0.2 })
    const { dialog, trigger } = fixture()

    m.open(dialog, { trigger })
    m.close(dialog)
    expect(h.flipTo.mock.calls[0][1].duration).toBe(0.2)
  })
})

describe('destroy', () => {
  it('removes the injected stylesheet', () => {
    const m = new PrettyModal()
    expect(document.getElementById('pretty-modal-styles')).not.toBeNull()
    m.destroy()
    expect(document.getElementById('pretty-modal-styles')).toBeNull()
  })
})

describe('SSR safety', () => {
  it('constructs without a document and leaves ease undefined', () => {
    vi.stubGlobal('document', undefined)
    let m
    expect(() => {
      m = new PrettyModal()
    }).not.toThrow()
    expect(m.ease).toBeUndefined()
  })
})

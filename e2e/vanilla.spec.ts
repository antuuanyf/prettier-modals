import { test, expect, type Locator } from '@playwright/test'

/**
 * Resolve once the element gains `className` (or immediately if it already has
 * it). Set up *before* the action that triggers it, so a class toggled on and
 * off within the animation window is still observed reliably.
 */
function waitForClass(locator: Locator, className: string, timeout = 3000) {
  return locator.evaluate(
    (el, { className, timeout }) =>
      new Promise<boolean>((resolve) => {
        if (el.classList.contains(className)) return resolve(true)
        const obs = new MutationObserver(() => {
          if (el.classList.contains(className)) {
            obs.disconnect()
            resolve(true)
          }
        })
        obs.observe(el, { attributes: true, attributeFilter: ['class'] })
        setTimeout(() => {
          obs.disconnect()
          resolve(false)
        }, timeout)
      }),
    { className, timeout },
  )
}

test.describe('Pretty Modal — vanilla demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/')
    // The demo pulls GSAP from a CDN via an import map; give it a moment.
    await expect.poll(() => page.evaluate(() => Boolean((window as any).prettyModal))).toBeTruthy()
  })

  test('opens with the opening animation, then settles visible', async ({ page }) => {
    const trigger = page.locator('.container button').first()
    const dialog = page.locator('#dialog-1')

    const opening = waitForClass(dialog, 'pretty-modal-opening')
    await trigger.click()

    // The opening class is applied during the Flip animation.
    expect(await opening).toBe(true)
    // GSAP applies a transform mid-flight.
    const transform = await dialog.evaluate((el) => getComputedStyle(el).transform)
    expect(transform).not.toBe('none')

    // When it settles: open, class removed, fully opaque.
    await expect(dialog).toHaveJSProperty('open', true)
    await expect(dialog).not.toHaveClass(/pretty-modal-opening/)
    await expect(dialog).toHaveCSS('opacity', '1')
  })

  test('closes with the closing animation, then is fully torn down', async ({ page }) => {
    const trigger = page.locator('.container button').first()
    const dialog = page.locator('#dialog-1')
    const closeButton = dialog.locator('.close-button')

    await trigger.click()
    await expect(dialog).toHaveJSProperty('open', true)
    await expect(dialog).not.toHaveClass(/pretty-modal-opening/)

    const closing = waitForClass(dialog, 'pretty-modal-closing')
    await closeButton.click()
    expect(await closing).toBe(true)

    // After the close animation: dialog closed and inline style cleared.
    await expect(dialog).toHaveJSProperty('open', false)
    await expect(dialog).toHaveAttribute('style', '')
  })

  test("anchor 'origin' positions the dialog near its trigger", async ({ page }) => {
    const trigger = page.locator('.container button').first()
    const dialog = page.locator('#dialog-1')

    const triggerBox = await trigger.boundingBox()
    await trigger.click()
    await expect(dialog).toHaveJSProperty('open', true)
    await expect(dialog).not.toHaveClass(/pretty-modal-opening/)

    const dialogBox = await dialog.boundingBox()
    expect(triggerBox).not.toBeNull()
    expect(dialogBox).not.toBeNull()
    // Origin anchoring lines the dialog's left edge up with the trigger.
    expect(Math.abs(dialogBox!.x - triggerBox!.x)).toBeLessThan(40)
    expect(dialogBox!.y).toBeLessThan(triggerBox!.y + 40)
  })

  test('respects prefers-reduced-motion: opens with no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const trigger = page.locator('.container button').first()
    const dialog = page.locator('#dialog-1')

    await trigger.click()
    await expect(dialog).toHaveJSProperty('open', true)
    await expect(dialog).toHaveCSS('opacity', '1')
    // No Flip ran, so the opening class is never applied.
    await expect(dialog).not.toHaveClass(/pretty-modal-opening/)
  })
})

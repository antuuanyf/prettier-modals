import { InjectionToken, type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core'
import type { PrettyModalConfig } from './pretty-modal.types'

/**
 * Instance-level defaults forwarded to the core `PrettyModal` constructor.
 * Optional — when absent the service builds the core with its own defaults.
 */
export const PRETTY_MODAL_CONFIG = new InjectionToken<PrettyModalConfig>('PRETTY_MODAL_CONFIG')

/**
 * Provides instance-level defaults for Pretty Modal (e.g. `ease`/`originEase`,
 * which the core only reads at construction time).
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [providePrettyModal({ anchor: 'origin', originGap: 8 })],
 * })
 * ```
 */
export function providePrettyModal(config: PrettyModalConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: PRETTY_MODAL_CONFIG, useValue: config }])
}

import { PrettyModalDirective } from './lib/pretty-modal.directive'
import { PrettyModalTriggerDirective } from './lib/pretty-modal-trigger.directive'
import { PrettyModalCloseDirective } from './lib/pretty-modal-close.directive'

export { PrettyModalService } from './lib/pretty-modal.service'
export { PrettyModalDirective } from './lib/pretty-modal.directive'
export { PrettyModalTriggerDirective } from './lib/pretty-modal-trigger.directive'
export { PrettyModalCloseDirective } from './lib/pretty-modal-close.directive'
export { PRETTY_MODAL_CONFIG, providePrettyModal } from './lib/pretty-modal.config'
export type {
  PrettyModalAnchor,
  PrettyModalOptions,
  PrettyModalConfig,
  PrettyModalRegistration,
} from './lib/pretty-modal.types'

/** Convenience array to import all Pretty Modal directives at once. */
export const PRETTY_MODAL_DIRECTIVES = [
  PrettyModalDirective,
  PrettyModalTriggerDirective,
  PrettyModalCloseDirective,
] as const

import { bootstrapApplication } from '@angular/platform-browser'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'
import { providePrettyModal } from 'prettier-modals-angular'
import { AppComponent } from './app/app.component'

// Register the GSAP plugins the core relies on before bootstrapping. The core
// also registers them on import, but doing it here makes the dependency explicit
// and guarantees a single shared gsap instance under the bundler.
gsap.registerPlugin(Flip, CustomEase)

bootstrapApplication(AppComponent, {
  providers: [
    // Instance-level defaults shared by every modal in the app. A slightly
    // longer base duration gives the morph room to breathe; per-trigger inputs
    // still override it case by case (e.g. the snappy confirm dialog).
    providePrettyModal({
      duration: 0.5,
      respectReducedMotion: true,
    }),
  ],
}).catch((err) => console.error(err))

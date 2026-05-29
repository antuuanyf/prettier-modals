import { bootstrapApplication } from '@angular/platform-browser'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'
import { AppComponent } from './app/app.component'

// Register the GSAP plugins the core relies on before bootstrapping. The core
// also registers them on import, but doing it here makes the dependency explicit
// and guarantees a single shared gsap instance under the bundler.
gsap.registerPlugin(Flip, CustomEase)

bootstrapApplication(AppComponent).catch((err) => console.error(err))

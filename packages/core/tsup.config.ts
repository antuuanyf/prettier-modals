import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/PrettyModal.js'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: true,
    treeshake: true,
    // GSAP is a peer dependency — never bundle it.
    external: ['gsap', 'gsap/Flip', 'gsap/CustomEase'],
})

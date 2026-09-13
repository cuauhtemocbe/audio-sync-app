import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{js,jsx}'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Targets por archivo en vez de un único número global (#39): un threshold
      // global calculado sobre "All files" quedaba diluido por App.jsx/main.jsx,
      // que hoy no tienen tests. Sin threshold global, cada archivo se exige según
      // su propio riesgo.
      thresholds: {
        'src/getActiveWordIndex.js': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 100
        },
        // functions baja a 75 (no 85): medido por archivo en vez de blendeado con
        // getActiveWordIndex.js, la función de cleanup de addEventListener nunca se
        // ejercita (no hay test de unmount) y deja el real en 80%.
        'src/usePrefersReducedMotion.js': {
          statements: 85,
          branches: 85,
          functions: 75,
          lines: 100
        },
        // branches en 85 (no 100): las guardas `if (audioRef.current)` del timer
        // de polling (línea 25) y de seekTo (línea 34) nunca ejercitan la rama
        // falsy — solo ocurriría si el ref se vuelve null en una carrera con el
        // desmontaje, no reproducible de forma realista en un test de render.
        'src/App.jsx': {
          statements: 100,
          branches: 85,
          functions: 100,
          lines: 100
        },
        'src/main.jsx': {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0
        }
      }
    }
  }
})
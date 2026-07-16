---
title: Milestone 7 — Accesibilidad
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#15"
---

# Milestone 7 — Accesibilidad

## Objective

Hacer que la transición animada de resaltado de la palabra activa (`transition-colors duration-150` en
`src/App.jsx`) respete `prefers-reduced-motion: reduce`, degradando a un cambio instantáneo sin animación
cuando el usuario lo tiene activado, incluyendo cambios en caliente sin recargar la página.

## Context

Historia de origen: [user-stories/milestone-7-accessibility/01-prefers-reduced-motion.md](../user-stories/milestone-7-accessibility/01-prefers-reduced-motion.md)
(issue #15). Independiente de M1-M6. Requisito de accesibilidad no opcional según el estándar de referencia del
usuario para cualquier animación no trivial.

## Requirements

### Functional Requirements

- [x] Sin `prefers-reduced-motion: reduce`, la transición de resaltado se anima como hoy (sin regresión visual;
      verificado con test automatizado y con navegador real, ver Verificación).
- [x] Con `prefers-reduced-motion: reduce` activado, el resaltado cambia instantáneamente, sin transición
      (verificado con test automatizado y con navegador real, ver Verificación).
- [x] Si el usuario cambia la preferencia del sistema mientras la app está abierta, las siguientes transiciones
      respetan el nuevo valor sin necesidad de recargar la página (verificado con test automatizado).

## Architecture

### Components

- `src/usePrefersReducedMotion.js` (nuevo) — hook que lee `window.matchMedia('(prefers-reduced-motion: reduce)')`,
  se suscribe al evento `change` de la `MediaQueryList` para reaccionar en caliente, y expone un booleano.
  Se elige un hook con `matchMedia` (en vez de la variante puramente CSS `motion-reduce:` de Tailwind) porque la
  US pide explícitamente un test de Vitest+jsdom mockeando `matchMedia`; jsdom no evalúa media queries reales,
  así que una solución solo-CSS no sería testeable con la suite actual.
- `src/App.jsx` — usa el hook para condicionar la clase de transición del `<span>` de cada palabra
  (`transition-colors duration-150` solo si `!prefersReducedMotion`).

## User Stories

- [#15 — Respetar prefers-reduced-motion en el resaltado de palabra](../user-stories/milestone-7-accessibility/01-prefers-reduced-motion.md)

## Testing Strategy

### Unit Tests
`src/usePrefersReducedMotion.test.js` (colocado junto al hook, siguiendo la convención del proyecto) con
`@testing-library/react`'s `renderHook`, mockeando `window.matchMedia` para los 3 escenarios Gherkin: valor
inicial `false` (sin animación afectada), valor inicial `true` (sin transición), y disparo del evento `change`
en caliente.

### Manual / Browser
Probado en navegador con la preferencia de movimiento reducido activada desde la configuración del SO, siguiendo
el checklist de `CLAUDE.md` (golden path + casos borde de sincronización audio/texto no deben romperse).

## Boundaries & Constraints

### In Scope
- Solo la transición de color/subrayado de la palabra activa en `App.jsx`.

### Out of Scope
- Otras animaciones futuras (si se agregan, deberán seguir el mismo patrón del hook, pero no existen hoy).

## Success Criteria

- [x] Los 3 escenarios Gherkin de la US #15 pasan a nivel de test automatizado (hook `usePrefersReducedMotion`,
      3 tests con `matchMedia` mockeado) y a nivel de navegador real (ver Verificación).
- [x] Sin regresión en la sincronización audio/texto (`getActiveWordIndex` no se toca; suite completa de 12
      tests en verde).

## Verificación (2026-07-15)

Sin acceso a un entorno de escritorio con GUI en esta sesión, la verificación manual en navegador se hizo con
Chrome real (headless, `google-chrome` del sistema vía Playwright) contra el servidor de `make dev`, emulando
`prefers-reduced-motion` con el mecanismo estándar del navegador (el mismo que usa Chrome DevTools →
Rendering → "Emulate CSS media feature prefers-reduced-motion") en vez de una preferencia del SO físicamente
activada — equivalente funcional, ya que la app lee `matchMedia` sin distinguir el origen de la preferencia:

- **Sin preferencia** (`no-preference`): `matchMedia` reporta `false`; la palabra activa tiene la clase
  `transition-colors duration-150` y `getComputedStyle(...).transitionDuration` = `0.15s`.
- **Con preferencia activada** (`reduce`): `matchMedia` reporta `true`; la clase de transición no está presente
  y `transitionDuration` computado = `0s` (cambio instantáneo).
- **Cambio en caliente**: página cargada sin preferencia (transición animada confirmada), se activa
  `reduce` a mitad de sesión sin recargar (`page.emulateMedia`) y la siguiente palabra activa deja de animarse
  (`transitionDuration` pasa a `0s`) — confirma que el hook se suscribe al evento `change` de `matchMedia`
  correctamente.
- **Golden path**: clic en una palabra dispara `seekTo` (audio salta al timestamp y reproduce).
- **Caso borde fin de audio**: forzar `currentTime` cerca de `duration` no rompe el resaltado (la última
  palabra queda activa, sin excepción).
- **Sin errores de consola/página** en ningún escenario.
- Captura de pantalla confirma visualmente la paleta documentada en `CLAUDE.md` (fondo `gray-900`, palabra
  activa en `orange-400`/`decoration-orange-500`).

## Implementation Plan

Ver [milestone-7-accessibility-plan.md](./milestone-7-accessibility-plan.md).

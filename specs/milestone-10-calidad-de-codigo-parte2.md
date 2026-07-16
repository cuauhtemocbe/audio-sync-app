---
title: Milestone 10 — Calidad de código (parte 2)
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#23"
---

# Milestone 10 — Calidad de código (parte 2)

## Objective

Convertir la cobertura de tests en un gate real: hoy `vite.config.js` mide cobertura pero sin `thresholds`, así
que `npm run test:coverage` siempre sale con código 0 sin importar cuánto baje. Este milestone calibra un umbral
mínimo contra la cobertura real actual y lo integra en `make validate` para que un código nuevo sin tests
efectivamente rompa el pipeline.

## Context

Historia de origen: [user-stories/milestone-10-calidad-de-codigo-parte2](../user-stories/milestone-10-calidad-de-codigo-parte2)
(issue #23). Depende del baseline de tests de milestone 1 (`getActiveWordIndex`) y milestone 7
(`usePrefersReducedMotion`) — no agrega tests nuevos, solo un gate sobre los que ya existen.

Baseline real medido corriendo `npm run test:coverage` (2026-07-15):

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |   88.88 |     90   |   87.5  |   100
 getActiveWordIndex |   85.71 |     90   |   100   |   100
 usePrefersReducedMotion | 90.9 | 100   |    80   |   100
```

`vite.config.js` no define `coverage.include`, así que el provider v8 solo reporta los archivos efectivamente
importados durante los tests (`getActiveWordIndex.js`, `usePrefersReducedMotion.js`) — **no** incluye `App.jsx`
ni `main.jsx` en el denominador. Esto es intencional y coincide con el alcance documentado: `App.jsx` no tiene
tests hoy y esta historia no pide agregarlos (ver Out of Scope). Si en el futuro se agrega `coverage.include`
con un glob amplio (ej. `src/**/*.{js,jsx}`), el porcentaje caería fuerte porque contaría `App.jsx` sin tests —
eso es una decisión aparte, no de este milestone.

## Requirements

### Functional Requirements

- [ ] `vite.config.js` define `coverage.thresholds` (statements/branches/functions/lines) calibrados contra el
      baseline real medido arriba, con un margen que no rompa con fluctuaciones menores pero sí detecte una
      regresión real (código nuevo sin tests que baje cobertura).
- [ ] `npm run test:coverage` sale con código distinto de 0 si la cobertura cae debajo del umbral.
- [ ] `npm run test:coverage` sale con código 0 con el código actual (sin cambios).
- [ ] `make validate` usa el comando con cobertura (no `npm test` a secas) como parte del gate, de forma que una
      regresión de cobertura detiene el pipeline antes de `build`.

### Non-Functional Requirements

- [ ] El umbral no fuerza tests nuevos de `App.jsx` — debe reflejar la cobertura real actual de los módulos ya
      testeados, no subir la vara artificialmente.

## Architecture

### Components

- `vite.config.js`: agregar `coverage.thresholds = { statements: 85, branches: 85, functions: 85, lines: 100 }`
  (valores de referencia por debajo del baseline real medido — statements 88.88→85, branches 90→85,
  functions 87.5→85, lines 100→100 — para no romper por fluctuaciones de 1-2 tests futuros, pero sí fallar si
  cae una historia entera de cobertura). Valor final a confirmar en el plan/implementación corriendo el comando
  con distintos umbrales.
- `Makefile`: el target `validate` pasa de `lint test build license-check` a `lint coverage build license-check`
  — reutiliza el target `coverage` ya existente (que ya corre `up-d` como dependencia y ejecuta
  `npm run test:coverage` dentro de Docker), en vez de duplicar lógica.

## User Stories

- [#23 — Cobertura mínima enforced, no solo reportada](../user-stories/milestone-10-calidad-de-codigo-parte2/01-cobertura-minima-enforced.md)

## Testing Strategy

- Correr `npm run test:coverage` con el código actual → código de salida 0.
- Bajar el umbral temporalmente por debajo de un valor imposible de alcanzar (ej. `lines: 100.1` o agregando una
  línea sin cubrir en `getActiveWordIndex.js` de forma temporal) → confirmar que el comando sale con código
  distinto de 0, y revertir el cambio de prueba.
- Correr `make validate` completo con el umbral real configurado → verde.
- Confirmar que `make validate` se detiene en el paso de cobertura (no llega a `build`) si se fuerza una falla
  temporal.

## Boundaries & Constraints

### In Scope

- Umbral de cobertura sobre los módulos ya testeados (`getActiveWordIndex.js`, `usePrefersReducedMotion.js`).
- Integración del gate en `make validate`.

### Out of Scope

- Agregar tests a `App.jsx` o subir `coverage.include` para abarcar todo `src/` — no lo pide la historia y
  forzaría tests nuevos fuera de alcance (documentado explícitamente en el Technical Context de la US #23).
- Cobertura diferenciada por carpeta/capa — no aplica, el proyecto no tiene capas (ver CLAUDE.md).
- Integrar el reporte de cobertura con un servicio externo (Codecov, Coveralls) — no lo pide la historia; si se
  quiere en el futuro, es un issue nuevo.

## Success Criteria

- [x] Los 3 escenarios Gherkin de la US #23 pasan.
- [x] `make validate` en verde con el umbral real configurado.
- [x] Verificado manualmente que una regresión de cobertura rompe el comando (y se revirtió la prueba).

## Verificación (2026-07-15)

- `coverage.thresholds` configurado en `vite.config.js` con los valores del baseline (statements 85, branches 85,
  functions 85, lines 100). `npm run test:coverage` sale con código 0 con el código actual.
- Regresión forzada temporalmente (`statements: 99`, valor inalcanzable) → el comando salió con código 1 y el
  mensaje `ERROR: Coverage for statements (88.88%) does not meet global threshold (99%)`. Revertido a 85
  inmediatamente después.
- `Makefile`: target `validate` cambiado de `lint test build license-check` a `lint coverage build license-check`.
- `make validate` completo corrido en Docker: lint → coverage → build → license-check, terminó con `validate OK`.
- Issue #23 cerrada en GitHub con el detalle de verificación.

## Implementation Plan

Ver [milestone-10-calidad-de-codigo-parte2-plan.md](./milestone-10-calidad-de-codigo-parte2-plan.md).

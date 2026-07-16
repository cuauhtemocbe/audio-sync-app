---
title: Implementation Plan: Milestone 10 — Calidad de código (parte 2)
status: approved
created: 2026-07-15
---

# Implementation Plan: Milestone 10 — Calidad de código (parte 2)

**Spec**: [milestone-10-calidad-de-codigo-parte2.md](./milestone-10-calidad-de-codigo-parte2.md)

## Components

### 1. Umbral de cobertura (#23)
- **Purpose**: que `npm run test:coverage` falle si la cobertura cae debajo del baseline real.
- **Files**: `vite.config.js`.
- **Effort**: XS

### 2. Gate en `make validate` (#23)
- **Purpose**: que el pipeline de validación use el comando con cobertura, no `npm test` a secas.
- **Files**: `Makefile`.
- **Effort**: XS

## Dependencies

### Build Order

1. Umbral en `vite.config.js` — calibrado contra el baseline medido (statements 88.88, branches 90,
   functions 87.5, lines 100).
2. `Makefile`: `validate` pasa a depender de `coverage` en vez de `test`.

### External Dependencies

Ninguna nueva — `@vitest/coverage-v8` ya está instalado.

## Risks & Assumptions

### Riesgos

- **Umbral demasiado ajustado** (ej. igual al baseline exacto): rompería con la fluctuación normal de agregar un
  test nuevo que temporalmente baja el % antes de subirlo de nuevo. Mitigación: umbral con margen (statements
  85, branches 85, functions 85, lines 100 — este último ya está en el máximo y no tiene margen hacia abajo,
  pero las funciones actuales son pequeñas y determinísticas, riesgo bajo de que baje).
- **`make validate` corre `coverage` en vez de `test`**: `coverage` ya depende de `up-d` (levanta Docker) igual
  que `test` — incluir cobertura no cambia el comportamiento de arranque del pipeline, solo qué script de npm se
  ejecuta dentro del contenedor.

### Assumptions

- El baseline no cambia entre la medición de este plan y la implementación (no se tocó ningún test en el medio).

## Milestones

- [ ] `npm run test:coverage` sale 0 con el código actual.
- [ ] `npm run test:coverage` sale ≠0 con una regresión forzada (y se revierte la prueba).
- [ ] `make validate` en verde, deteniéndose en cobertura si se fuerza una falla.

## Tasks

### Foundation

- [ ] **Configurar `coverage.thresholds`**: agregar a `vite.config.js` dentro de `test.coverage`:
      `thresholds: { statements: 85, branches: 85, functions: 85, lines: 100 }`.
  - **Acceptance**: `npm run test:coverage` sale 0 con el código actual.
  - **Files**: `vite.config.js`.
  - **Tests**: correr el comando, confirmar código de salida.
  - **Effort**: XS

### Features

- [ ] **Verificar que el umbral efectivamente rompe**: forzar una regresión temporal (ej. bajar el umbral de
      `lines` a un valor inalcanzable, o comentar una línea de un test existente), correr
      `npm run test:coverage`, confirmar código de salida ≠0, revertir el cambio de prueba.
  - **Acceptance**: código de salida ≠0 durante la prueba forzada; código vuelve a 0 tras revertir.
  - **Files**: N/A (verificación, sin cambios permanentes).
  - **Tests**: el propio comando.
  - **Effort**: XS

### Integration

- [ ] **`make validate` usa el gate de cobertura**: cambiar el target `validate` de
      `lint test build license-check` a `lint coverage build license-check`.
  - **Acceptance**: `make validate` en verde con el umbral real; se detiene antes de `build` si se fuerza una
    falla de cobertura.
  - **Files**: `Makefile`.
  - **Tests**: `make validate` completo, y con una falla forzada temporal.
  - **Effort**: XS

## Effort Estimate

**Total**: S.

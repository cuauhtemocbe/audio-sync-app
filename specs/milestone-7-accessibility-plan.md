# Implementation Plan: Milestone 7 — Accesibilidad

**Spec**: [milestone-7-accessibility.md](./milestone-7-accessibility.md)
**Created**: 2026-07-15
**Status**: in-progress (falta verificación manual en navegador)

## Components

### 1. Hook `usePrefersReducedMotion`
- **Purpose**: Encapsular la lectura y suscripción a `matchMedia` de forma testeable.
- **Files**: `src/usePrefersReducedMotion.js`, `src/usePrefersReducedMotion.test.js`
- **Effort**: S

### 2. Integración en `App.jsx`
- **Purpose**: Condicionar la clase de transición del resaltado según el hook.
- **Files**: `src/App.jsx`
- **Effort**: XS

## Dependencies

### Build Order
1. Hook (componente 1) — se puede testear en aislamiento.
2. Integración en `App.jsx` (componente 2), depende de 1.

### External Dependencies
Ninguna nueva; usa `@testing-library/react` ya presente en el proyecto.

## Risks & Assumptions

### Risks
- **jsdom no implementa `matchMedia` por default** — mitigado mockeando `window.matchMedia` explícitamente en
  el test (patrón estándar, ya que ni siquiera existe un stub por default en el entorno de Vitest configurado).

### Assumptions
- Ninguna otra animación en el proyecto necesita el mismo tratamiento hoy (confirmado: solo `App.jsx` tiene
  `transition-*`).

## Milestones

- [x] Tests del hook en verde para los 3 escenarios (inicial sin preferencia, inicial con preferencia, cambio en
      caliente)
- [x] `App.jsx` integrado sin romper `getActiveWordIndex` ni los tests existentes
- [ ] Verificación manual en navegador con la preferencia del SO activada — **pendiente, requiere que el usuario
      la haga** (no hay navegador disponible en esta sesión)

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Crear `usePrefersReducedMotion` + tests con `matchMedia` mockeado
  - **Acceptance**: Los 3 escenarios Gherkin de la US #15 pasan a nivel de hook
  - **Files**: `src/usePrefersReducedMotion.js`, `src/usePrefersReducedMotion.test.js`
  - **Effort**: S

### Integration (Build Third)
- [x] **Task 2**: Integrar el hook en `App.jsx`
  - **Acceptance**: La clase `transition-colors duration-150` solo se aplica cuando `!prefersReducedMotion`;
    suite completa de Vitest (`npm test`) sigue en verde
  - **Files**: `src/App.jsx`
  - **Effort**: XS

- [ ] **Task 3**: Verificación manual en navegador
  - **Acceptance**: Con la preferencia del SO activada, el resaltado cambia sin transición; con la preferencia
    desactivada, se anima como antes; sincronización audio/texto sin regresiones
  - **Files**: ninguno (verificación)
  - **Effort**: XS
  - **Estado**: pendiente — el agente no tiene navegador disponible en esta sesión para activar la preferencia
    de SO y confirmar visualmente. `make dev` (puerto 5173) ya está levantado, listo para que el usuario lo
    pruebe siguiendo el checklist de `CLAUDE.md`.

## Effort Estimate

**Total Estimated Days**: ~0.5 día

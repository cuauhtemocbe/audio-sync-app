---
title: Milestone 1 — Red de seguridad de testing
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#1, #2"
---

# Milestone 1 — Red de seguridad de testing

## Objective

Dotar a `audio-sync-app` de un entorno de test (Vitest) y cubrir con tests automatizados el cálculo de
`activeWordIndex`, el área que `CLAUDE.md` ya señala como la de mayor riesgo de regresiones sutiles.

## Context

El proyecto no tiene hoy ningún test runner configurado. Cada cambio se verifica manualmente en el navegador
(seek, pausa, fin de audio). Historias de origen: [user-stories/milestone-1-testing-safety-net](../user-stories/milestone-1-testing-safety-net)
(issues #1 y #2), que ya contienen el detalle de Acceptance Criteria en Gherkin — este spec no los repite, los
referencia.

## Requirements

### Functional Requirements

- [ ] `npm test` corre la suite de Vitest con exit code 0/≠0 según resultado.
- [ ] `npm run test:coverage` genera un reporte en `coverage/` (ruta ya montada por `docker-compose.dev.yml`).
- [ ] La lógica de `activeWordIndex` se extrae a una función pura testeable sin montar el componente.
- [ ] Los escenarios Gherkin de #2 (vacío, un elemento, puntuación sin `ts`, seek, fin de audio, pausa, antes de
      la primera palabra) tienen cada uno un test que falla si el comportamiento se rompe.

### Non-Functional Requirements

- [ ] Cobertura de la función `getActiveWordIndex` >= 90% (lógica de negocio pura, ver README sección 5).

## Architecture

### Components

- `vite.config.js` — sección `test` (environment `jsdom`, setupFiles para jest-dom).
- `src/getActiveWordIndex.js` — función pura extraída de `App.jsx`.
- `src/getActiveWordIndex.test.js` — tests colocados junto al archivo (convención elegida, ver README sección 6).
- `src/test/setup.js` — registro de matchers de `@testing-library/jest-dom`.

### External Dependencies

- `vitest` — test runner integrado con Vite.
- `@testing-library/react`, `@testing-library/jest-dom` — disponibles para tests de componente futuros.
- `jsdom` — entorno DOM para Vitest.

## User Stories

- [#1 — Configurar Vitest y RTL en Docker](../user-stories/milestone-1-testing-safety-net/01-configurar-vitest-en-docker.md)
- [#2 — Cubrir con tests activeWordIndex](../user-stories/milestone-1-testing-safety-net/02-tests-activeWordIndex-sync.md)

## Testing Strategy

### Unit Tests
`getActiveWordIndex` cubierto con los 7+ escenarios de la US #2 (ZOMBIES). Sin integración ni E2E — fuera de
alcance para este milestone.

## Boundaries & Constraints

### In Scope
- Entorno de test + tests de la función pura de sincronización.

### Out of Scope
- Tests de renderizado del componente `App` completo (se deja para una historia futura si se justifica).
- CI hosteado (ver `user-stories/README.md`, explícitamente descartado para este proyecto).

## Success Criteria

- [ ] `npm test` y `npm run test:coverage` funcionan localmente y dentro de `docker-compose.dev.yml`.
- [ ] Los 7 escenarios Gherkin de la US #2 tienen test verde.
- [ ] Verificación manual en navegador de que la sincronización sigue funcionando igual tras el refactor
      (checklist de `CLAUDE.md`).

## Implementation Plan

Ver [milestone-1-testing-safety-net-plan.md](./milestone-1-testing-safety-net-plan.md).

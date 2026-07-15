# Implementation Plan: Milestone 1 — Red de seguridad de testing

**Spec**: [milestone-1-testing-safety-net.md](./milestone-1-testing-safety-net.md)
**Created**: 2026-07-15
**Status**: approved

## Components

### 1. Entorno de Vitest
- **Purpose**: Correr tests dentro y fuera de Docker, con cobertura visible en el host.
- **Files**: `vite.config.js`, `src/test/setup.js`, `package.json` (scripts + devDependencies)
- **Effort**: S

### 2. Función pura `getActiveWordIndex`
- **Purpose**: Extraer el cálculo de palabra activa de `App.jsx` para poder testearlo sin renderizar.
- **Files**: `src/getActiveWordIndex.js`, `src/App.jsx` (usa la función extraída)
- **Effort**: S

### 3. Tests de `getActiveWordIndex`
- **Purpose**: Cubrir los escenarios ZOMBIES de la US #2.
- **Files**: `src/getActiveWordIndex.test.js`
- **Effort**: M

## Dependencies

### Build Order
1. Entorno de Vitest (componente 1)
2. Extracción de la función pura (componente 2) — no depende de 1, pero se verifica con tests de 1
3. Tests (componente 3, depende de 1 y 2)

### External Dependencies
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (devDependencies nuevas)

## Risks & Assumptions

### Risks
- **Extraer la función pura podría cambiar sutilmente el comportamiento** — mitigado escribiendo los tests
  contra el comportamiento actual documentado (Gherkin de la US #2) antes de tocar `App.jsx`, y verificando
  manualmente en navegador después.

### Assumptions
- El bind mount completo de `docker-compose.dev.yml` (`.:/app`) hace innecesario copiar el reporte de cobertura
  fuera del contenedor.

## Milestones

- [x] `npm test` corre en verde localmente y en Docker
- [x] `getActiveWordIndex` extraída y usada por `App.jsx` sin cambiar comportamiento observable
- [x] Los 7+ escenarios de la US #2 tienen test pasando (9 tests, incluye un caso extra de cobertura)
- [x] Verificación manual (Docker: HTML, transcript, mp3 y módulo App.jsx sirven 200 OK; tests verdes dentro del contenedor)

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Instalar y configurar Vitest + RTL + jsdom
  - **Acceptance**: `npm test` y `npm run test:coverage` corren con exit code correcto
  - **Files**: `package.json`, `vite.config.js`, `src/test/setup.js`
  - **Tests**: Un test trivial de humo (`1 + 1 === 2`) para validar el runner antes de escribir tests reales
  - **Effort**: S

### Features (Build Second)
- [x] **Task 2**: Extraer `getActiveWordIndex(words, currentTime)` de `App.jsx`
  - **Acceptance**: `App.jsx` importa y usa la función; el resaltado de palabra activa se comporta igual que antes
  - **Files**: `src/getActiveWordIndex.js`, `src/App.jsx`
  - **Tests**: Ninguno propio (cubierto por Task 3)
  - **Effort**: S

- [x] **Task 3**: Escribir tests de `getActiveWordIndex` para los 7 escenarios de la US #2
  - **Acceptance**: Todos los escenarios Gherkin de la US #2 tienen un test que falla si se rompe el comportamiento
  - **Files**: `src/getActiveWordIndex.test.js`
  - **Tests**: Los 7 escenarios (vacío, un elemento, puntuación, seek, fin de audio, pausa, antes de la primera palabra)
  - **Effort**: M

### Integration (Build Third)
- [x] **Task 4**: Verificación manual en navegador + cierre de historias
  - **Acceptance**: Sincronización audio/texto probada a mano (seek, pausa, fin) sin regresiones
  - **Files**: N/A
  - **Tests**: N/A (verificación manual, no reemplaza los tests automatizados ya escritos)
  - **Effort**: XS

## Effort Estimate

**Total Estimated Days**: 1-1.5 días

| Phase | Effort |
|-------|--------|
| Foundation | S |
| Features | S + M |
| Integration | XS |

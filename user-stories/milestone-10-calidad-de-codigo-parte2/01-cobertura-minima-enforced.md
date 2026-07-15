# Cobertura mínima enforced, no solo reportada

## User Story

```
As mantenedor único de audio-sync-app
I want que la cobertura de tests tenga un umbral mínimo que haga fallar el comando si no se alcanza
In order to que la cobertura sea un gate real del pipeline de validación, no un número decorativo en coverage/ que nadie mira
```

## Technical Context

- `vite.config.js` ya configura `coverage` (provider `v8`, reporters `text`/`html`, `reportsDirectory:
  './coverage'`), pero **sin `thresholds`** — `npm run test:coverage` siempre termina en código 0 sin importar
  cuánto baje la cobertura.
- `make validate` hoy corre `lint → test → build → license-check`, usando `npm test` (sin cobertura). El
  estándar de referencia (sección 5) pide que la cobertura sea un gate real, y sección 3 que el script de
  validación único agrupe ese chequeo.
- Módulos con lógica de negocio pura ya cubiertos: `src/getActiveWordIndex.js` (9 tests) y
  `src/usePrefersReducedMotion.js` (3 tests). `App.jsx` (rendering/efectos) no tiene tests — un umbral global
  muy alto forzaría tests de `App.jsx` que hoy están fuera de alcance documentado; un umbral bien calibrado
  debe reflejar la cobertura real actual sin bajar la vara ni forzar tests nuevos fuera del alcance de esta
  historia.

## Acceptance Criteria

```gherkin
Feature: Umbral de cobertura enforced

  Scenario: El comando falla si la cobertura baja del umbral configurado
    Given un umbral mínimo definido en vite.config.js (coverage.thresholds)
    When se introduce código nuevo sin tests que baja la cobertura por debajo del umbral
    And se ejecuta "npm run test:coverage"
    Then el comando termina con código de salida distinto de cero

  Scenario: El comando pasa si la cobertura cumple el umbral
    Given el código actual (getActiveWordIndex.js, usePrefersReducedMotion.js con sus tests existentes)
    When se ejecuta "npm run test:coverage"
    Then el comando termina con código de salida 0

  Scenario: make validate incluye el chequeo de cobertura como gate
    Given make validate está configurado para usar el script con cobertura en vez de "npm test" a secas
    When ejecuto "make validate" sobre código que no cumple el umbral
    Then el pipeline se detiene en ese paso, antes de llegar a build
```

## Definition of Done

- `coverage.thresholds` configurado en `vite.config.js` (lines/statements/branches/functions), calibrado contra
  la cobertura real actual del proyecto (no un número arbitrario).
- `make validate` (o un target dedicado) usa `test:coverage` en vez de `test` para que el umbral sea parte del
  gate, no un comando aparte que nadie corre.
- Verificado bajando el umbral artificialmente (o agregando código sin test) para confirmar que el comando
  efectivamente falla, y revertido después.

## Effort: S

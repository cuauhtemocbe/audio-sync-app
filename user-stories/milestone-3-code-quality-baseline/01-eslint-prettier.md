# Configurar ESLint y Prettier

## User Story

```
As mantenedor único de audio-sync-app
I want un linter y un formatter únicos con configuración explícita
In order to mantener un estilo de código consistente sin discutir formato en cada revisión manual
```

## Technical Context

- Hoy no hay `.eslintrc` ni `.prettierrc` en el repo.
- Proyecto React + Vite: `eslint-plugin-react-hooks` es relevante dado el uso extensivo de hooks en `App.jsx`
  (justamente el área de mayor riesgo, ver milestone 1).
- Es prerequisito conceptual de `make lint` ([M2-01](../milestone-2-developer-workflow/01-makefile-entrypoint.md))
  y de `make validate` ([M3-02](./02-script-validate.md)).

## Acceptance Criteria

```gherkin
Feature: Lint y formato consistente

  Scenario: Lint pasa sobre el código actual sin errores
    Given la configuración de ESLint está aplicada al proyecto
    When ejecuto "npm run lint"
    Then el proceso termina con código de salida 0

  Scenario: Lint detecta una violación de reglas de hooks
    Given un archivo con un hook de React llamado condicionalmente
    When ejecuto "npm run lint"
    Then el proceso termina con código de salida distinto de 0
    And el mensaje señala el archivo y la línea de la violación

  Scenario: Formato se puede verificar sin modificar archivos
    Given el código tiene un archivo mal formateado a propósito
    When ejecuto "npm run format:check"
    Then el proceso termina con código de salida distinto de 0
    And no se modifica ningún archivo

  Scenario: Formato se puede aplicar automáticamente
    Given el código tiene un archivo mal formateado
    When ejecuto "npm run format"
    Then el archivo queda formateado según la configuración
    And una corrida posterior de "npm run format:check" termina en código 0
```

## Definition of Done

- `.eslintrc.cjs` (o `eslint.config.js`) y `.prettierrc` versionados en la raíz.
- Scripts `lint`, `format` y `format:check` en `package.json`.
- Cero errores de lint sobre el código actual (`App.jsx`, `main.jsx`).

## Effort: S

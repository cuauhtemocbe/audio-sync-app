# Configurar Vitest y React Testing Library corriendo en Docker

## User Story

```
As mantenedor único de audio-sync-app
I want tener un entorno de test (Vitest + React Testing Library) corriendo dentro de Docker
In order to poder validar la lógica de sincronización antes de cada deploy sin depender solo de pruebas manuales
```

## Technical Context

- El proyecto usa Vite 5 + React 18 y hoy no tiene test runner configurado (`package.json` solo define `dev`,
  `build`, `preview`).
- Vitest es la elección natural: reutiliza la config de `vite.config.js` existente sin duplicar configuración.
- Los tests deben poder correr tanto dentro del contenedor de desarrollo (`docker-compose.dev.yml`, convención
  Docker-first) como localmente vía `npm test` (fallback documentado, no el camino principal).
- Dependencias nuevas (devDependencies): `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- Esta historia es prerequisito de [M1-02](./02-tests-activeWordIndex-sync.md).

## Acceptance Criteria

```gherkin
Feature: Entorno de testing configurado

  Scenario: Correr la suite de tests dentro de Docker
    Given el contenedor de desarrollo está construido con las dependencias de test instaladas
    When ejecuto "docker compose -f docker-compose.dev.yml run --rm audio-sync-app npm test"
    Then el proceso termina con código de salida 0
    And la salida indica al menos un test ejecutado

  Scenario: Correr la suite de tests localmente sin Docker (fallback)
    Given tengo las dependencias instaladas localmente con "npm install"
    When ejecuto "npm test"
    Then el proceso termina con código de salida 0

  Scenario: Un test que falla hace fallar la suite
    Given existe un test con una aserción falsa a propósito
    When ejecuto "npm test"
    Then el proceso termina con código de salida distinto de 0
    And la salida muestra el nombre del test fallido

  Scenario: El comando de test reporta cobertura en una ruta ya montada
    Given la suite de tests está configurada con cobertura habilitada
    When ejecuto "npm run test:coverage"
    Then se genera un reporte de cobertura en una ruta ya montada por el volumen de Docker (ej. "coverage/")
    And el reporte es visible en el host sin pasos de copiado adicionales
```

## Definition of Done

- Escenarios cubiertos por la ejecución real del comando (verificación de exit code), no solo revisión manual.
- `package.json` define los scripts `test` y `test:coverage`.
- `docker-compose.dev.yml` permite correr los tests sin instalar Node en el host.
- `vitest.config.js` (o sección `test` en `vite.config.js`) versionado.

## Effort: S

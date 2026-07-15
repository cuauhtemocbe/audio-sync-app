# Git hooks versionados y graduados por rama

## User Story

```
As mantenedor único de audio-sync-app
I want hooks de git versionados (Husky) que corran validaciones livianas en cada commit y completas antes de un push a main
In order to detectar errores antes de que lleguen a la rama principal sin pagar el costo de la validación completa en cada commit chico
```

## Technical Context

- No existe hoy `.githooks/` ni `.husky/`.
- Ecosistema JS/TS → usar Husky + script `prepare` (alternativa documentada en README sección 3), en vez del
  patrón `.githooks/` + Makefile pensado para otros ecosistemas.
- Sin CI hosteado (decisión de este backlog, ver `README.md` del backlog), el hook de `pre-push` hacia `main`
  cumple el rol que cumpliría branch protection + CI en un repo con equipo.
- Depende de [M2-01](./01-makefile-entrypoint.md) y de que exista `make validate` ([M3-02](../milestone-3-code-quality-baseline/02-script-validate.md)).

## Acceptance Criteria

```gherkin
Feature: Git hooks versionados con Husky

  Scenario: Husky se instala automáticamente al instalar dependencias
    Given clono el repo por primera vez
    When ejecuto "npm install"
    Then el script "prepare" configura los hooks de Husky en ".husky/"

  Scenario: Un commit en una rama de feature no corre validación pesada
    Given estoy en una rama distinta a main
    When hago "git commit"
    Then el hook de pre-commit corre solo lint sobre los archivos staged (lint-staged)
    And el commit se completa en pocos segundos

  Scenario: Un push hacia main corre la validación completa
    Given estoy en la rama main
    When hago "git push"
    Then el hook de pre-push ejecuta "make validate" (lint + test + build)
    And el push se aborta si algún paso falla

  Scenario: Un push hacia una rama de feature no corre la validación completa
    Given estoy en una rama distinta a main
    When hago "git push"
    Then el hook de pre-push no ejecuta "make validate"
    And el push se completa sin esperar el resultado de tests/build
```

## Definition of Done

- `.husky/pre-commit` y `.husky/pre-push` versionados en el repo.
- Script `prepare` en `package.json` (`"prepare": "husky || true"`).
- `lint-staged` configurado para correr solo sobre archivos modificados en el pre-commit.

## Effort: S

# Script de validación único (make validate)

## User Story

```
As mantenedor único de audio-sync-app
I want un único comando que agrupe lint + test + build
In order to correr la misma validación a mano o desde un git hook sin duplicar lógica
```

## Technical Context

- Depende de [M2-01](../milestone-2-developer-workflow/01-makefile-entrypoint.md) (Makefile),
  [M3-01](./01-eslint-prettier.md) (lint) y [M1-01](../milestone-1-testing-safety-net/01-configurar-vitest-en-docker.md) (test).
- Sustituye al CI hosteado para este perfil de proyecto — decisión explícita permitida por el README (sección 4,
  "CI hosteado es el default, no un requisito absoluto") dado que es un repo solo/de bajo tráfico.
- Es el comando que invoca el hook de `pre-push` de [M2-02](../milestone-2-developer-workflow/02-git-hooks-graduados.md).

## Acceptance Criteria

```gherkin
Feature: Script de validación único

  Scenario: make validate corre lint, test y build en orden
    Given el Makefile tiene un target "validate"
    When ejecuto "make validate"
    Then se ejecutan en orden "make lint", "make test" y "make build"
    And el comando termina con código de salida 0 si los tres pasan

  Scenario: make validate se detiene en el primer paso que falla
    Given el lint falla por una violación de reglas
    When ejecuto "make validate"
    Then el proceso se detiene después del paso de lint
    And no se ejecutan test ni build
    And el código de salida es distinto de 0

  Scenario: El hook de pre-push reutiliza make validate
    Given estoy en la rama main
    When el hook de pre-push se dispara
    Then invoca "make validate" en vez de repetir los comandos individuales
```

## Definition of Done

- Target `validate` en el `Makefile`.
- Reutilizado desde `.husky/pre-push` sin duplicar comandos.
- Documentado en `CLAUDE.md` como el comando a correr antes de un push a `main`.

## Effort: XS

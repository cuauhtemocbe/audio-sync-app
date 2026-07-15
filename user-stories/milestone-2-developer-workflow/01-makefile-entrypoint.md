# Makefile como interfaz única

## User Story

```
As mantenedor único de audio-sync-app
I want tener un Makefile autodocumentado que envuelva los comandos de Docker
In order to no memorizar flags de docker compose para cada tarea (dev, build, test, lint)
```

## Technical Context

- Hoy no existe `Makefile`; los comandos se corren directo con `docker compose` / `npm`.
- Sigue la convención del README (sección 2): `.DEFAULT_GOAL := help`, targets con comentario `## descripción`,
  target `help` listado vía `awk`.
- Targets que necesitan el servicio corriendo deben declarar la dependencia (ej. `test: up-d`).

## Acceptance Criteria

```gherkin
Feature: Makefile autodocumentado

  Scenario: Correr make sin argumentos muestra la ayuda
    Given estoy parado en la raíz del repo
    When ejecuto "make"
    Then se muestra la lista de targets disponibles con su descripción
    And no se ejecuta ningún build ni deploy

  Scenario: make dev levanta el entorno de desarrollo
    Given el Dockerfile.dev existe
    When ejecuto "make dev"
    Then se levanta el servicio de docker-compose.dev.yml
    And la app queda accesible en el puerto 5173

  Scenario: make test corre la suite de tests dentro de Docker
    Given la suite de tests de la historia M1-01 está configurada
    When ejecuto "make test"
    Then se ejecuta "npm test" dentro del contenedor
    And retorna código de salida 0 si todos los tests pasan

  Scenario: make test levanta el servicio si no está corriendo
    Given el target "test" depende del servicio de desarrollo
    When ejecuto "make test" sin haber levantado el servicio antes
    Then make lo levanta automáticamente antes de correr los tests
    And no falla por "conexión rechazada"

  Scenario: make build genera la imagen de producción
    Given el Dockerfile de producción existe
    When ejecuto "make build"
    Then se construye la imagen usando el Dockerfile de producción
    And el build termina con código de salida 0
```

## Definition of Done

- `Makefile` en la raíz del repo, `.DEFAULT_GOAL := help`.
- Cada target documentado con `## descripción` y listado por el target `help`.
- Targets `dev`, `test`, `build`, `lint` presentes (lint depende de la historia M3-01, puede quedar como
  placeholder hasta entonces).

## Effort: S

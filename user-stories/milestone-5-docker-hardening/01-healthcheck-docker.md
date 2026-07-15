# Healthcheck en la imagen y el compose de producción

## User Story

```
As mantenedor único de audio-sync-app
I want un HEALTHCHECK definido en el Dockerfile de producción y en docker-compose.prod.yml
In order to poder usar "docker compose up -d --wait" y no operar contra un contenedor que aún no está listo
```

## Technical Context

- El `Dockerfile` actual sirve estático vía `nginx` sin `HEALTHCHECK` ni endpoint `/health` dedicado.
- Al ser una SPA estática, chequear que `nginx` responde en `/` (sirviendo `index.html`) alcanza como healthcheck
  liviano — no hace falta un endpoint dedicado como en un backend con lógica.

## Acceptance Criteria

```gherkin
Feature: Healthcheck del contenedor de producción

  Scenario: El contenedor reporta healthy cuando nginx sirve contenido
    Given la imagen de producción está construida con HEALTHCHECK definido
    When levanto el contenedor y espero el intervalo de chequeo
    Then "docker inspect" reporta el estado del contenedor como "healthy"

  Scenario: docker compose up --wait espera a que el contenedor esté listo
    Given docker-compose.prod.yml define un healthcheck equivalente
    When ejecuto "docker compose -f docker-compose.prod.yml up -d --wait"
    Then el comando no retorna hasta que el contenedor esté healthy
    And retorna código de salida 0

  Scenario: El contenedor reporta unhealthy si nginx no responde
    Given el proceso de nginx dentro del contenedor se detiene
    When espero el siguiente intervalo de chequeo
    Then "docker inspect" reporta el estado del contenedor como "unhealthy"
```

## Definition of Done

- `HEALTHCHECK` en `Dockerfile` (stage final, nginx).
- `healthcheck:` equivalente en `docker-compose.prod.yml`.
- Verificado con `docker inspect --format='{{.State.Health.Status}}'`.

## Effort: XS

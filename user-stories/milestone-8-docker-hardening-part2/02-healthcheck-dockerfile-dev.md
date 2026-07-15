# Healthcheck en Dockerfile.dev

## User Story

```
As mantenedor único de audio-sync-app
I want un HEALTHCHECK definido en Dockerfile.dev
In order to poder usar "docker compose -f docker-compose.dev.yml up -d --wait" y no correr comandos (make test, make lint) contra un contenedor de dev que todavía no terminó "npm install" y no levantó el servidor de Vite
```

## Technical Context

- `Makefile` ya depende de `up-d` para `test`/`lint`/`coverage`, pero `up-d` solo espera a que el *contenedor*
  arranque, no a que Vite esté escuchando en `5173` — hoy esa carrera se cubre por casualidad (el `npm install`
  +arranque de Vite suele terminar antes de que se ejecute el siguiente comando `docker compose exec`), no por
  un mecanismo explícito.
- El milestone-5 ya agregó `HEALTHCHECK` al `Dockerfile` de producción (`wget --spider`), pero `Dockerfile.dev`
  quedó sin ninguno.
- La imagen `node:22` (Debian, no alpine) usada en `Dockerfile.dev` no garantiza tener `wget`/`curl`
  preinstalados. Una alternativa sin dependencias nuevas: usar el propio Node (`node -e "require('http')..."`)
  para el comando de chequeo, ya que Node está garantizado en esa imagen.

## Acceptance Criteria

```gherkin
Feature: Healthcheck del contenedor de desarrollo

  Scenario: El contenedor de dev reporta healthy cuando Vite sirve contenido
    Given el contenedor de desarrollo terminó "npm install" y Vite está escuchando en 5173
    When espero el intervalo de HEALTHCHECK
    Then "docker inspect" reporta el estado del contenedor como "healthy"

  Scenario: docker compose up --wait espera a que Vite esté listo
    Given docker-compose.dev.yml define un healthcheck equivalente
    When ejecuto "docker compose -f docker-compose.dev.yml up -d --wait"
    Then el comando no retorna hasta que el contenedor esté healthy

  Scenario: El contenedor reporta unhealthy si Vite no responde
    Given el proceso de Vite dentro del contenedor se detiene
    When espero el siguiente intervalo de chequeo
    Then "docker inspect" reporta el estado del contenedor como "unhealthy"
```

## Definition of Done

- `HEALTHCHECK` en `Dockerfile.dev` apuntando a `http://localhost:5173/` (sin agregar `curl`/`wget` si no están
  ya en la imagen — usar Node si hace falta).
- `healthcheck:` equivalente agregado a `docker-compose.dev.yml`.
- `make up-d`/`make dev` documentados como dependientes de este healthcheck si se decide encadenar `--wait`.
- Verificado con `docker inspect --format='{{.State.Health.Status}}'` en los tres escenarios de arriba.

## Effort: XS

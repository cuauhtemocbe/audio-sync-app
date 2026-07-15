# Puerto de nginx inyectado por variable de entorno

## User Story

```
As mantenedor único de audio-sync-app
I want que nginx escuche en el puerto indicado por la variable de entorno PORT (con un default si no se define)
In order to poder desplegar en Railway (que inyecta su propio PORT dinámico) sin que el contenedor quede escuchando en un puerto que la plataforma no espera
```

## Technical Context

- El `Dockerfile` de producción y `nginx.conf` (creados en milestone-5 para el usuario no-root) tienen el
  puerto **hardcodeado a 8080** (`listen 8080;`, `EXPOSE 8080`, `docker-compose.prod.yml` mapea `"8080:8080"`).
- `CLAUDE.md` documenta que el deploy es vía Railway (skill `use-railway`). Railway inyecta su propia variable
  `PORT` en runtime y espera que el contenedor escuche ahí — un puerto fijo en el Dockerfile no lo respeta.
- La imagen oficial `nginx:alpine` soporta templating de configuración vía `envsubst`: cualquier archivo en
  `/etc/nginx/templates/*.template` se procesa a `/etc/nginx/conf.d/*.conf` al arrancar el contenedor,
  sustituyendo variables de entorno presentes (`docker-entrypoint.sh` de la imagen ya lo hace automáticamente,
  sin pasos extra). Reemplazar la copia estática de `nginx.conf` por un template (`nginx.conf.template` con
  `listen ${PORT};`) resuelve esto sin agregar herramientas nuevas a la imagen.
- El `HEALTHCHECK` (milestone-5) también apunta a `http://127.0.0.1:8080/` hardcodeado — debe actualizarse para
  usar la misma variable.

## Acceptance Criteria

```gherkin
Feature: Puerto configurable vía variable de entorno

  Scenario: El contenedor escucha en el puerto default cuando no se define PORT
    Given la imagen de producción se ejecuta sin definir la variable PORT
    When consulto el puerto en el que nginx está escuchando dentro del contenedor
    Then nginx escucha en 8080 (el valor default)

  Scenario: El contenedor escucha en el puerto indicado por PORT
    Given la imagen de producción se ejecuta con PORT=3000
    When hago una petición HTTP a ese puerto
    Then la SPA responde 200

  Scenario: El healthcheck usa el mismo puerto que PORT
    Given el contenedor se ejecuta con PORT=3000
    When espero el intervalo de HEALTHCHECK
    Then docker inspect reporta el estado "healthy" (el healthcheck apunta al puerto configurado, no a 8080 fijo)
```

## Definition of Done

- `nginx.conf` reemplazado por un template procesado con `envsubst` (o mecanismo equivalente) que lee `PORT`.
- `Dockerfile` define `ENV PORT=8080` como default y el `HEALTHCHECK` usa esa misma variable.
- `docker-compose.prod.yml` actualizado para mapear el puerto vía `${PORT:-8080}` en vez de un valor fijo.
- Verificado con Docker real: sin `PORT` definido (default 8080) y con `PORT` distinto (ej. 3000), en ambos casos
  la SPA responde y el healthcheck sigue funcionando.
- Todos los escenarios Gherkin de esta historia tienen un test/verificación que los respalda.

## Effort: S

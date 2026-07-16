---
title: Milestone 8 — Endurecimiento de Docker (parte 2)
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#18, #19, #20"
---

# Milestone 8 — Endurecimiento de Docker (parte 2)

## Objective

Hacer el puerto de nginx configurable vía la variable de entorno `PORT` (requisito de Railway), agregar
`HEALTHCHECK` a `Dockerfile.dev` para que `make up-d --wait` no dispare tests contra un contenedor que todavía
no levantó Vite, y reducir la imagen de producción removiendo herramientas no usadas en runtime (`curl` y el
módulo `nginx-module-image-filter`) — lo que además resuelve por completo el issue #17 (CVEs HIGH de
c-ares/curl/libexpat), documentado como seguimiento en
[milestone-5-docker-hardening.md](./milestone-5-docker-hardening.md).

## Context

Historias de origen: [user-stories/milestone-8-docker-hardening-part2](../user-stories/milestone-8-docker-hardening-part2)
(issues #18, #19, #20). Depende de milestone 5 (mismo `Dockerfile`/`docker-compose.prod.yml` que endureció ese
milestone) pero es independiente de M1-M4, M6, M7.

Investigación previa a este spec (con Docker + Trivy reales, ver detalle en la sección Verificación del plan):

- `docker pull nginx:alpine` devuelve el mismo digest ya pineado en el `Dockerfile` — Alpine todavía no publicó
  los paquetes parcheados de c-ares (1.34.8-r0), curl (8.20.0-r0) ni libexpat (2.8.2-r0) mencionados en #17.
- `ldd $(which nginx)` dentro de la imagen confirma que el binario de nginx **no** enlaza contra `libcurl` (solo
  `libpcre2`, `libssl`, `libcrypto`, `libz`) — `curl` es una herramienta de conveniencia sin uso en runtime.
- `apk del curl` purga automáticamente sus dependencias huérfanas: `libcurl`, `c-ares`, `libpsl`,
  `nghttp2-libs`, `libidn2`, `libunistring` (7 paquetes).
- `libexpat` no viene de curl — viene de `nginx-module-image-filter` (vía `libgd` → `fontconfig`). Ese módulo
  está instalado por default en la imagen oficial pero **no está cargado** (`grep load_module` en
  `/etc/nginx/` no encuentra nada, y `nginx.conf` del proyecto no lo referencia).
- `apk del curl nginx-module-image-filter` purga 37 paquetes en total (toda la cadena de `libgd`: `libavif`,
  `fontconfig`, `freetype`, libs de X11, `libjpeg-turbo`, `libpng`, `libwebp`, `tiff`, etc.), reduce la imagen de
  ~55.6 MiB a ~32.0 MiB de paquetes instalados, y dejó **0 CVEs** de la lista original de #17 (`c-ares`, `curl`,
  `libcurl`, `libexpat` ya no están presentes). `nginx -v` y `wget` (usado por el `HEALTHCHECK`) siguen
  funcionando sin cambios.
- `gettext-envsubst` ya está instalado por default en `nginx:alpine` (el entrypoint oficial de la imagen ya
  procesa `/etc/nginx/templates/*.template` → `/etc/nginx/conf.d/*.conf` con `envsubst` automáticamente) — no
  hace falta agregar herramientas nuevas para resolver #18.

## Requirements

### Functional Requirements

- [ ] `nginx` escucha en el puerto indicado por `PORT`, con default `8080` si no se define.
- [ ] El `HEALTHCHECK` de producción usa el mismo puerto que `PORT` (no `8080` hardcodeado).
- [ ] `docker-compose.prod.yml` mapea el puerto del host vía `${PORT:-8080}`.
- [ ] `Dockerfile.dev` define un `HEALTHCHECK` que reporta `healthy` solo cuando Vite responde en `5173`, usando
      Node (`node -e`) en vez de `curl`/`wget` (no garantizados en la imagen `node:22`, Debian-based).
- [ ] `docker-compose.dev.yml` define un `healthcheck:` equivalente al del `Dockerfile.dev`.
- [ ] `make up-d` usa `--wait` para no retornar hasta que el contenedor de dev esté `healthy`.
- [ ] `curl` (y sus dependencias huérfanas: `libcurl`, `c-ares`, `libpsl`, `nghttp2-libs`, `libidn2`,
      `libunistring`) removidas del stage final del `Dockerfile` de producción.
- [ ] `nginx-module-image-filter` (y su cadena de dependencias vía `libgd`) removido del stage final — no está
      cargado por `nginx.conf`, así que no cambia el comportamiento en runtime.
- [ ] `wget` permanece disponible (lo usa el `HEALTHCHECK` de producción).

### Non-Functional Requirements

- [ ] Seguridad: `trivy image` sobre la imagen de producción reconstruida no reporta las CVEs HIGH de c-ares,
      curl, libcurl ni libexpat documentadas en #17.

## Architecture

### Components

- `nginx.conf` → renombrado a `nginx.conf.template`, con `listen ${PORT};` en vez de `listen 8080;`. La imagen
  base ya monta `/etc/nginx/templates/*.template` y corre `envsubst` sobre él en el entrypoint — no hace falta
  script propio.
- `Dockerfile` (producción):
  - `COPY nginx.conf /etc/nginx/conf.d/default.conf` → `COPY nginx.conf.template /etc/nginx/templates/default.conf.template`.
  - `ENV PORT=8080` (default).
  - `EXPOSE ${PORT}` (Docker resuelve `ARG`/`ENV` en `EXPOSE` en build-time con el default; ver riesgo en el plan).
  - `HEALTHCHECK` actualizado para usar `${PORT}` — como `HEALTHCHECK CMD` no expande variables de shell por
    default salvo que el `CMD` sea la forma shell (no exec array), se cambia a
    `CMD wget ... http://127.0.0.1:$PORT/ || exit 1` con la forma shell del `CMD`.
  - Nueva capa: `RUN apk del curl nginx-module-image-filter` después del `chown`/`touch` existentes.
- `docker-compose.prod.yml`: `ports: - "${PORT:-8080}:${PORT:-8080}"`.
- `Dockerfile.dev`: nuevo `HEALTHCHECK --interval=5s --timeout=3s --start-period=30s --retries=5 CMD node -e "require('http').get('http://127.0.0.1:5173/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"`.
  `start-period` generoso (30s) porque el contenedor corre `npm install` antes de levantar Vite.
- `docker-compose.dev.yml`: `healthcheck:` equivalente.
- `Makefile`: `up-d` agrega `--wait` a `docker compose ... up -d --build`.

## User Stories

- [#18 — Puerto de nginx inyectado por variable de entorno PORT](../user-stories/milestone-8-docker-hardening-part2/01-puerto-via-variable-de-entorno.md)
- [#19 — Healthcheck en Dockerfile.dev](../user-stories/milestone-8-docker-hardening-part2/02-healthcheck-dockerfile-dev.md)
- [#20 — Auditar y reducir la imagen nginx:alpine de producción](../user-stories/milestone-8-docker-hardening-part2/03-auditar-imagen-nginx.md)

## Testing Strategy

Verificación funcional con Docker real (no hay unit tests de Dockerfile/nginx.conf):

- `docker build` de la imagen de producción y de desarrollo.
- Producción sin `PORT` definido: nginx escucha en 8080, `docker inspect` reporta `healthy`, `curl`/`wget` al
  puerto expuesto responde 200.
- Producción con `PORT=3000`: nginx escucha en 3000 (no en 8080), healthcheck y HTTP responden ahí.
- `docker compose -f docker-compose.dev.yml up -d --wait`: retorna solo tras `healthy` (probar además que
  reporta `unhealthy` si se mata el proceso de Vite dentro del contenedor).
- `docker run --rm audio-sync-app:prod which curl`: falla (no existe).
- `docker run --rm audio-sync-app:prod which wget`: existe.
- `trivy image audio-sync-app:prod`: comparar conteo de CVEs HIGH contra el baseline de 8 documentado en #17.
- `make validate` completo en verde tras los cambios.

## Boundaries & Constraints

### In Scope

- Las tres historias (#18, #19, #20), implementadas juntas por tocar los mismos archivos (`Dockerfile`,
  `docker-compose.prod.yml`) o compartir motivación (`Dockerfile.dev`/`docker-compose.dev.yml`/`Makefile`).
- Resolución de #17 como efecto directo de #20 (documentado como seguimiento en el spec de milestone 5, no como
  un spec nuevo — la causa raíz y el fix son los mismos que #20).

### Out of Scope

- Remover los demás módulos dinámicos no cargados (`nginx-module-acme`, `nginx-module-geoip`,
  `nginx-module-njs`, `nginx-module-xslt`) — no aportan CVEs HIGH hoy (no forman parte del baseline de #17) y su
  remoción no la pide ninguna historia; si se quiere profundizar la reducción de superficie de ataque, es un
  issue nuevo a criterio del usuario.
- Dependabot u otro mecanismo automático de actualización del digest pineado — ya descartado en milestone 5.
- Cambiar el puerto de desarrollo (`5173`) a ser configurable — no lo pide ninguna historia; Vite en dev no
  corre en Railway.

## Success Criteria

- [x] Los 3 escenarios Gherkin de la US #18 pasan.
- [x] Los 3 escenarios Gherkin de la US #19 pasan.
- [x] Los 4 escenarios Gherkin de la US #20 pasan.
- [x] `trivy image` sobre la imagen de producción reconstruida ya no reporta las CVEs de c-ares/curl/libcurl/libexpat
      del baseline de #17 (issue #17 se cierra como resuelto, no como aceptado).
- [x] `make validate` en verde.

## Verificación (2026-07-15)

- **Reducción de imagen (#20)**: `RUN apk del curl nginx-module-image-filter` purga 37 paquetes (curl, libcurl,
  c-ares, libpsl, nghttp2-libs, libidn2, libunistring + toda la cadena de `libgd`/`fontconfig`/`libexpat` que
  arrastraba el módulo `image-filter` no usado). `docker run --rm ... which curl` falla (exit 1); `which wget`
  sigue presente; `nginx -v` funciona.
- **Puerto vía `PORT` (#18)**: encontrado y corregido un bug durante la verificación — el usuario `nginx`
  (non-root desde milestone 5) no tenía permiso de escritura sobre `/etc/nginx/conf.d/`, así que el script de
  entrypoint oficial (`20-envsubst-on-templates.sh`) fallaba silenciosamente (`ERROR: ... conf.d is not
  writable`) y nginx servía el `default.conf` de stock de la imagen base (`listen 80`, con comentarios de
  ejemplo sobre proxy a PHP/Apache) en vez de nuestro template. Fix: agregar `/etc/nginx/conf.d` al `chown`
  existente. Tras el fix: sin `PORT` definido, `listen 8080` y HTTP 200; con `PORT=3000`, `listen 3000` y HTTP
  200 en el puerto correcto; `docker inspect` reporta `healthy` en ambos casos.
- **Healthcheck en dev (#19)**: `docker compose -f docker-compose.dev.yml up -d --build --wait` no retornó hasta
  que el contenedor reportó `healthy` (esperó a que `npm install` + Vite terminaran de levantar, sin build cache
  tardó ~35s). Matar el proceso de Vite dentro del contenedor (`pkill -f vite`) hizo que `docker inspect`
  reportara `unhealthy` en el siguiente intervalo de chequeo.
- **Trivy final**: `trivy image --severity HIGH,CRITICAL audio-sync-app:prod` → **0 vulnerabilidades** (bajó de
  las 8 HIGH del baseline de #17 a 0). `trivy config Dockerfile` → 0 misconfiguraciones (sin regresión).
- **`make validate`**: lint → test → build → license-check, todo en verde.

## Implementation Plan

Ver [milestone-8-docker-hardening-part2-plan.md](./milestone-8-docker-hardening-part2-plan.md).

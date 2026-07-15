---
title: Milestone 5 — Endurecimiento de Docker
status: completed
created: 2026-07-15
updated: 2026-07-15
issue: "#9, #10, #11"
---

# Milestone 5 — Endurecimiento de Docker

## Objective

Endurecer la imagen de producción (`Dockerfile`, `docker-compose.prod.yml`): agregar `HEALTHCHECK`, correr
`nginx` como usuario sin privilegios, y pinear las imágenes base por digest `sha256` en vez de tags flotantes —
sin tocar `Dockerfile.dev`, cuya asimetría (sin pinear, para recibir parches automáticos) ya está documentada.

## Context

Historias de origen: [user-stories/milestone-5-docker-hardening](../user-stories/milestone-5-docker-hardening)
(issues #9, #10, #11). Independiente de M1-M4. Las tres historias tocan el mismo `Dockerfile` de producción, así
que se implementan juntas para minimizar rebuilds y evitar conflictos entre sí (ej. el usuario no-root necesita
permisos ajustados que interactúan con dónde escribe el healthcheck).

## Requirements

### Functional Requirements

- [x] `docker inspect` reporta `healthy` cuando `nginx` sirve contenido, `unhealthy` si el proceso se detiene.
- [x] `docker compose -f docker-compose.prod.yml up -d --wait` espera a que el contenedor esté `healthy` antes de
      retornar.
- [x] El proceso de `nginx` corre como usuario no-root (no UID 0) dentro del contenedor.
- [x] La SPA se sigue sirviendo correctamente sin errores de permisos tras el cambio de usuario.
- [x] `Dockerfile` (producción) referencia `node:20-alpine` y `nginx:alpine` por `@sha256:<digest>`.
- [x] `Dockerfile.dev` permanece sin pinear.

## Architecture

### Components

- `Dockerfile` — stage builder (`node:20-alpine@sha256:...`) sin cambios funcionales más allá del pin; stage
  final (`nginx:alpine@sha256:...`) con `HEALTHCHECK`, `addgroup`/`adduser` + `USER appuser`, y permisos
  ajustados en `/var/cache/nginx`, `/var/run` (o el `pid` path que corresponda) para que el usuario no-root
  pueda escribir donde nginx lo necesita.
- `docker-compose.prod.yml` — bloque `healthcheck:` equivalente al del Dockerfile.

## User Stories

- [#9 — Healthcheck en la imagen y el compose de producción](../user-stories/milestone-5-docker-hardening/01-healthcheck-docker.md)
- [#10 — Usuario no-root en la imagen de producción](../user-stories/milestone-5-docker-hardening/02-usuario-no-root-produccion.md)
- [#11 — Pinning de la imagen base por digest en producción](../user-stories/milestone-5-docker-hardening/03-pinning-digest-imagen-base.md)

## Testing Strategy

Verificación funcional con Docker real (no hay unit tests de Dockerfile):
- `docker build` de la imagen de producción.
- `docker inspect --format='{{.State.Health.Status}}'` tras levantar y tras matar el proceso de nginx.
- `docker compose -f docker-compose.prod.yml up -d --wait` mide que espera a `healthy`.
- Verificar usuario del proceso dentro del contenedor (`docker exec ... whoami` o `ps aux`).
- Acceso HTTP al puerto expuesto para confirmar que la SPA se sirve sin error 403/permission denied.
- `/trivy-scan` corrido después de los tres cambios, sin el hallazgo de "container running as root".

## Boundaries & Constraints

### In Scope
- Healthcheck, usuario no-root y pinning por digest — solo en el `Dockerfile` de producción y su compose.

### Out of Scope
- `Dockerfile.dev` — permanece sin pinear (asimetría ya documentada en `CLAUDE.md`/README de referencia).
- Endpoint `/health` dedicado — se usa `/` (sirviendo `index.html`) como chequeo liviano, suficiente para una SPA
  estática sin lógica de backend.
- Dependabot para actualizar el digest — mencionado en la US #11 pero es configuración de repositorio/CI, no de
  código; queda fuera de este milestone si no hay Dependabot ya configurado (ver tabla de descartes del backlog).

## Success Criteria

- [x] Los 3 escenarios Gherkin de la US #9 pasan.
- [x] Los 3 escenarios Gherkin de la US #10 pasan.
- [x] Los escenarios 1 y 2 de la US #11 pasan (el escenario 3, Dependabot, queda documentado como fuera de
      alcance salvo que ya exista Dependabot configurado).

## Verificación (2026-07-15)

- `docker build` de la imagen de producción: OK.
- `docker inspect --format='{{.State.Health.Status}}'`: `healthy` con nginx sirviendo; `unhealthy` tras congelar
  los worker processes con `SIGSTOP` (el healthcheck usa `wget --spider` con timeout de 3s).
- `docker compose -f docker-compose.prod.yml up -d --wait`: espera a `Healthy` y retorna 0 (~10s).
- `docker exec ... whoami` / `ps aux`: master y workers corren como `nginx` (uid 101), no root.
- `curl` al puerto expuesto (8080→8080, se cambió de 8080→80 porque nginx ahora escucha en 8080 sin
  privilegios): HTTP 200.
- `trivy config Dockerfile`: 0 misconfiguraciones (ya no aparece "running as root").
- `trivy image audio-sync-app:prod`: 30 CVEs (0 CRITICAL, 8 HIGH, 22 MEDIUM) en paquetes del SO base de
  `nginx:alpine` (`c-ares`, `curl`/`libcurl`, `libexpat`) — preexistentes en la imagen base, no introducidos por
  este cambio, y fuera del alcance de este milestone (que es hardening estructural, no parcheo de CVEs de la
  imagen base). Pendiente de decisión del usuario si se abre un issue nuevo para actualizarlas.

### Seguimiento: bump a node:22-alpine (2026-07-15)

A pedido del usuario, el stage `builder` pasó de `node:20-alpine` a `node:22-alpine@sha256:16e22a...`. Rebuild,
`make validate` y verificación HTTP/usuario no-root en verde. `trivy image` sigue reportando los mismos 30 CVEs
(0 CRITICAL, 8 HIGH, 22 MEDIUM): son esperables sin cambios, porque el build es multi-stage y el stage `builder`
se descarta — la imagen final es 100% `nginx:alpine`, que es donde están los paquetes vulnerables. Bumpear la
versión de Node no puede resolver CVEs de la capa de runtime de nginx.

## Implementation Plan

Ver [milestone-5-docker-hardening-plan.md](./milestone-5-docker-hardening-plan.md).

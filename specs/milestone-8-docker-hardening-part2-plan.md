# Implementation Plan: Milestone 8 — Endurecimiento de Docker (parte 2)

**Spec**: [milestone-8-docker-hardening-part2.md](./milestone-8-docker-hardening-part2.md)
**Created**: 2026-07-15
**Status**: approved

## Components

### 1. Puerto vía `PORT` (#18)
- **Purpose**: nginx escucha en el puerto que Railway inyecta en runtime.
- **Files**: `nginx.conf` → `nginx.conf.template`, `Dockerfile`, `docker-compose.prod.yml`.
- **Effort**: S

### 2. Healthcheck en `Dockerfile.dev` (#19)
- **Purpose**: `make up-d --wait` no retorna hasta que Vite esté sirviendo.
- **Files**: `Dockerfile.dev`, `docker-compose.dev.yml`, `Makefile`.
- **Effort**: XS

### 3. Reducción de imagen de producción (#20, resuelve #17)
- **Purpose**: remover `curl` y `nginx-module-image-filter` (no usados en runtime) del stage final; elimina las
  8 CVEs HIGH del baseline de #17 sin esperar a que Alpine publique parches.
- **Files**: `Dockerfile`.
- **Effort**: S

## Dependencies

### Build Order

1. Componente 3 (reducción de imagen) — modifica el mismo `Dockerfile` que el componente 1; se hace primero
   para que el diff final del `Dockerfile` sea legible en un solo repaso (menos reescritura de líneas
   adyacentes).
2. Componente 1 (puerto vía `PORT`) — sobre el `Dockerfile` ya reducido.
3. Componente 2 (healthcheck dev) — independiente, sin orden forzado respecto a 1/2, pero se hace al final por
   tocar archivos distintos (`Dockerfile.dev`, no `Dockerfile`).

### External Dependencies

Ninguna nueva — `gettext-envsubst` (para el templating de `nginx.conf.template`) ya viene instalado por default
en `nginx:alpine` y usado automáticamente por el entrypoint oficial de la imagen.

## Risks & Assumptions

### Risks

- **`EXPOSE ${PORT}` con `ENV PORT=8080`**: Docker sí resuelve variables `ENV` declaradas antes en `EXPOSE`
  (documentado oficialmente), así que `EXPOSE ${PORT}` debería expandir a `EXPOSE 8080` en build time. Mitigación
  si falla: dejar `EXPOSE 8080` fijo (es solo documentación/metadata en la imagen, no bloquea que nginx escuche
  en otro puerto en runtime — Railway no depende de `EXPOSE` para enrutar).
- **`HEALTHCHECK` con variable de entorno**: la forma exec (`CMD ["wget", ...]`) no expande `$PORT`; hay que
  usar la forma shell (`CMD wget ... || exit 1`, sin corchetes) para que el shell interpole la variable. Ya
  identificado en el spec, bajo riesgo de re-trabajo.
- **`apk del nginx-module-image-filter`**: confirmado con un `docker run` real que purga 37 paquetes sin romper
  `nginx -v` ni `wget`. Riesgo residual bajo: si en el futuro se necesitara el módulo `image_filter` (redimensionar
  imágenes on-the-fly), habría que revertir este `apk del` — documentado en Boundaries del spec como decisión
  consciente, no un descubrimiento post-hoc.
- **`--wait` en `make up-d`**: si el `start_period` del healthcheck de dev es muy corto, `up-d` podría fallar en
  máquinas lentas donde `npm install` tarda más de 30s. Mitigación: `start_period` generoso (30s) más
  `retries: 5` con `interval: 5s` (25s adicionales) = ~55s de margen total antes de reportar `unhealthy`.

### Assumptions

- Railway respeta el healthcheck de Docker/`docker-compose.prod.yml` o tiene su propio mecanismo — no se valida
  contra Railway real en este milestone (fuera de alcance, ver Boundaries del spec); la verificación es con
  Docker local únicamente.

## Milestones

- [ ] `docker build` de producción con el `Dockerfile` reducido (sin curl/image-filter) y verificación de CVEs.
- [ ] `docker build` + verificación con `PORT` default y `PORT=3000`.
- [ ] `docker compose -f docker-compose.dev.yml up -d --wait` verificado en los 3 escenarios de #19.
- [ ] `make validate` completo en verde.

## Tasks

### Foundation

- [ ] **Reducir imagen de producción**: agregar `RUN apk del curl nginx-module-image-filter` al stage final del
      `Dockerfile`, después del bloque `chown`/`touch` existente.
  - **Acceptance**: `which curl` falla dentro de la imagen; `which wget` sigue funcionando; `nginx -v` funciona;
    la SPA responde 200.
  - **Files**: `Dockerfile`.
  - **Tests**: `docker build`, `docker run --rm audio-sync-app:prod which curl` (falla), `which wget` (existe),
    `curl`/`wget` externo al puerto expuesto.
  - **Effort**: XS

### Features

- [ ] **Puerto configurable vía `PORT`**: renombrar `nginx.conf`→`nginx.conf.template` con `listen ${PORT};`,
      mover el `COPY` en el `Dockerfile` a `/etc/nginx/templates/default.conf.template`, agregar `ENV PORT=8080`,
      actualizar `HEALTHCHECK` a forma shell con `$PORT`, actualizar `docker-compose.prod.yml` para mapear
      `${PORT:-8080}:${PORT:-8080}`.
  - **Acceptance**: sin `PORT` definido nginx escucha en 8080; con `PORT=3000` escucha en 3000; healthcheck
    reporta `healthy` en ambos casos.
  - **Files**: `nginx.conf` (renombrado), `Dockerfile`, `docker-compose.prod.yml`.
  - **Tests**: los 3 escenarios Gherkin de #18 verificados con Docker real.
  - **Effort**: S

- [ ] **Healthcheck en `Dockerfile.dev`**: agregar `HEALTHCHECK` con `node -e` apuntando a `http://127.0.0.1:5173/`,
      `healthcheck:` equivalente en `docker-compose.dev.yml`, `--wait` en el target `up-d` del `Makefile`.
  - **Acceptance**: contenedor de dev reporta `healthy` cuando Vite sirve, `unhealthy` si se mata el proceso;
    `make up-d` no retorna hasta `healthy`.
  - **Files**: `Dockerfile.dev`, `docker-compose.dev.yml`, `Makefile`.
  - **Tests**: los 3 escenarios Gherkin de #19 verificados con Docker real.
  - **Effort**: XS

### Integration

- [ ] **Verificación final + `trivy image`**: reconstruir la imagen de producción completa (los 3 cambios
      aplicados), correr `trivy image` y confirmar que las CVEs HIGH del baseline de #17 (c-ares, curl,
      libcurl, libexpat) ya no aparecen. `make validate` completo.
  - **Acceptance**: `trivy image` sin esas CVEs; `make validate` en verde.
  - **Files**: N/A (verificación).
  - **Tests**: `trivy image audio-sync-app:prod`, `make validate`.
  - **Effort**: XS

## Effort Estimate

**Total**: S (todas las tareas ya XS/S, investigación de riesgo ya hecha antes de este plan — ver Context del
spec, probado con Docker/Trivy reales).

| Phase | Effort |
|-------|--------|
| Foundation | XS |
| Features | S + XS |
| Integration | XS |

# Implementation Plan: Milestone 5 — Endurecimiento de Docker

**Spec**: [milestone-5-docker-hardening.md](./milestone-5-docker-hardening.md)
**Created**: 2026-07-15
**Status**: completed

## Components

### 1. Healthcheck
- **Purpose**: Permitir `docker compose up -d --wait` y detectar un contenedor caído.
- **Files**: `Dockerfile`, `docker-compose.prod.yml`
- **Effort**: XS

### 2. Usuario no-root
- **Purpose**: Reducir el impacto de una eventual vulnerabilidad en el proceso de nginx.
- **Files**: `Dockerfile`
- **Effort**: S

### 3. Pinning por digest
- **Purpose**: Builds reproducibles, sin cambios inesperados en un rebuild.
- **Files**: `Dockerfile`
- **Effort**: XS

## Dependencies

### Build Order
1. Pinning por digest (componente 3) — primero, para no repetir el `docker build` de validación de los otros
   dos cambios con un tag flotante que puede cambiar entre pasos.
2. Usuario no-root (componente 2) — depende de tener la imagen base ya pineada; ajusta permisos de directorios.
3. Healthcheck (componente 1) — depende de 2, porque el healthcheck corre como el mismo usuario no-root y debe
   poder ejecutar el comando de chequeo sin permisos elevados.

### External Dependencies
- Ninguna nueva; usa `wget`/`curl` ya presentes en `nginx:alpine` para el comando de `HEALTHCHECK` (a confirmar
  cuál está disponible en la imagen al implementar).

## Risks & Assumptions

### Risks
- **El digest pineado queda desactualizado** — mitigado dejando `Dependabot`/actualización manual fuera de
  alcance explícito (ver Boundaries del spec) y documentando cómo re-resolver el digest
  (`docker pull <imagen>:<tag> && docker inspect --format='{{index .RepoDigests 0}}' <imagen>:<tag>`).
- **Permisos de `/var/cache/nginx` y `/var/run` mal ajustados rompen el arranque de nginx como no-root** —
  mitigado verificando con `docker logs` y acceso HTTP real antes de dar la tarea por completa, no solo con
  `docker build` exitoso.

### Assumptions
- La imagen `nginx:alpine` trae `wget` (para el comando de `HEALTHCHECK`); si no, se usa un fallback mínimo
  (ej. `nginx -t` no sirve como healthcheck de disponibilidad real, así que se prioriza `wget`/`curl` si están).

## Milestones

- [x] `docker build` de la imagen de producción exitoso con las tres capas de endurecimiento aplicadas
- [x] `docker inspect` reporta `healthy`/`unhealthy` correctamente
- [x] Proceso corre como usuario no-root y la SPA se sirve sin error de permisos
- [x] `/trivy-scan` sin el hallazgo de "running as root" (misconfig del Dockerfile en 0)

## Tasks

### Foundation (Build First)
- [x] **Task 1**: Resolver y pinear los digests de `node:20-alpine` y `nginx:alpine`
  - **Acceptance**: Ambos `FROM` en `Dockerfile` incluyen `@sha256:<digest>`; `docker build` sigue funcionando
  - **Files**: `Dockerfile`
  - **Effort**: XS

### Features (Build Second)
- [x] **Task 2**: Agregar usuario no-root en el stage final
  - **Acceptance**: Los 3 escenarios Gherkin de la US #10 pasan
  - **Files**: `Dockerfile`, `nginx.conf` (nuevo, listen 8080 en vez de 80 — puerto <1024 requiere root),
    `docker-compose.prod.yml` (mapeo de puerto actualizado a 8080:8080)
  - **Effort**: S

- [x] **Task 3**: Agregar `HEALTHCHECK` en `Dockerfile` y `healthcheck:` en `docker-compose.prod.yml`
  - **Acceptance**: Los 3 escenarios Gherkin de la US #9 pasan
  - **Files**: `Dockerfile`, `docker-compose.prod.yml`
  - **Effort**: XS

### Integration (Build Third)
- [x] **Task 4**: Verificación end-to-end con Docker real + `/trivy-scan`
  - **Acceptance**: `docker build`, `docker compose up -d --wait`, `docker inspect`, acceso HTTP y `/trivy-scan`
    todos en verde
  - **Files**: ninguno (verificación)
  - **Effort**: XS
  - **Nota**: el usuario no-root requirió cambiar el puerto de escucha de nginx de 80 a 8080 (no estaba en el
    plan original) porque bindear puertos <1024 requiere privilegios de root — ajuste necesario descubierto
    durante la implementación, no un cambio de alcance.

## Effort Estimate

**Total Estimated Days**: ~1 día

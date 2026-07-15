# Usuario no-root en la imagen de producción

## User Story

```
As mantenedor único de audio-sync-app
I want que el contenedor de producción corra como un usuario sin privilegios
In order to reducir el impacto de una eventual vulnerabilidad en el proceso de nginx
```

## Technical Context

- El `Dockerfile` de producción hoy usa la imagen `nginx:alpine` sin declarar un usuario no-root explícito
  (corre como root por default de la imagen base).
- Requiere ajustar permisos de los directorios de trabajo de nginx (`/var/cache/nginx`, `/var/run`) para que el
  usuario sin privilegios pueda escribir donde nginx lo necesita.

## Acceptance Criteria

```gherkin
Feature: Usuario no-root en producción

  Scenario: El proceso de nginx corre como usuario no-root
    Given la imagen de producción define un usuario appuser sin privilegios
    When inspecciono el proceso corriendo dentro del contenedor
    Then el usuario no es root ni UID 0

  Scenario: El contenedor sigue sirviendo el contenido correctamente
    Given el contenedor corre como usuario no-root
    When accedo al puerto expuesto
    Then la SPA se sirve correctamente sin errores de permisos

  Scenario: Trivy no reporta el hallazgo de "running as root"
    Given la imagen fue reconstruida con el usuario no-root
    When corro /trivy-scan sobre la imagen
    Then el hallazgo de configuración "container running as root" no aparece
```

## Definition of Done

- `addgroup`/`adduser` + `USER appuser` en el `Dockerfile` de producción.
- Permisos de los directorios de trabajo de nginx ajustados para el nuevo usuario.
- `/trivy-scan` corrido después del cambio, sin el hallazgo de root.

## Effort: S

# Pinning de la imagen base por digest en producción

## User Story

```
As mantenedor único de audio-sync-app
I want que el Dockerfile de producción referencie la imagen base por digest sha256 en vez de un tag flotante
In order to tener builds reproducibles byte a byte y no recibir cambios inesperados en un rebuild
```

## Technical Context

- `Dockerfile` (producción) usa hoy `node:20-alpine` y `nginx:alpine` como tags flotantes.
- `Dockerfile.dev` queda intencionalmente **sin** pinear (asimetría documentada explícitamente en el README,
  sección 1: en dev pesa más recibir parches de seguridad automáticos que la reproducibilidad exacta). Esta
  historia solo toca `Dockerfile` de producción.

## Acceptance Criteria

```gherkin
Feature: Pinning por digest en producción

  Scenario: El Dockerfile de producción referencia la imagen base por digest
    Given reviso el Dockerfile de producción
    When busco las instrucciones FROM
    Then tanto la imagen node:20-alpine como nginx:alpine incluyen "@sha256:<digest>"

  Scenario: Un rebuild con el mismo digest produce una imagen equivalente
    Given el Dockerfile está pineado por digest
    When reconstruyo la imagen dos veces sin cambiar el código fuente
    Then ambas imágenes usan exactamente la misma capa base

  Scenario: Dependabot puede seguir actualizando el digest
    Given se configura (o ya existe) Dependabot para el ecosistema docker
    When se publica una nueva versión de la imagen base
    Then Dependabot abre un PR actualizando el digest pineado
```

## Definition of Done

- `FROM ...@sha256:...` en ambas stages del `Dockerfile` de producción.
- `Dockerfile.dev` permanece sin pinear, con la asimetría documentada en `CLAUDE.md`.

## Effort: XS

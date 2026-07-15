# Auditar y reducir la imagen nginx:alpine de producción

## User Story

```
As mantenedor único de audio-sync-app
I want remover de la imagen de producción las herramientas que la imagen base trae por default pero que el contenedor no usa en runtime
In order to reducir la superficie de ataque y la cantidad de CVEs que Trivy reporta sobre binarios que ni siquiera se ejecutan
```

## Technical Context

- Issue #17 (abierta) documenta que `trivy image` sobre `audio-sync-app:prod` reporta 30 CVEs (0 CRITICAL,
  8 HIGH, 22 MEDIUM), concentrados en `c-ares`, `curl`/`libcurl` y `libexpat` — paquetes que vienen bundled en
  `nginx:alpine` por default.
- `curl` (y su dependencia `c-ares`/`libcurl`) **no lo usa el contenedor en runtime**: nginx sirve archivos
  estáticos sin invocar `curl` para nada. Es una herramienta de conveniencia para debug manual (`docker exec ...
  curl ...`), no una dependencia funcional. Removerla con `apk del curl` en el stage final elimina de un saque
  la mayoría de esos CVEs.
- **Cuidado**: el `HEALTHCHECK` (milestone-5, y la historia de puerto vía `PORT`) usa `wget --spider`, no
  `curl` — `wget` debe quedar intacto. Verificar que no hay otro uso interno de `curl`/`libcurl` antes de
  removerlo (ej. algún módulo de nginx compilado con soporte de curl, poco común pero a confirmar con
  `ldd $(which nginx)` o equivalente).
- `libexpat` puede venir de una dependencia distinta (parsing XML) — investigar de qué paquete depende
  (`apk info --who-owns` sobre el binario que la usa) antes de intentar removerla, puede no ser tan trivial
  como `curl`.

## Acceptance Criteria

```gherkin
Feature: Imagen de producción reducida

  Scenario: curl ya no está presente en la imagen final
    Given la imagen de producción fue reconstruida sin curl
    When ejecuto "docker run --rm audio-sync-app:prod which curl"
    Then el comando falla porque curl no existe

  Scenario: La SPA se sigue sirviendo correctamente sin curl
    Given la imagen de producción sin curl
    When levanto el contenedor y accedo al puerto expuesto
    Then la SPA responde 200 igual que antes

  Scenario: El healthcheck sigue funcionando sin curl
    Given la imagen de producción sin curl (que usa wget para el healthcheck)
    When espero el intervalo de HEALTHCHECK
    Then "docker inspect" reporta "healthy"

  Scenario: Trivy reporta menos CVEs de severidad HIGH que el baseline
    Given el baseline documentado en el issue #17 (8 HIGH)
    When corro "trivy image" sobre la imagen reconstruida
    Then el número de CVEs HIGH es menor al baseline
```

## Definition of Done

- `curl` (y cualquier otra herramienta confirmada como no usada en runtime) removida del stage final del
  `Dockerfile` de producción.
- `wget` (usado por el `HEALTHCHECK`) explícitamente preservado.
- `trivy image` corrido antes/después, con el conteo de CVEs por severidad documentado en el issue #17 o en
  `specs/` como seguimiento.
- Verificado con Docker real que la SPA y el healthcheck siguen funcionando tras el cambio.

## Effort: S

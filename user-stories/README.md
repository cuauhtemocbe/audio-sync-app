# Backlog — audio-sync-app

Backlog técnico para llevar `audio-sync-app` al estándar personal descrito en
[`/home/kuautli/Projects/README.md`](/home/kuautli/Projects/README.md), adaptado con criterio al tamaño real de
este proyecto (SPA de un solo desarrollador, sin backend, sin equipo revisando PRs en paralelo).

No se aplica el checklist íntegro: se descartan explícitamente los puntos que serían sobre-ingeniería para este
alcance (arquitectura hexagonal por capas, CI hosteado con jobs paralelos, cobertura diferenciada por capa,
secret manager externo). Ver la columna **Descartado** en cada milestone cuando aplica.

## Persona

| Atributo | Valor |
| --- | --- |
| Rol | Mantenedor único de `audio-sync-app` |
| Contexto | Desarrolla y despliega en solitario, sin CI hosteado, vía Railway |
| Objetivo | Poder mergear y deployar un cambio con confianza, sin re-verificar todo a mano cada vez |
| Dolor actual | Cada cambio de UI se prueba manualmente en el navegador (seek, pausa, fin de audio); no hay red de seguridad automatizada que detecte una regresión en `activeWordIndex` antes de deployar |

## Milestones

| # | Milestone | Objetivo | Historias |
| --- | --- | --- | --- |
| 1 | [Red de seguridad de testing](./milestone-1-testing-safety-net) | Cubrir con tests automatizados el área de mayor riesgo (`activeWordIndex`), ya señalada como tal en `CLAUDE.md` | 2 |
| 2 | [Flujo de trabajo del desarrollador](./milestone-2-developer-workflow) | `Makefile` como interfaz única + git hooks versionados y graduados por rama | 2 |
| 3 | [Baseline de calidad de código](./milestone-3-code-quality-baseline) | Lint/format explícito + script de validación único reutilizable | 2 |
| 4 | [Seguridad y secretos](./milestone-4-security-secrets) | Secret scanning en pre-commit + verificar que la config de SonarQube apunta al proyecto correcto | 2 |
| 5 | [Endurecimiento de Docker](./milestone-5-docker-hardening) | Healthcheck, usuario no-root y pinning por digest en la imagen de producción | 3 |
| 6 | [Documentación y gobernanza](./milestone-6-documentation-governance) | `CHANGELOG.md`, `LICENSE` y tabla de design tokens con autocrítica | 3 |
| 7 | [Accesibilidad](./milestone-7-accessibility) | Respetar `prefers-reduced-motion` en las animaciones de resaltado de palabra | 1 |

**Total: 15 historias.**

## Orden y dependencias

- **M1** es independiente y de mayor prioridad: cubre el riesgo que el propio `CLAUDE.md` ya señala.
- **M2** habilita `make validate` como comando único; **M3** depende de que el `Makefile` de M2 exista para
  cablear el script de validación ahí.
- **M4**, **M5**, **M6** y **M7** son independientes entre sí y pueden intercalarse según disponibilidad.

## Definition of Done (global, aplica a todas las historias)

- Todos los escenarios Gherkin de la historia tienen un test automatizado que los respalda y que falla si el
  comportamiento se rompe.
- `make lint` y `make test` en verde (a partir de que M2/M3 existen — las historias que introducen esas
  herramientas usan su propio DoD mientras tanto).
- Cambios probados manualmente en el navegador siguiendo el checklist de `CLAUDE.md` cuando la historia toca
  sincronización audio/texto.
- Sin secretos ni tokens en el diff (`git diff` revisado antes de commitear).

## Explícitamente descartado del checklist de README.md para este proyecto

| Punto del checklist | Por qué no aplica acá |
| --- | --- |
| CI hosteado (GitHub Actions con jobs paralelos) | Repo solo/bajo tráfico — el propio README.md lo permite sustituir por script de validación local + git hooks graduados (ver M2/M3) |
| Arquitectura por capas (`api/domain/services/infrastructure`) | Proyecto de un solo módulo, ya documentado como excepción KISS explícita en `CLAUDE.md` |
| Cobertura diferenciada por capa/riesgo | No hay capas distintas que diferenciar; un único target de cobertura sobre `activeWordIndex` alcanza |
| Secret manager externo (Vault, Doppler) | `.env`/`.mcp.json` gitignorados ya cubre la necesidad actual; migrar solo si el proyecto gana colaboradores o datos sensibles |
| Dependabot | Sin CI hosteado que lo consuma; revisar manualmente `npm outdated` es suficiente a este volumen |

# CLAUDE.md

Guía de instrucciones para Claude Code al trabajar en este repositorio.

---

## Sobre el proyecto

**audio-sync-app** es una SPA en React + Vite que resalta palabra por palabra el texto de una transcripción sincronizada con la reproducción de un audio (`public/daily_job.mp3` + `src/aligned_transcript.json`). Sin backend: es un proyecto pequeño de un solo desarrollador, pero desde 2026-07-15 ya tiene suite de tests, lint/format y un backlog en GitHub Issues.

**Stack:**
- React 18 + Vite 5
- Tailwind CSS
- Vitest + React Testing Library (tests)
- ESLint + Prettier (lint/format)
- Husky + lint-staged (git hooks)
- Docker (`Dockerfile` para producción con nginx, `Dockerfile.dev` para desarrollo)
- Despliegue vía Railway

**Backlog**: hay un backlog de historias de usuario en `user-stories/` (7 milestones) que adopta de forma pragmática los lineamientos de `/home/kuautli/Projects/README.md` (estándar personal de buenas prácticas), publicado como GitHub Issues con milestones nativos. Milestones 1-3 (testing, Makefile/git hooks, lint) ya están implementados — ver `specs/milestone-{1,2,3}-*.md` para el spec+plan de cada uno. Milestones 4-7 (secret scanning, Docker hardening, CHANGELOG/LICENSE, accesibilidad) siguen abiertos como issues #7-#15.

---

## Skills disponibles

- **`/commit-writer`**: genera commits siguiendo conventional commits.
- **`/testing`**: guía TDD para tests nuevos (la suite base con Vitest ya existe, ver sección Testing).
- **`/user-stories`**: escribir/gestionar historias de usuario y el backlog en GitHub Issues.
- **`/sonar-check`**: análisis de calidad de código con SonarQube, si se configura.
- **`/trivy-scan`**: escaneo de seguridad (dependencias, secretos, IaC) — útil dado que hay Dockerfiles.
- **`use-railway`**: gestión de infraestructura en Railway (deploy, variables, dominios, logs).
- **`engram:memory`**: memoria persistente entre sesiones — proactiva, no esperar a que se pida.

Usá estas skills de forma proactiva cuando el trabajo lo amerite, sin forzar procesos pesados en un proyecto de este tamaño. `spec-driven-dev` se usó puntualmente para implementar el backlog de adopción del README — no hace falta repetir ese ceremonial completo (spec+plan+tasks con gates) para un bugfix o feature chica del día a día; para eso alcanza el flujo de abajo.

---

## Flujo de trabajo recomendado

Para un bugfix o feature chica del día a día, este proyecto **no** exige spec-driven development completo (spec+plan+tasks con gates) — es demasiado pequeño para justificar ese overhead en cada cambio. El flujo normal es:

1. Implementar el cambio directamente (feature o fix).
2. Correr `make validate` (o dejar que los git hooks lo hagan, ver abajo) — lint + test + build.
3. Probar manualmente en el navegador (`make dev`, puerto 5173) que el audio sincroniza bien con el resaltado de palabras — los tests cubren `getActiveWordIndex` pero no reemplazan la prueba visual.
4. Si el cambio toca dependencias o Dockerfiles, correr `/trivy-scan`.
5. Commitear con `/commit-writer` (el pre-commit de Husky corre lint sobre los archivos staged automáticamente).
6. Si aplica, deployar con la skill `use-railway`.

### Makefile como interfaz única

Todos los comandos de desarrollo pasan por `make` (correr `make` sin argumentos lista los targets disponibles):

| Target | Qué hace |
| --- | --- |
| `make dev` | Levanta el entorno de desarrollo en Docker (puerto 5173) |
| `make test` | Corre la suite de Vitest dentro de Docker (levanta el servicio si hace falta) |
| `make coverage` | Genera el reporte de cobertura en `coverage/` |
| `make lint` | Corre ESLint dentro de Docker |
| `make build` | Construye la imagen de producción |
| `make validate` | Corre `lint → test → build` en orden, se detiene en el primer paso que falla |

### Git hooks (Husky)

- **pre-commit**: corre `lint-staged` (ESLint `--fix` sobre los archivos `.js`/`.jsx` staged) — rápido, pensado para cualquier rama.
- **pre-push**: corre `make validate` completo **solo si la rama actual es `main`** — un push a una rama de feature no paga ese costo.

### Antes de dar por terminado un cambio de UI

Arrancar el servidor de dev (`make dev`) y probar la feature en el navegador manualmente (golden path + casos borde: seek manual, pausa, palabras sin timestamp, fin del audio). Los tests automatizados cubren la lógica de `getActiveWordIndex`, pero no sustituyen esta verificación visual.

---

## Arquitectura y convenciones

- **Todo vive en `src/`**: no hay separación por capas (`App.jsx`, `main.jsx`, `index.css`, `aligned_transcript.json`). No introducir estructura de carpetas compleja (`domain/`, `infrastructure/`, etc.) — no se justifica para el tamaño actual del proyecto.
- **Componentes funcionales con hooks**, sin clases.
- **Tailwind** para todo el estilado; evitar CSS custom salvo lo mínimo en `index.css`.
- **KISS**: preferir funciones simples y directas antes que abstracciones. Este es un proyecto chico — no over-engineer.
- **Lógica de negocio pura separada de la presentación cuando hay riesgo de bugs sutiles**: `getActiveWordIndex(words, currentTime)` (`src/getActiveWordIndex.js`) se extrajo de `App.jsx` específicamente para poder testearla sin montar el componente. No es una regla general de "todo a funciones puras" — es la excepción para el área de mayor riesgo (sincronización audio/texto), no un patrón a repetir en cada función.
- **Tests colocados junto al archivo que cubren** (`getActiveWordIndex.js` + `getActiveWordIndex.test.js` en la misma carpeta), no un árbol `tests/` separado.
- **ESLint plano (`eslint.config.js`, flat config)** con `eslint-plugin-react-hooks` — no usar `.eslintrc.*` (ESLint 10 solo soporta flat config).
- **Prettier**: single quotes, sin semicolons, `printWidth: 100` (ver `.prettierrc`). `.prettierignore` excluye `aligned_transcript.json` (es un dato, no código) y `package-lock.json`.
- El transcript (`aligned_transcript.json`) sigue el formato de salida de Rev.ai (`monologues[].elements[]`, cada elemento con `type`, `value`, `ts`).
- **`node_modules/` NO está trackeado en git** (se destrackeó el 2026-07-15: estaba trackeado desde antes de que existiera el `.gitignore`, y provocó que `lint-staged` perdiera cambios sin commitear dos veces al tropezar con un archivo `root`-owned dentro del árbol — detalle completo en la memoria de Engram `node-modules-tracked-bug`). No volver a hacer `git add -f node_modules` ni sacarlo de `.gitignore`.

---

## Docker y despliegue

- `docker-compose.dev.yml` levanta el entorno de desarrollo con hot reload en el puerto `5173`.
- `docker-compose.prod.yml` sirve el build de producción vía nginx en el puerto `8080`.
- Si se modifican Dockerfiles o dependencias, correr `/trivy-scan` para detectar vulnerabilidades o secretos antes de commitear.
- Para deploy, provisioning o variables de entorno en Railway, usar la skill `use-railway`.

---

## Seguridad y secretos

- **Secret scanning en pre-commit**: `.husky/pre-commit` corre `gitleaks protect --staged` (vía la imagen oficial
  `zricethezav/gitleaks`, sin instalar el binario en el host) antes de `lint-staged`. Es una segunda barrera —
  `.mcp.json` y `.claude/` ya están gitignoreados y verificados, esto cubre el caso de un archivo que se
  gitignoree mal. Verificado el 2026-07-15: `gitleaks detect` sobre todo el historial no encontró leaks, y un
  token sintético estilo SonarQube (`squ_...`) fue detectado y bloqueado correctamente (regla
  `sonar-api-token`). Si aparece un falso positivo real, se documenta en `.gitleaks.toml` (no existe hoy porque
  no hizo falta).
- **`SONARQUBE_PROJECT_KEY` en `.mcp.json` (`"audio-sync-app"`) NO corresponde a un proyecto real** — verificado
  el 2026-07-15 contra el servidor (`get_project_quality_gate_status` devuelve 404, y
  `search_my_sonarqube_projects` lista otros 4 proyectos, ninguno `audio-sync-app`). El key quedó copiado de una
  plantilla de referencia y el proyecto nunca se creó en el servidor. **Pendiente**: crear el proyecto
  `audio-sync-app` en la instancia de SonarQube (acción de administración fuera del alcance de este repo) antes
  de confiar en `/sonar-check` o en cualquier tool de `mcp__sonarqube__*` para este proyecto.

---

## Testing

- **Vitest + jsdom** configurado en `vite.config.js` (sección `test`), con `@testing-library/react` y `@testing-library/jest-dom` disponibles para tests de componente futuros (hoy los tests son de la función pura, no de renderizado).
- **Correr los tests**: `make test` (dentro de Docker, levanta el servicio si hace falta) o `npm test` en local. Cobertura con `make coverage` / `npm run test:coverage` — el reporte queda en `coverage/` (ya montado en `docker-compose.dev.yml`, visible en el host sin copiar).
- **Cobertura actual**: `src/getActiveWordIndex.js` (la lógica de sincronización, el área de mayor riesgo de bugs sutiles — off-by-one en timestamps, palabras sin `ts`, seek, fin de audio) tiene 9 tests cubriendo los casos ZOMBIES. El resto de `App.jsx` (rendering, efectos) no tiene tests todavía.
- Al agregar tests nuevos, usar la skill `/testing` para la estrategia y seguir la convención de tests colocados junto al archivo (`Componente.jsx` + `Componente.test.jsx`).
- No agregar un framework de testing pesado ni mutation testing para un proyecto de este tamaño salvo que el usuario lo pida explícitamente.

---

## Memoria (Engram)

Guardar proactivamente con `mem_save` cuando:
- Se tome una decisión de diseño o arquitectura (ej. cómo manejar el parseo del transcript).
- Se resuelva un bug no obvio (ej. desincronización de audio/texto).
- Se configure algo no trivial de Docker o Railway.
- Se establezca una convención nueva.

Al iniciar sesión o tras una compactación, llamar `mem_context` para recuperar el estado.

---

## Adaptar este archivo

El proyecto ya creció una vez (2026-07-15: se agregaron tests, lint, Makefile, git hooks y un backlog en GitHub Issues) y este archivo se actualizó para reflejarlo. Si vuelve a crecer (se agrega backend, más milestones del backlog, un flujo de trabajo distinto), actualizar este `CLAUDE.md` de nuevo. Evitar imponer proceso adicional (arquitectura por capas, CI hosteado, cobertura diferenciada por capa) que no aporta valor al tamaño actual — ver `user-stories/README.md` para el detalle de qué se descartó del checklist de buenas prácticas y por qué.

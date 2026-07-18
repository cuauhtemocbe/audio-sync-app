# CLAUDE.md

Guía de instrucciones para Claude Code al trabajar en este repositorio.

---

## Sobre el proyecto

**audio-sync-app** es una SPA en React + Vite que resalta palabra por palabra el texto de una transcripción sincronizada con la reproducción de un audio (`public/daily_job.mp3` + `src/aligned_transcript.json`). Sin backend: es un proyecto pequeño de un solo desarrollador, pero desde 2026-07-15 ya tiene suite de tests, lint/format y un backlog en GitHub Issues.

**Stack:**
- React 18 + Vite 5
- Tailwind CSS
- pnpm (gestor de paquetes, ver nota abajo)
- Vitest + React Testing Library (tests)
- ESLint + Prettier (lint/format)
- Husky + lint-staged (git hooks)
- Docker (`Dockerfile` para producción con nginx, `Dockerfile.dev` para desarrollo)
- Despliegue vía Railway

**Backlog**: el proyecto tuvo un backlog de historias de usuario (11 milestones) que adoptó de forma pragmática los lineamientos de `/home/kuautli/Projects/README.md` (estándar personal de buenas prácticas), publicado como GitHub Issues con milestones nativos. **Los 11 milestones (26 issues) están implementados y cerrados en GitHub a 2026-07-16** — ver `specs/milestone-{1..11}-*.md` para el spec+plan de cada uno. La carpeta `user-stories/` (borrador previo a la publicación en GitHub Issues) se eliminó del repo el 2026-07-16 una vez que el backlog quedó completo — GitHub Issues es la fuente de verdad, no hace falta duplicarla en el repo. La issue #16 (crear el proyecto `audio-sync-app` en el servidor de SonarQube) se resolvió corriendo el scanner manualmente, que auto-creó el proyecto en la instancia Community Edition — ver la sección de Seguridad más abajo. La única historia descartada (no implementada a propósito) es la #21 (`.env.example`), cerrada como won't-do por decisión del usuario.

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
3. Probar manualmente en el navegador (ver "Antes de dar por terminado un cambio de UI" más abajo).
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
| `make lock-check` | Verifica que `pnpm-lock.yaml` esté sincronizado con `package.json` (`pnpm install --frozen-lockfile`) |
| `make license-check` | Verifica que exista el archivo `LICENSE` |
| `make build` | Construye la imagen de producción |
| `make validate` | Corre `lock-check → lint → coverage → build → license-check` en orden, se detiene en el primer paso que falla |

CI (`.github/workflows/ci.yml`) corre cada uno de estos targets como job independiente y paralelo sobre
PRs/pushes a `main` — no duplica la lógica, solo invoca `make <target>` (ver "Adaptar este archivo" para
el porqué de tener CI hosteada ahora).

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
- **Prettier**: single quotes, sin semicolons, `printWidth: 100` (ver `.prettierrc`). `.prettierignore` excluye `aligned_transcript.json` (es un dato, no código) y `pnpm-lock.yaml`.
- El transcript (`aligned_transcript.json`) sigue el formato de salida de Rev.ai (`monologues[].elements[]`, cada elemento con `type`, `value`, `ts`).
- **`node_modules/` NO está trackeado en git** (se destrackeó el 2026-07-15: estaba trackeado desde antes de que existiera el `.gitignore`, y provocó que `lint-staged` perdiera cambios sin commitear dos veces al tropezar con un archivo `root`-owned dentro del árbol — detalle completo en la memoria de Engram `node-modules-tracked-bug`). No volver a hacer `git add -f node_modules` ni sacarlo de `.gitignore`.
- **pnpm en vez de npm** (migrado 2026-07-18): `package.json` fija la versión exacta con `"packageManager": "pnpm@11.14.0"`, activada vía `corepack enable && corepack prepare pnpm@11.14.0 --activate` en ambos Dockerfiles — no asumir `npm install`/`npm test` en comandos nuevos, es `pnpm install`/`pnpm test`. El lockfile es `pnpm-lock.yaml` (reemplazó a `package-lock.json`, que ya no existe). `pnpm-workspace.yaml` tiene `allowBuilds: { esbuild: true }` — pnpm 11 bloquea por defecto los postinstall scripts de dependencias no listadas ahí; si una dependencia nueva necesita un build script, hay que agregarla explícitamente a esa allowlist, no aprobarla a ciegas.

### Design tokens (paleta VU-meter)

Desde milestone-11 (issue #24), la paleta está definida como tema custom en `tailwind.config.js`
(`theme.extend.colors.vu`), no como clases default de Tailwind. Tabla verificada contra el código real el
2026-07-15:

| Token | Clase Tailwind | Hex | Uso |
| --- | --- | --- | --- |
| Fondo | `bg-vu-housing` | `#0d1410` | Fondo de toda la app |
| Texto base | `text-vu-scale` | `#d7e4d8` | Título, palabras inactivas |
| Acento activo (subrayado) | `decoration-vu-peak` | `#ff5a36` | Subrayado de la palabra activa |
| Acento activo (texto) | `text-vu-peak` | `#ff5a36` | Color de la palabra activa |
| Texto secundario | `text-vu-dial` | `#8fa190` | Indicador de tiempo actual |

**Por qué esta paleta y no una alternativa genérica**: el concepto de diseño es el **VU-meter** — el medidor de
nivel analógico usado en producción de radio/podcast para monitorear voz grabada, el dominio literal de esta
app (audio hablado + transcripción sincronizada). El estado de reposo (nada resaltado) es la zona segura del
medidor (`vu-housing`/`vu-scale`); la palabra activa es la aguja llegando al pico (`vu-peak`, la zona roja). Se
descartaron dos paletas genéricas antes de llegar a esta: (1) *cream + serif + terracota* — fondo claro,
contradice la razón ya documentada de mantener un tema oscuro para sesiones de lectura largas; (2) *casi-negro +
acento neón único* (verde ácido u otro) — aunque es oscuro, es el cliché de "modo terminal/hacker", sin ninguna
relación específica con audio: el mismo acento serviría para cualquier IDE o dashboard. La paleta VU-meter, en
cambio, es una decisión de producto trazable a un artefacto real del dominio, no un ajuste cosmético aislado.

### Tipografía por función

Desde milestone-11 (issue #26), `tailwind.config.js` define `theme.extend.fontFamily` con tres roles, cargados
vía `@import` de Google Fonts en `src/index.css`:

| Rol | Clase Tailwind | Familia | Uso |
| --- | --- | --- | --- |
| Display | `font-display` | Space Grotesk (600/700) | `<h1>` únicamente |
| Body | `font-body` | Inter | Palabras del transcript |
| Mono | `font-mono` | IBM Plex Mono | Indicador de tiempo (dígitos de ancho fijo, no "saltan" al actualizarse 10x/seg) |

### Ícono de marca

Desde milestone-11 (issue #25), `public/favicon.svg` es un ícono propio (ya no el SVG de stock de svgrepo.com):
cuatro barras verticales tipo ecualizador/waveform, la de mayor altura (posición de "pico") en `vu-peak` con un
trazo horizontal corto debajo — el mismo lenguaje visual del subrayado de la palabra activa en la UI. El mismo
ícono se reutiliza inline en el `<h1>` de `src/App.jsx` (reemplaza el emoji 🎧 anterior) — un solo asset, dos
usos, sin decoración adicional en el resto de la UI.

---

## Docker y despliegue

- `docker-compose.dev.yml` levanta el entorno de desarrollo con hot reload en el puerto `5173`.
- `docker-compose.prod.yml` sirve el build de producción vía nginx en el puerto `8080`.
- **Ambos Dockerfiles usan `node:26-alpine`** (migrado 2026-07-18 desde `node:22`/`node:22-alpine`). `Dockerfile` (producción) lo pinea por digest; `Dockerfile.dev` usa el tag flotante a propósito (misma asimetría documentada en `development-standards.md` — parches de seguridad automáticos en dev pesan más que reproducibilidad exacta ahí).
- **pnpm se instala con `npm install -g pnpm@11.14.0`, nunca con `corepack prepare`**, en ambos Dockerfiles. Corepack resuelve la versión pineada vía el paquete `@pnpm/exe`, que solo publica binarios linkeados contra glibc — en la base Alpine (musl) la instalación se rompe en silencio. `npm install -g` no tiene ese problema en ninguna libc.
- **`sfw` (Socket Firewall Free) en `Dockerfile.dev` se instala bajando el binario a mano, no con `npm install -g sfw`.** El wrapper npm de sfw arma el nombre del asset a descargar solo con `process.platform`/`process.arch` — nunca detecta musl — así que en Alpine baja el binario glibc, falla al hacer `spawn()` del binario, y **traga el error en silencio** (`child.on("error", () => process.exit(1))` en su propio código, sin loggear nada — costó una sesión entera de debugging aislarlo). El release de `SocketDev/sfw-free` sí publica assets `sfw-free-musl-linux-{x86_64,arm64}`; el `RUN` en `Dockerfile.dev` detecta la arquitectura con `uname -m` y baja ese asset directo desde la API de GitHub releases, evitando el wrapper roto.
- **Bug de pnpm + vite `--host` aislado 2026-07-18: nunca usar `pnpm run dev -- --host` (con el separador `--`).** Con pnpm (a diferencia de npm), agregar `--` antes de los flags hace que Vite los reciba pero los ignore silenciosamente — el banner de arranque muestra "Network: use --host to expose" en vez de la IP real, el healthcheck falla por `ECONNREFUSED` (Vite ni siquiera bindea el puerto), y ni `--host` ni `--port` se aplican. La forma correcta es `pnpm run dev --host` (sin `--`) — así está en `Dockerfile.dev` (`CMD`) y `docker-compose.dev.yml` (`command`). Si se necesita pasar más flags a un script de pnpm en este proyecto, probar primero sin el separador.
- **`sfw pnpm install` en el arranque del contenedor de dev es sensiblemente más lento que un `pnpm install` plano** (baja el binario la primera vez que corre en la imagen — ya no aplica en runtime porque el binario queda instalado en la imagen — y siempre verifica el lockfile completo contra las políticas de supply-chain antes de instalar, medido en ~70-90s). El `HEALTHCHECK` de `Dockerfile.dev` tiene `start_period=150s` por esto (antes 30s, calibrado para `npm install` plano — ver `milestone-8-docker-hardening-part2`). Si se vuelve a bajar el `start_period` sin este contexto, `make dev`/`make validate` van a fallar por falso timeout con el contenedor en realidad sano.

(Cuándo correr `/trivy-scan` y cuándo usar la skill `use-railway` está en "Flujo de trabajo recomendado" — no repetido acá.)

---

## Seguridad y secretos

- **Secret scanning en pre-commit**: `.husky/pre-commit` corre `gitleaks protect --staged` (vía la imagen oficial
  `zricethezav/gitleaks`, sin instalar el binario en el host) antes de `lint-staged`. Es una segunda barrera —
  `.mcp.json` y `.claude/` ya están gitignoreados y verificados, esto cubre el caso de un archivo que se
  gitignoree mal. Verificado el 2026-07-15: `gitleaks detect` sobre todo el historial no encontró leaks, y un
  token sintético estilo SonarQube (`squ_...`) fue detectado y bloqueado correctamente (regla
  `sonar-api-token`). Si aparece un falso positivo real, se documenta en `.gitleaks.toml` (no existe hoy porque
  no hizo falta).
- **`SONARQUBE_PROJECT_KEY` en `.mcp.json` (`"audio-sync-app"`) ya corresponde a un proyecto real** — la
  discrepancia original (verificada el 2026-07-15: `get_project_quality_gate_status` devolvía 404, y
  `search_my_sonarqube_projects` listaba otros 4 proyectos, ninguno `audio-sync-app`, porque el key había
  quedado copiado de una plantilla de referencia) se resolvió el mismo día corriendo el scanner de Sonar
  manualmente (issue #16, cerrada), que auto-creó el proyecto `audio-sync-app` en la instancia Community
  Edition. Primer scan: Quality Gate PASSED, 0 vulnerabilidades, 5 issues menores encontradas y corregidas ese
  mismo día (ver detalle en la memoria de Engram `sonarqube-first-scan-2026-07-15`). `/sonar-check` y las tools
  `mcp__sonarqube__*` ya se pueden usar con confianza para este proyecto.
- **CI hosteada (GitHub Actions) desde 2026-07-18** (issue #38 + decisión de generalizarla el mismo
  día, ver "Adaptar este archivo"): `.github/workflows/dependabot-socket-firewall.yml` corre `sfw pnpm
  install` (Socket Firewall Free, [SocketDev/action](https://github.com/SocketDev/action) en modo
  `firewall-free`) sobre cada PR que abre `dependabot[bot]` hacia `main`, y lo cierra automáticamente
  con un comentario si el firewall bloquea una dependencia maliciosa/comprometida. Esto sigue siendo
  específico a Dependabot (ningún otro workflow hace este chequeo); la CI general de lint/test/build
  para todos los PRs vive aparte, en `.github/workflows/ci.yml`.
  Actions de terceros pineadas por commit SHA, no tag flotante (`actions/checkout`, `SocketDev/action`) y
  `permissions:` mínimo explícito por job, siguiendo `development-standards.md` sección 4.
  La [Socket Security GitHub App](https://github.com/marketplace/socket-security) también está instalada en el
  repo (2026-07-18) — agrega SCA continuo fuera de los PRs de Dependabot, complementando al workflow. Issue #38
  cerrada con ambas capas implementadas.

---

## Testing

- **Vitest + jsdom** configurado en `vite.config.js` (sección `test`), con `@testing-library/react` y `@testing-library/jest-dom` disponibles para tests de componente futuros (hoy los tests son de la función pura, no de renderizado).
- **Correr los tests**: `make test` (dentro de Docker, levanta el servicio si hace falta) o `pnpm test` en local. Cobertura con `make coverage` / `pnpm run test:coverage` — el reporte queda en `coverage/` (ya montado en `docker-compose.dev.yml`, visible en el host sin copiar).
- **Cobertura actual**: `src/getActiveWordIndex.js` (la lógica de sincronización, el área de mayor riesgo de bugs sutiles — off-by-one en timestamps, palabras sin `ts`, seek, fin de audio) tiene 7 tests cubriendo los casos ZOMBIES. `src/usePrefersReducedMotion.js` tiene 3 tests (valor inicial, preferencia activada, reacción en caliente a cambios del sistema). El resto de `App.jsx` (rendering, efectos) no tiene tests todavía.
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

El proyecto ya creció una vez (2026-07-15: se agregaron tests, lint, Makefile, git hooks y un backlog en GitHub Issues) y este archivo se actualizó para reflejarlo. Si vuelve a crecer (se agrega backend, más milestones del backlog, un flujo de trabajo distinto), actualizar este `CLAUDE.md` de nuevo. Evitar imponer proceso adicional (arquitectura por capas, cobertura diferenciada por capa, secret manager externo) que no aporta valor al tamaño actual — se descartaron explícitamente del checklist de `/home/kuautli/Projects/README.md` porque el propio repo solo tiene un mantenedor, sin equipo revisando PRs en paralelo (detalle histórico de esa decisión en el historial de git de `user-stories/README.md` antes de que se eliminara la carpeta el 2026-07-16).

**"Sin CI hosteado" se revirtió el 2026-07-18.** Primero se agregó como excepción puntual solo para PRs
de Dependabot (`dependabot-socket-firewall.yml`, ver sección "Seguridad y secretos"); el mismo día se
generalizó a `.github/workflows/ci.yml` corriendo en todo PR/push a `main` — decisión explícita del
usuario, no una deriva accidental de la excepción puntual. `ci.yml` reusa el Makefile como interfaz
única (cada job corre `make <target>`, sin duplicar lógica) siguiendo `development-standards.md`
sección 4: jobs independientes y paralelos (`lock-check`, `license-check`, `lint`, `test`), y `build`
gateado a push en `main` solo si el resto pasó.

**Los git hooks no se eliminaron ni se volvieron redundantes.** `pre-push` sigue corriendo `make
validate` completo localmente antes de llegar a `main` — mismo patrón que documenta
`dockyard2sail-ts/CLAUDE.md`: CI es la red de seguridad en el server, los hooks son el feedback rápido
en el host, y como ambos corren los mismos targets de Makefile no pueden divergir entre sí.

`dependabot-socket-firewall.yml` sigue existiendo aparte de `ci.yml` y no es redundante con él: hace
un chequeo distinto (Socket Firewall detectando dependencias maliciosas, con auto-cierre del PR) que
`ci.yml` no cubre — ambos corren sobre los PRs de Dependabot, cada uno con su propio propósito.

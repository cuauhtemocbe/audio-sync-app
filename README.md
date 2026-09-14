# Audio Sync App

SPA en React que resalta palabra por palabra el texto de una transcripción sincronizada con la
reproducción de un audio. Incluye generación de narraciones nuevas vía [ElevenLabs](https://elevenlabs.io/)
(texto → audio + timestamps por palabra).

## Stack

- [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [pnpm](https://pnpm.io/) (`pnpm@11.14.0`, fijado en `packageManager`)
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react) (tests)
- [Express 5](https://expressjs.com/) (proxy `/api/tts` hacia ElevenLabs, mismo proceso que sirve la SPA en producción)
- Docker (`Dockerfile` para producción, `Dockerfile.dev` para desarrollo)

## Quickstart (Docker, recomendado)

Requiere Docker y Docker Compose.

```bash
make dev
```

Levanta la app en modo desarrollo con hot reload en [http://localhost:5173](http://localhost:5173).

## Quickstart (local, sin Docker)

Requiere Node.js y `pnpm@11.14.0` (`corepack enable` lo resuelve automáticamente si el repo lo trae fijado).

```bash
pnpm install
pnpm run dev
```

## Comandos (`make`)

Todos los comandos de desarrollo pasan por `make` — correr `make` sin argumentos lista los targets disponibles.

| Target | Qué hace |
| --- | --- |
| `make dev` | Levanta el entorno de desarrollo en Docker (puerto 5173) |
| `make test` | Corre la suite de Vitest dentro de Docker |
| `make coverage` | Genera el reporte de cobertura en `coverage/` |
| `make lint` | Corre ESLint dentro de Docker |
| `make build` | Construye la imagen de producción |
| `make validate` | Corre lint + tests + build + chequeos de licencia/lockfile, en orden |

Equivalentes locales sin Docker: `pnpm run dev`, `pnpm test`, `pnpm run test:coverage`, `pnpm run lint`, `pnpm run build`.

## Proxy de texto a voz (`/api/tts`)

`server/index.js` expone `POST /api/tts`, un proxy hacia la API de ElevenLabs que agrega una
`ELEVENLABS_API_KEY` propia al pedido. En producción es el mismo proceso Node el que sirve tanto la
SPA compilada como este endpoint (no hay un servicio separado ni nginx de por medio).

Para correr este proxy localmente hace falta una variable de entorno `ELEVENLABS_API_KEY` (por
ejemplo en un archivo `.env`, no versionado). Sin ella, `server/index.js` no arranca.

## Tests

```bash
make test       # o: pnpm test
make coverage    # o: pnpm run test:coverage
```

El reporte de cobertura queda en `coverage/`.

## Despliegue

La app se despliega en [Railway](https://railway.app/) a partir del `Dockerfile` de producción.

## Licencia

[MIT](LICENSE)

## Más contexto

Para el historial de decisiones de arquitectura, convenciones internas y detalles operativos de
Docker/CI, ver [`CLAUDE.md`](CLAUDE.md) y [`CHANGELOG.md`](CHANGELOG.md).

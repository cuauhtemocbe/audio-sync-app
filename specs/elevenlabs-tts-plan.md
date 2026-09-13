# Plan: Texto → ElevenLabs → Audio sincronizado (sin persistencia)

> Estado: aprobado para implementación | Fecha: 2026-09-13
> Reemplaza el modo demo estático (mp3 + JSON) por generación dinámica de audio con TTS.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| API key | **Proxy backend mínimo** (Node/Express) | En SPA pura, env var de Railway termina embebida en el bundle público. El proxy es la única forma de mantenerla secreta server-side |
| Modo demo | **Eliminar** `daily_job.mp3`, `aligned_transcript.json`, `captions.vtt` | App 100% dinámica; recuperables de git si hiciera falta |
| Textos largos | **Chunking desde el inicio** (por oraciones, ~2.500 chars/chunk) | Límite de `eleven_multilingual_v2` (~10k chars) y menor latencia percibida |
| Voz | **Selector básico** con 2-3 presets (Rachel default + español + otra) | Poco costo extra sobre constantes fijas |
| Modelo/formato | `eleven_multilingual_v2` + `mp3_44100_128` | Config probada en reel-forge-ts |
| Endpoint | `POST /v1/text-to-speech/{voice_id}/with-timestamps` (non-streaming) | Devuelve audio + alignment char-level en una llamada; sin forced alignment externo |
| SDK | **No** — `fetch` directo | Evita dependencia; el endpoint es simple |
| Persistencia | **Ninguna** (sesión en memoria) | Requisito explícito |

## Patrones reutilizados de reel-forge-ts

- `alignmentToWords()` (`src/pipeline/tts.ts:17-48`): char→word, corta en whitespace, palabra hereda `start` del 1er char y `end` del último, puntuación pegada a la palabra
- `normalizeScriptText()` (`src/pipeline/generate.ts:49-54`): espacio tras puntuación de cierre, colapsar espacios, **preservar `\n`**
- Guard `if (!response.alignment)` — la API puede no devolver alineación
- Tests con DTO de alignment construido a mano, sin mockear HTTP (`src/test/tts.test.ts`)

**Ojo — qué NO viene probado de reel-forge-ts**: `tts.ts` manda el guion completo en **una sola
llamada** vía el SDK oficial (`convertWithTimestamps`), sin chunking, sin `previous_text`/`next_text`
y sin concatenación de audio. Lo de arriba es todo lo reutilizable real; el resto de Wave 3
(requests secuenciales, concat de bytes mp3, offset por duración real, fallback WAV) es diseño
nuevo sin precedente probado en ningún repo del usuario — es el mayor riesgo técnico del plan,
no una variación menor de un patrón ya validado.

## Arquitectura

```
Browser (SPA React)                     Server (Railway / dev compose)
┌──────────────────────────┐  POST     ┌─────────────────────────────┐
│ generateNarration()      │ ────────► │ Express                     │
│  ├─ normalizeText        │ /api/tts  │  ├─ express.static(dist/)   │
│  ├─ chunkText            │ ◄──────── │  └─ POST /api/tts           │
│  ├─ N llamadas seq.      │ {audio,   │      → ElevenLabs con       │
│  │   (previous/next_text)│ alignment}│      env ELEVENLABS_API_KEY │
│  ├─ decodeAudioData      │           └─────────────────────────────┘
│  │   (duración real p/   │   La key nunca toca el browser
│  │    offsets)           │
│  └─ concat audio → Blob  │
└──────────────────────────┘
```

- Chunking client-side → server thin (un chunk por request) + progreso por chunk en UI.
- **Offset por duración real** (decodeAudioData), NO por `end` de la última palabra (cola de silencio derivaría la sync acumulativamente).
- Concat mp3 por bytes en un Blob; fallback: decodificar todo y re-encodar WAV si hay glitches en juntas (se decide en verificación manual de Wave 3).
- `getActiveWordIndex.js` y el rendering de highlighting **no se tocan**: `alignmentToWords` emite el mismo formato Rev.ai (`{type:'text', value, ts, end_ts}` + espacios como `punct`).

---

## Wave 0 — Spike de precondición (go/no-go)

**Objetivo**: confirmar que el plan de ElevenLabs habilita `/with-timestamps`.

- [x] `curl` manual con la key del usuario: texto corto, `eleven_multilingual_v2`, verificar que responde `audio_base64` + `alignment`
- [x] Si falla por tier → reevaluar (otro modelo/plan) antes de escribir código

**Exit criteria**: respuesta 200 con alignment no nulo. **✅ Cumplido (2026-09-13)**: `POST
/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/with-timestamps` con `eleven_multilingual_v2` → HTTP 200,
`audio_base64` presente, `alignment.characters` con 58 elementos. Tier de la cuenta habilita el
endpoint — go para Wave 1.

**Nota operativa**: Claude no puede leer `.env` en este entorno (bloqueado por permisos de la sesión,
mismo hallazgo que cerró la issue #21 — ver memoria `project_env-example-discarded`). El curl con la
key real lo tiene que correr el usuario directamente (`!curl ...`), nunca pegando la key en el chat.

## Wave 1 — Proxy backend + infra dev

**Objetivo**: server Express funcional en dev, key server-side.

- [x] `server/index.js`: `express.static` + `POST /api/tts { text, voiceId, previousText?, nextText? }` → ElevenLabs → `{ audioBase64, alignment }`
- [x] Fail-fast con mensaje accionable si falta `ELEVENLABS_API_KEY`
- [x] Mapeo de errores upstream (401/429/quota) → status + mensaje que el cliente pueda mostrar, extraído
      a una función pura testeable (`mapUpstreamError(status, body) → {status, message}`) en vez de
      quedar solo inline en `server/index.js` — mismo criterio que `getActiveWordIndex.js` para lógica
      de riesgo, con test propio (no solo verificación manual)
- [x] `docker-compose.dev.yml`: servicio `server` (puerto 3001, `env_file: .env`) — **reusar
      `Dockerfile.dev`** con un `command:` distinto (no crear un Dockerfile nuevo), para heredar el fix
      de UID/GID, el patrón de `sfw pnpm install` y no duplicar el `HEALTHCHECK`/`start_period` — evita
      repetir los gotchas de Docker/pnpm ya documentados en `CLAUDE.md`
- [x] `vite.config.js`: `server.proxy` `/api` → `http://server:3001`
- [ ] `.env.example` nuevo (revive la decisión de issue #21: ahora sí hay secreto server-side) + `.env` en `.gitignore` (verificar) — **pendiente, ver nota operativa abajo**
- [x] Verificación manual: curl al proxy local devuelve audio+alignment

**Exit criteria**: `make dev` levanta vite + server; `curl -X POST localhost:5173/api/tts` (vía proxy) responde 200.
**✅ Cumplido (2026-09-13)**: servicio `server` agregado a `docker-compose.dev.yml` (reusa `Dockerfile.dev`,
healthcheck propio en `/healthz` porque el heredado apunta al puerto 5173 de Vite); `server/index.js` +
`server/mapUpstreamError.js` con 7 tests propios (`make test` → 28/28 verdes, `make lint` limpio);
`vite.config.js` con proxy `/api` → `http://server:3001`. Verificación real: `POST localhost:5173/api/tts`
con texto corto → HTTP 200, `audioBase64` y `alignment.characters` (10 elementos) presentes, confirmando
el path completo browser→proxy Vite→server Express→ElevenLabs→respuesta.
`pnpm-lock.yaml` actualizado con `express@5.2.1` vía `sfw pnpm install` dentro del contenedor
(supply-chain check pasó, 294→358 entries).

**Pendiente de esta wave**: `.env.example` — Claude no puede escribir archivos `.env*` en este entorno
(mismo bloqueo de permisos que impide leer `.env`, reforzado por instrucción explícita del usuario de no
tocar `.env`). El usuario debe crear `.env.example` a mano con un único `ELEVENLABS_API_KEY=` vacío
(sin la key real). `.env`/`.env.*` ya están en `.gitignore` (verificado, sin cambios necesarios).

## Wave 2 — Funciones puras + tests (sin UI)

**Objetivo**: toda la lógica de transformación testeada sin browser ni API.

- [ ] `src/normalizeText.js` + test (port reel-forge: puntuación, espacios, `\n` preservados)
- [ ] `src/chunkText.js` + test — casos: oración única > límite (corte duro en palabra), texto sin puntuación de cierre, límite exacto, chunk vacío
- [ ] `src/alignmentToWords.js` + test — formato Rev.ai actual; casos ZOMBIES + guard de arrays paralelos cortos
- [ ] `src/offsetWords.js` (o dentro de generateNarration) + test — offset acumulativo por duración real de chunk
- [ ] Agregar entrada de `thresholds` en `vite.config.js` (sección `test.coverage`) para cada uno de
      estos 4 módulos nuevos, igual que `getActiveWordIndex.js`/`usePrefersReducedMotion.js` — sin esto
      `make validate` no exige cobertura ahí aunque los tests existan (los thresholds del proyecto son
      por archivo, no hay un global)

**Exit criteria**: `make test` verde con cobertura de los 4 módulos, con thresholds explícitos en
`vite.config.js` (no solo tests presentes).

## Wave 3 — Orquestación + audio

**Objetivo**: pipeline completo texto → Blob reproducible, verificado en browser.

- [ ] `src/elevenLabsApi.js`: fetch a `/api/tts` + mapeo de errores a mensajes de UI
- [ ] `src/voices.js`: 2-3 presets (Rachel + voz ES + otra)
- [ ] `src/generateNarration.js`: normalize → chunk → requests secuenciales con `previous_text`/`next_text` → decodeAudioData (duraciones reales) → offsets → concat Blob → `{ audioUrl, words }`
- [ ] **Prueba de juntas de chunk** (texto de 3+ chunks): no decidir el fallback a WAV solo a oído —
      comparar la duración total del blob concatenado (decodificada de una sola vez) contra la suma de
      las duraciones por chunk. El riesgo real no es solo el click audible: el delay/padding que
      insertan los encoders MP3 (LAME incluido) puede recortarse distinto cuando `decodeAudioData`
      decodifica un chunk aislado vs. el mismo chunk embebido en el blob concatenado, generando drift
      de sync silencioso (sin glitch audible) entre offset calculado y timeline real de reproducción —
      justo el bug más difícil de detectar en esta app. Si las duraciones divergen → fallback WAV
      (decode + PCM encode), aunque no se escuche ningún click.
- [ ] Progreso por chunk expuesto como callback para la UI

**Exit criteria**: texto de ~6.000 chars genera un solo audio reproducible con words correctamente offseteadas (verificación manual en browser con fixture de alignment), con la comparación de duraciones del punto anterior sin divergencia.

## Wave 4 — UI rewrite

**Objetivo**: reemplazar el modo demo por el flujo completo.

- [ ] `App.jsx`: textarea (contador de chars) + `<select>` de voces + botón Generar + estados `idle/generating (n/m)/ready/error` + player actual (audio + words + seek + timer)
- [ ] Eliminar `public/daily_job.mp3`, `src/aligned_transcript.json`, `public/captions.vtt`, el `<track>` y el import estático
- [ ] `URL.revokeObjectURL` al regenerar
- [ ] Actualizar `src/App.test.jsx` (los 9 tests actuales asumen transcript estático)
- [ ] Revisar los `thresholds` de `src/App.jsx` en `vite.config.js` (hoy `statements:100, branches:85,
      functions:100, lines:100`, calibrados para el componente actual mucho más simple). El `App.jsx`
      nuevo suma varios estados (`idle/generating/ready/error`, select de voces, progreso por chunk) —
      decidir explícitamente antes de esta wave si esos thresholds siguen siendo alcanzables con tests
      razonables o si hay que ajustarlos, en vez de descubrirlo cuando `make validate` empiece a fallar
      por cobertura y no por bugs
- [ ] Verificación manual completa: golden path, seek manual, pausa, click-en-palabra, fin de audio, errores (key inválida → mensaje), reduced motion

**Exit criteria**: flujo completo usable en `make dev`; `make test` verde.

## Wave 5 — Deploy prod + cierre

**Objetivo**: producción con key secreta en Railway.

- [ ] `Dockerfile` prod: nginx → `node:26-alpine` (build stage igual; runtime: copiar `dist/` + `server/` + `node_modules` prod, `CMD node server/index.js`). **Esto descarta hardening ya hecho en el
      `Dockerfile` actual** (fix de `worker_processes` para el vCPU quota de Railway, non-root con
      chown de `/run`, purga de curl/image-filter por CVEs) — la mayoría es específico de nginx y no
      aplica a Node, pero se pierde gzip/cache-headers de nginx por defecto. Si se mantiene un solo
      contenedor (coherente con el tamaño del proyecto), agregar explícitamente `compression` +
      `express.static({ maxAge: ... })` a esta tarea, no asumirlo implícito en "copiar dist/ + server/"
- [ ] Healthcheck del server si aplica; revisar `docker-compose.prod.yml`
- [ ] Railway: `ELEVENLABS_API_KEY` en env vars + redeploy + verificación en el dominio real
- [ ] `make validate` completo + `/trivy-scan` (tocamos Dockerfiles) + `/sonar-check`
- [ ] Actualizar `CLAUDE.md` (ya no es "Sin backend"; nueva arquitectura, nuevos módulos, .env)
- [ ] Commit(s) con `/commit-writer`

**Exit criteria**: app deployada generando audio sincronizado con key invisible en el bundle (verificar DevTools → buscar `sk_` en JS).

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `/with-timestamps` no disponible en el tier | Wave 0 lo detecta antes de escribir código |
| Glitches/clicks en juntas de chunk mp3 | Fallback WAV ya contemplado (Wave 3) |
| Latencia en textos largos (requests secuenciales) | Progreso por chunk en UI; `previous_text` mantiene prosodia |
| Drift de sync entre chunks | Offsets por duración real decodificada, no por última palabra |
| Costo por llamadas en dev | Texts cortos en pruebas; tests nunca llaman la API real |

## Fuera de scope (explícito)

Persistencia, historial de generaciones, streaming/websocket, autenticación de usuarios, chunking paralelo con `previous_request_ids`, generación de `captions.vtt` dinámico, voice settings (stability/similarity) en UI.

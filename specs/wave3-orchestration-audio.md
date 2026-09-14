---
title: Wave 3 — Orquestación + audio (texto → Blob reproducible)
status: in-progress
created: 2026-09-13
updated: 2026-09-13
issue:
---

# Wave 3 — Orquestación + audio (texto → Blob reproducible)

## Objetivo

Componer las 4 funciones puras de Wave 2 (`normalizeText`, `chunkText`, `alignmentToWords`,
`offsetWords`) con llamadas reales al proxy `/api/tts` (Wave 1) y a la Web Audio API del browser,
para producir un pipeline completo `generateNarration(text, voiceId) → { audioUrl, words }`
verificado manualmente en browser — el paso previo indispensable a la reescritura de `App.jsx`
(Wave 4).

## Contexto

Ver `specs/elevenlabs-tts-plan.md` (Wave 3, líneas 131-148) para el plan aprobado original. Waves 0-2
ya están completadas: spike de precondición GO, proxy Express funcionando (`server/index.js` +
`mapUpstreamError.js`), y las 4 funciones puras con 100% de cobertura (`specs/wave2-pure-functions.md`).

Esta es la wave de mayor riesgo técnico del plan (ver nota "Ojo — qué NO viene probado de
reel-forge-ts" en `elevenlabs-tts-plan.md`): requests secuenciales con `previous_text`/`next_text`,
concatenación de bytes mp3, offset por duración real decodificada, y el fallback a WAV si hay drift
de sync en las juntas de chunk — nada de esto tiene precedente probado en ningún repo del usuario.

**Nota de scope heredada de Wave 2**: el plan original de `elevenlabs-tts-plan.md` proponía presets
de voz "Rachel + voz ES + otra", pero durante Wave 2 el usuario confirmó que la app es para texto en
inglés por ahora. `voices.js` en esta wave usa 3 voces stock de ElevenLabs (todas funcionan con
`eleven_multilingual_v2`, la selección es solo de timbre/género, no de idioma): Rachel
(`21m00Tcm4TlvDq8ikWAM`), Adam (`pNInz6obpgDQGcFmaJgB`), Bella (`EXAVITQu4vr4xnSDxMaL`) — voice IDs
públicos de las voces de muestra de ElevenLabs. Ajustar si vuelve a haber alcance multi-idioma.

## Requirements

### Functional Requirements

- [x] `src/elevenLabsApi.js`: `requestTts({ text, voiceId, previousText, nextText })` → `POST /api/tts`
      → `{ audioBase64, alignment }`. Si la respuesta no es `ok`, lanza `TtsRequestError` con el
      `message` que ya devuelve `mapUpstreamError` server-side (nunca un mensaje genérico si el
      server mandó uno específico); si `fetch` falla (red caída), lanza `TtsRequestError` con mensaje
      genérico de conectividad. `fetch` es inyectable (parámetro con default al global) para poder
      testear sin red real.
- [x] `src/voices.js`: `VOICES` (array de `{ id, name }`, 3 presets) + `DEFAULT_VOICE_ID`.
- [x] `src/generateNarration.js`: `generateNarration({ text, voiceId, onProgress })` →
      `Promise<{ audioUrl, words }>`. Pipeline:
      1. `normalizeText` → `chunkText`.
      2. Por cada chunk, secuencial (no paralelo — mantiene prosodia vía `previous_text`/`next_text`
         y limita concurrencia de llamadas a la cuenta de ElevenLabs): `requestTts` con
         `previousText`/`nextText` = el chunk anterior/siguiente en texto plano (no audio) →
         `alignmentToWords(alignment)` → decodificar el audio del chunk para obtener su duración real.
      3. `onProgress(completed, total)`: una llamada con `(0, total)` apenas se conoce el número de
         chunks, y una más después de cada chunk completado (la última es `(total, total)`).
      4. Concatenar los bytes mp3 de todos los chunks en un único buffer.
      5. Decodificar el buffer concatenado completo una sola vez → duración real total.
      6. **Chequeo de divergencia**: si `|duración total decodificada − suma de duraciones por
         chunk| > 0.1s`, usar el fallback WAV (re-encodear el buffer decodificado completo a PCM16
         WAV) en vez del Blob mp3 concatenado por bytes.
      7. `offsetWords` sobre los `words`+duración real de cada chunk → timeline única.
      8. `URL.createObjectURL(blob)` → devolver `{ audioUrl, words }`.
- [x] Las partes que tocan la Web Audio API real (`decodeAudioData`) y `fetch` son inyectables como
      parámetros con default (mismo criterio que ya usa el proyecto para lógica de riesgo: separar la
      parte pura/testeable de la que depende del entorno del browser) — permite testear toda la
      orquestación (threading de previous/next text, progreso, cálculo de offsets, decisión del
      fallback WAV) con fakes, sin necesitar Web Audio real en jsdom (no soportado).
- [x] Encoder WAV (`encodeWavBlob` o función interna equivalente): toma un objeto con forma de
      `AudioBuffer` (`duration`, `numberOfChannels`, `sampleRate`, `getChannelData(i)`) y devuelve un
      `Blob` PCM16 WAV válido — función pura sobre esa forma de datos, no sobre un `AudioBuffer` real
      necesariamente, para poder testearla con un fake.
- [x] Concatenación de bytes mp3 (`concatMp3Chunks` o función interna equivalente): pura, testeable
      directamente sobre `Uint8Array[]`.

### Non-Functional Requirements

- [x] Cobertura: threshold explícito por archivo en `vite.config.js` para los 3 módulos nuevos
      (`elevenLabsApi.js`, `voices.js`, `generateNarration.js`), calibrado después de implementar
      (mismo criterio que Wave 2 — no adivinar antes de ver el archivo final).
- [x] Ningún test llama a la API real de ElevenLabs ni depende de red, ni requiere Web Audio real
      (jsdom no la soporta) — todo con fakes inyectados.
- [x] `alignmentToWords`, `offsetWords`, `normalizeText`, `chunkText` de Wave 2 no se modifican en
      esta wave (se consumen tal cual).

## Architecture

### Components

```
elevenLabsApi.js
  requestTts({ text, voiceId, previousText, nextText }, { fetchImpl }?) → Promise<{ audioBase64, alignment }>
  class TtsRequestError extends Error { status }

voices.js
  VOICES: { id: string, name: string }[]
  DEFAULT_VOICE_ID: string

generateNarration.js
  generateNarration({
    text, voiceId, onProgress,
    requestTts?,      // default: el real de elevenLabsApi.js
    decodeAudio?       // default: real vía AudioContext.decodeAudioData
  }) → Promise<{ audioUrl: string, words: Word[] }>

  // helpers exportados para test directo, sin pasar por el pipeline completo:
  concatMp3Chunks(chunks: Uint8Array[]) → Uint8Array
  encodeWavBlob(bufferLike: { duration, numberOfChannels, sampleRate, getChannelData }) → Blob
```

- `decodeAudio(bytes: Uint8Array) → Promise<AudioBufferLike>` es la única frontera con el browser real
  además del `fetch` de `elevenLabsApi.js` — se llama una vez por chunk (solo se usa `.duration`) y una
  vez más sobre el buffer concatenado completo (se usa `.duration` para el chequeo de divergencia y,
  si diverge, el resto de la forma para `encodeWavBlob`).
- El default real de `decodeAudio` crea un `AudioContext` por llamada y lo cierra (`.close()`) al
  terminar — evitar acumular contexts abiertos en generaciones repetidas dentro de la misma sesión de
  browser.

### Data Model

- **`AudioBufferLike`** (contrato mínimo que `decodeAudio` debe cumplir, sea `AudioBuffer` real o un
  fake de test): `{ duration: number, numberOfChannels: number, sampleRate: number,
  getChannelData(channel: number): Float32Array }`.
- **Chunk result interno** (no expuesto): `{ bytes: Uint8Array, words: Word[], durationSeconds: number }`.
- Reutiliza `Word` de Wave 2 (formato Rev.ai).

### External Dependencies

Ninguna nueva librería — `fetch`, `AudioContext.decodeAudioData`, `atob`/`Uint8Array`,
`URL.createObjectURL` son todas Web APIs nativas del browser.

## User Stories

No aplica formato Gherkin — es la capa de orquestación interna, sin UI todavía (eso es Wave 4). El
"usuario" de este pipeline en esta wave es la verificación manual descrita en Testing Strategy.

## Testing Strategy

### Unit Tests (Vitest, colocados junto a cada módulo)

- **`elevenLabsApi.test.js`**: request exitoso devuelve `{audioBase64, alignment}`; respuesta no-ok
  con `message` del server → `TtsRequestError` con ese mensaje y el `status` correcto; `fetch` que
  rechaza (red caída) → `TtsRequestError` con mensaje genérico; `previousText`/`nextText` ausentes no
  se mandan como `undefined` explícito roto (verificar el body real enviado).
- **`voices.test.js`**: `VOICES` tiene 2-3 entradas, cada una con `id` y `name` no vacíos, `id`s
  únicos; `DEFAULT_VOICE_ID` está entre los `id`s de `VOICES`.
- **`generateNarration.test.js`** (el más importante de la wave, todo con `requestTts`/`decodeAudio`
  inyectados — fakes, nunca red ni Web Audio real):
  - Texto que produce 1 chunk: no manda `previousText`/`nextText`, `words` sin offset (offset 0).
  - Texto que produce 3+ chunks: cada llamada a `requestTts` recibe el `previousText`/`nextText`
    correcto (el chunk vecino en texto plano); `onProgress` se llama `chunks.length + 1` veces, la
    primera con `(0, total)` y la última con `(total, total)`.
  - Sin divergencia (duración total decodificada ≈ suma de duraciones por chunk, dentro de 0.1s):
    devuelve un Blob `audio/mpeg` (mp3 concatenado por bytes), `words` offseteadas usando la duración
    real de cada chunk.
  - Con divergencia (duración total decodificada difiere de la suma por chunk en más de 0.1s):
    devuelve un Blob `audio/wav` (vía `encodeWavBlob`), no el mp3 concatenado.
  - `requestTts` que rechaza en el chunk N: `generateNarration` propaga el rechazo sin llamar
    `onProgress` para chunks posteriores a N (no traga el error).
- **`concatMp3Chunks` (test directo, exportado)**: array vacío → `Uint8Array` vacío; un solo chunk →
  copia idéntica; varios chunks → bytes concatenados en orden, longitud = suma de longitudes.
- **`encodeWavBlob` (test directo, exportado)**: con un `AudioBufferLike` fake (mono, pocos samples,
  valores conocidos) → el `Blob` resultante tiene el `type: 'audio/wav'` y el tamaño esperado
  (44 bytes de header RIFF + `numberOfChannels * samples * 2 bytes` de PCM16); verificar el header
  RIFF/WAVE leyendo los primeros bytes del Blob (`ArrayBuffer` vía `Blob.arrayBuffer()`).

### Integration Tests

No aplica un framework de integración separado — el propio `generateNarration.test.js` con fakes de
red/audio ya cubre la integración entre los 4 módulos de Wave 2 + los 3 nuevos de esta wave.

### E2E Tests

No aplica (sin UI todavía). Ver verificación manual abajo.

### Verificación manual (no automatizable en jsdom — Web Audio real)

- Texto de ~6.000 caracteres (3+ chunks) desde una consola de browser o un harness manual mínimo →
  `generateNarration` produce un `audioUrl` reproducible y `words` con timestamps que, reproducidos
  contra el audio real, están sincronizados de punta a punta (sin drift acumulado entre chunks).
- Confirmar en esta verificación si el tolerance de 0.1s elegido para el chequeo de divergencia es
  razonable contra audio real de ElevenLabs, o si hay que ajustarlo (documentarlo en el Changelog de
  este spec si cambia).

### Performance Tests

No aplica — fuera de scope de esta wave (la latencia percibida por chunk secuencial es un requirement
de UX de Wave 4, no de esta).

## Boundaries & Constraints

### In Scope

- Los 3 módulos nuevos y sus tests.
- El chequeo de divergencia de duraciones y el fallback WAV.
- Progreso por chunk como callback.

### Out of Scope

- `App.jsx`, textarea, selector de voces en UI, estados `idle/generating/ready/error` (Wave 4).
- Eliminar el modo demo estático (`daily_job.mp3`, `aligned_transcript.json`) (Wave 4).
- Deploy a producción, `Dockerfile` prod (Wave 5).
- Streaming/websocket de progreso, cancelación de una generación en curso, reintentos automáticos de
  un chunk fallido — quedan fuera del plan original (ver "Fuera de scope" de
  `elevenlabs-tts-plan.md`) y no se agregan acá.

### Technical Constraints

- JS plano, sin TypeScript.
- Vitest + tests colocados junto al archivo.
- Sin librerías nuevas (Web Audio y `fetch` son nativas).
- El tolerance de divergencia (0.1s) es un valor inicial razonado (delay/padding típico de encoders
  mp3 como LAME rondan ~25-50ms por junta), no medido contra audio real de ElevenLabs — sujeto a
  ajuste en la verificación manual de esta wave.

## Success Criteria

- [x] `make test` verde con los 3 módulos nuevos cubiertos (72/72 tests).
- [x] Threshold explícito por archivo en `vite.config.js` para los 3 módulos nuevos, `make validate`
      completo verde.
- [x] `make lint` limpio sobre los archivos nuevos.
- [ ] Verificación manual: texto de ~6.000 chars genera un audio reproducible con `words` sincronizadas
      correctamente de punta a punta, sin drift perceptible entre chunks, y sin divergencia de
      duraciones fuera del tolerance elegido (o, si diverge, el fallback WAV efectivamente evita el
      drift). **Pendiente — requiere `ELEVENLABS_API_KEY` real, la corre el usuario con `make dev`.**

## Implementation Plan

Ver `specs/wave3-orchestration-audio-plan.md`.

## Changelog

<!-- Vacío hasta que este spec llegue a `completed` y se lo vuelva a tocar. -->

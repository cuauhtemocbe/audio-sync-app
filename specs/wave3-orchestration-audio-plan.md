# Implementation Plan: Wave 3 — Orquestación + audio

**Spec**: `specs/wave3-orchestration-audio.md`
**Created**: 2026-09-13
**Status**: in-progress (Tasks 1-6 completadas, Task 7 pendiente — verificación manual del usuario)

## Components

### 1. `elevenLabsApi.js`
- **Purpose**: única frontera de red del cliente hacia `/api/tts`; traduce respuestas no-ok y fallos
  de conectividad a `TtsRequestError` con mensaje listo para UI.
- **Files**: `src/elevenLabsApi.js`, `src/elevenLabsApi.test.js`
- **Effort**: S — wrapper delgado sobre `fetch`, contrato ya definido por `server/index.js`.

### 2. `voices.js`
- **Purpose**: catálogo estático de presets de voz.
- **Files**: `src/voices.js`, `src/voices.test.js`
- **Effort**: XS — datos estáticos.

### 3. `generateNarration.js`
- **Purpose**: orquestador completo texto → Blob reproducible + `words`; incluye el chequeo de
  divergencia de duraciones y el fallback WAV.
- **Files**: `src/generateNarration.js`, `src/generateNarration.test.js`
- **Effort**: L — mayor riesgo técnico de la wave (secuenciación, DI para Web Audio/fetch,
  concatenación de bytes, encoder WAV, decisión de fallback).

### 4. Coverage thresholds
- **Purpose**: threshold por archivo en `vite.config.js` para los 3 módulos nuevos.
- **Files**: `vite.config.js`
- **Effort**: XS

## Dependencies

### Build Order

1. `voices.js` — sin dependencias, valida rápido el patrón de módulo de datos.
2. `elevenLabsApi.js` — sin dependencias de los otros dos; `generateNarration.js` lo consume como
   default inyectable.
3. `generateNarration.js` — depende de `elevenLabsApi.js` (para su default de `requestTts`) y de las
   4 funciones puras de Wave 2 (`normalizeText`, `chunkText`, `alignmentToWords`, `offsetWords`, ya
   completadas). Se implementa último porque es el más grande y porque sus tests se benefician de
   tener `elevenLabsApi.js` ya testeado para construir el fake de `requestTts` con confianza en la
   forma real del contrato.
4. Coverage thresholds — al final, una vez los 3 archivos existen y `make coverage` corrió.

### External Dependencies

Ninguna nueva.

## Risks & Assumptions

### Risks

- **Tolerance de divergencia (0.1s) sin validar contra audio real**: es un valor razonado (delay
  típico de encoders mp3), no medido. **Mitigación**: la verificación manual de esta wave (spec,
  sección "Verificación manual") es el punto donde se confirma o ajusta — no bloquea la
  implementación ni los tests unitarios (que usan valores de fake controlados, no audio real).
- **`AudioContext`/`decodeAudioData` no existen en jsdom**: cualquier test que instancie el default
  real de `decodeAudio` fallaría. **Mitigación**: diseño con DI explícito desde el principio (ver
  spec, Architecture) — todos los tests de `generateNarration.js` inyectan un `decodeAudio` fake;
  ningún test toca el default real. El default real solo se ejercita en la verificación manual en
  browser.
- **Encoder WAV con bug sutil en el header RIFF o en el interleaving de canales**: un WAV mal formado
  podría fallar en silencio en algunos browsers o sonar distorsionado. **Mitigación**: test directo de
  `encodeWavBlob` verificando el header byte a byte contra un caso conocido (mono, samples fijos) +
  verificación manual reproduciendo el fallback WAV real si el chequeo de divergencia lo dispara con
  audio real de ElevenLabs.
- **Orden de campos en el body de `/api/tts`**: `elevenLabsApi.js` debe mandar exactamente
  `{ text, voiceId, previousText, nextText }` (camelCase) — el contrato ya lo fija
  `server/index.js:30` (`const { text, voiceId, previousText, nextText } = req.body`). **Mitigación**:
  test de `elevenLabsApi.js` que verifica el body exacto enviado a `fetch`, no solo el resultado.

### Assumptions

- El formato `Word` (Rev.ai) sigue sin cambios — Wave 3 solo consume `alignmentToWords`/`offsetWords`
  de Wave 2, no los modifica.
- Los 3 voice IDs elegidos para `voices.js` (Rachel, Adam, Bella) son voces de muestra públicas de
  ElevenLabs, disponibles en cualquier cuenta — si alguna no está disponible en la cuenta del usuario,
  se ajusta en la verificación manual sin tocar el diseño.
- `AudioContext.decodeAudioData` acepta un `ArrayBuffer` (no un `Uint8Array` directamente) — el
  default real hace la conversión (`.buffer.slice(...)` respetando `byteOffset`/`byteLength`) antes de
  llamarlo.

## Milestones

- [x] M1: `voices.js` + `elevenLabsApi.js` implementados y testeados (resuelven las dos fronteras más
      simples antes de encarar la orquestación).
- [x] M2: `generateNarration.js` implementado con DI completa, `concatMp3Chunks` y `encodeWavBlob`
      testeados directamente, y los 6 casos de orquestación del spec cubiertos (72/72 tests verdes).
- [x] M3: Coverage thresholds agregados (`elevenLabsApi.js`/`voices.js` 100%, `generateNarration.js`
      90/65/85/90 documentando el gap de `defaultDecodeAudio`), `make validate` completo verde.
- [ ] M4: Verificación manual en browser con texto de ~6.000 chars — audio reproducible, `words`
      sincronizadas, sin drift; tolerance de divergencia confirmado o ajustado.

## Tasks

**Slicing strategy**: Horizontal (por componente) — igual que Wave 2, no hay flujo de usuario/UI en
esta wave (eso es Wave 4), y las 2 piezas más simples (`voices.js`, `elevenLabsApi.js`) son fronteras
independientes que conviene resolver y testear antes de encarar la pieza grande y riesgosa
(`generateNarration.js`), que sí depende de ambas como sus defaults inyectables.

### Foundation (Build First)

- [x] **Task 1: `voices.js`**
  - **Acceptance**: `VOICES` con 3 presets (`{id, name}`), `id`s únicos y no vacíos; `DEFAULT_VOICE_ID`
    apunta a uno de los `id`s de `VOICES`.
  - **Files**: `src/voices.js`, `src/voices.test.js`
  - **Tests**: los del spec (2-3 entradas, ids únicos/no vacíos, `DEFAULT_VOICE_ID` válido).
  - **Effort**: XS

- [x] **Task 2: `elevenLabsApi.js`**
  - **Acceptance**: `requestTts` devuelve `{audioBase64, alignment}` en éxito; lanza `TtsRequestError`
    con el `message`/`status` del server en respuesta no-ok; lanza `TtsRequestError` con mensaje
    genérico si `fetch` rechaza; el body enviado a `fetch` tiene exactamente
    `{text, voiceId, previousText, nextText}`; `fetch` es inyectable.
  - **Files**: `src/elevenLabsApi.js`, `src/elevenLabsApi.test.js`
  - **Tests**: los 4 casos del spec (éxito, no-ok con message del server, fetch que rechaza, forma
    exacta del body enviado).
  - **Effort**: S

### Component: `generateNarration.js`

- [x] **Task 3: `concatMp3Chunks` + `encodeWavBlob` (helpers puros exportados)**
  - **Acceptance**: `concatMp3Chunks` concatena `Uint8Array[]` en orden preservando bytes exactos;
    `encodeWavBlob` produce un `Blob` `audio/wav` con header RIFF/WAVE válido y tamaño esperado a
    partir de un `AudioBufferLike` fake.
  - **Files**: `src/generateNarration.js` (helpers exportados), tests dentro de
    `src/generateNarration.test.js` (no ameritan archivo propio — son parte del mismo módulo, sin
    dependencias externas al archivo).
  - **Tests**: los 3 casos de `concatMp3Chunks` + los 2 de `encodeWavBlob` del spec.
  - **Effort**: M — el encoder WAV es la parte más delicada (header RIFF byte a byte).

- [x] **Task 4: `generateNarration` — orquestación con DI, sin divergencia**
  - **Acceptance**: pipeline completo (`normalizeText` → `chunkText` → loop secuencial de
    `requestTts`+`decodeAudio` con `previousText`/`nextText` correctos → `alignmentToWords` →
    `offsetWords`) devuelve `{audioUrl, words}` con Blob `audio/mpeg` cuando las duraciones no
    divergen; `onProgress` se llama `chunks.length + 1` veces con la secuencia correcta.
  - **Files**: `src/generateNarration.js`, `src/generateNarration.test.js`
  - **Tests**: caso 1 chunk, caso 3+ chunks (previous/next text correctos, secuencia de `onProgress`),
    caso sin divergencia → Blob mp3.
  - **Effort**: L

- [x] **Task 5: `generateNarration` — divergencia → fallback WAV, y propagación de errores**
  - **Acceptance**: cuando la duración decodificada del blob concatenado difiere de la suma por chunk
    en más de 0.1s, el resultado usa `encodeWavBlob` (Blob `audio/wav`) en vez del mp3 concatenado;
    si `requestTts` rechaza en el chunk N, la promesa de `generateNarration` rechaza sin llamar
    `onProgress` para chunks posteriores a N.
  - **Files**: `src/generateNarration.js`, `src/generateNarration.test.js`
  - **Tests**: caso con divergencia → Blob wav, caso de rechazo a mitad de pipeline.
  - **Effort**: M

### Polish

- [x] **Task 6: Coverage thresholds + `make validate`**
  - **Acceptance**: `vite.config.js` tiene threshold explícito por archivo para
    `elevenLabsApi.js`/`voices.js`/`generateNarration.js`, calibrado contra la cobertura real medida
    (no asumida); `make validate` completo pasa.
  - **Files**: `vite.config.js`
  - **Tests**: N/A (config) — `make coverage` para medir antes de fijar los números.
  - **Effort**: XS
  - **Resultado**: `elevenLabsApi.js`/`voices.js` 100/100/100/100 (real, sin margen). `generateNarration.js`
    medido en 92.4/69.23/90.9/91.42 (statements/branches/functions/lines); threshold fijado en
    90/65/85/90 (margen de unos puntos, mismo criterio que el resto del archivo). El único gap real es
    `defaultDecodeAudio` (líneas 93-99) — nunca ejercitado en tests porque jsdom no implementa Web
    Audio API, por diseño (ver Risk del plan). `make validate` completo pasó (lock-check → lint →
    coverage → build prod → license-check), 72/72 tests verdes.

### Verificación manual (fuera de `make test`, cierra la wave)

- [ ] **Task 7: Verificación manual en browser**
  - **Acceptance**: con `make dev` levantado, ejecutar `generateNarration` (vía consola del browser o
    un harness manual mínimo) con un texto de ~6.000 caracteres real, `voiceId` de `voices.js`;
    reproducir el `audioUrl` resultante y confirmar visualmente/al oído que `words` está sincronizado
    de punta a punta, sin drift ni clicks perceptibles en las juntas de chunk; registrar si el
    tolerance de 0.1s resultó adecuado o si hubo que ajustarlo.
  - **Files**: N/A (verificación, no código) — si el tolerance cambia, actualizar la constante en
    `generateNarration.js` y anotarlo en el Changelog del spec.
  - **Tests**: N/A
  - **Effort**: S (depende de tener una `ELEVENLABS_API_KEY` real configurada en `.env`)

## Effort Estimate

**Total Estimated Days**: 1-1.5 días (la pieza grande es `generateNarration.js`, sin UI ni red nueva
más allá de lo ya construido en Wave 1)

| Phase | Effort |
|-------|--------|
| Foundation (Tasks 1-2) | ~0.2 día |
| Features (Tasks 3-5) | ~0.8 día |
| Polish (Task 6) | ~0.1 día |
| Verificación manual (Task 7) | ~0.1-0.3 día (depende del usuario / key real) |

---
title: Wave 2 — Funciones puras de transformación (texto → chunks → words)
status: completed
created: 2026-09-13
updated: 2026-09-13
issue:
---

# Wave 2 — Funciones puras de transformación (texto → chunks → words)

## Objetivo

Implementar y testear, sin UI ni llamadas HTTP reales, las cuatro funciones puras que Wave 3
(orquestación) va a componer para convertir texto libre + la respuesta de ElevenLabs en la misma
estructura de `words` que hoy consume `getActiveWordIndex.js`: normalización de texto, chunking,
conversión de alignment char-level a words, y offset acumulativo de tiempos entre chunks.

## Contexto

Este proyecto está migrando de un modo demo estático (`daily_job.mp3` + `aligned_transcript.json`)
a generación dinámica vía ElevenLabs TTS — ver `specs/elevenlabs-tts-plan.md` (plan aprobado,
Wave 0 y Wave 1 ya completadas: spike de precondición confirmado GO, proxy Express funcionando en
dev). Wave 2 es el siguiente paso del plan: antes de tocar UI o red (Wave 3/4), la lógica de
transformación de texto/alignment tiene que existir como funciones puras testeadas, siguiendo el
mismo criterio ya aplicado a `getActiveWordIndex.js` (lógica de riesgo de sincronización, extraída
para poder testearla sin montar componentes).

Dos de las cuatro funciones son ports de patrones ya validados en `reel-forge-ts`
(`alignmentToWords()` en `src/pipeline/tts.ts:17-48` y `normalizeScriptText()` en
`src/pipeline/generate.ts:49-54`), no diseño nuevo. `chunkText` y el offset acumulativo
(`offsetWords`) sí son diseño nuevo — no probado en ningún repo del usuario — porque `reel-forge-ts`
manda el guion completo en una sola llamada sin chunking (ver nota "Ojo — qué NO viene probado" en
`elevenlabs-tts-plan.md`).

## Requirements

### Functional Requirements

- [x] `src/normalizeText.js`: normaliza texto libre — espacio tras puntuación de cierre
      (`.`, `,`, `;`, `:`, `!`, `?`), colapsa espacios múltiples, **preserva `\n`** (port de
      `normalizeScriptText` de reel-forge-ts)
- [x] `src/chunkText.js`: parte un texto normalizado en chunks de ~2.500 caracteres, cortando por
      oración cuando es posible; si una oración sola excede el límite, corta en el límite de palabra
      más cercano (corte duro) en vez de partir a mitad de palabra o exceder el límite
- [x] `src/alignmentToWords.js`: convierte la respuesta `alignment` de ElevenLabs
      (`{ characters: string[], character_start_times_seconds: number[], character_end_times_seconds: number[] }`)
      al formato Rev.ai que ya consume `getActiveWordIndex.js`
      (`{ type: 'text'|'punct', value, ts, end_ts }`), agrupando caracteres en palabras por
      whitespace, con la palabra heredando `ts` del primer carácter y `end_ts` del último;
      puntuación queda pegada a la palabra como hoy
- [x] `src/offsetWords.js`: dado un array de resultados por chunk (`words` + duración real del
      audio decodificado de ese chunk), devuelve un único array de `words` con timestamps
      acumulados — el chunk N arranca en la suma de las duraciones reales de los chunks `0..N-1`
      (no en el `end_ts` de la última palabra del chunk anterior)

### Non-Functional Requirements

- [x] Cobertura: cada uno de los 4 módulos nuevos tiene su propio umbral explícito en
      `vite.config.js` (sección `test.coverage.thresholds`, por archivo) — mismo patrón que
      `getActiveWordIndex.js` / `usePrefersReducedMotion.js`. Sin esto, `make validate` no exige
      cobertura ahí aunque los tests existan.
- [x] Sin dependencias nuevas: las 4 funciones son JS puro (sin `fetch`, sin Web Audio API, sin
      acceso a DOM) — Wave 3 es quien las conecta a red/audio real.
- [x] Ningún test llama a la API real de ElevenLabs ni depende de red — fixtures de alignment
      construidos a mano, como ya hace `reel-forge-ts` en `src/test/tts.test.ts`.

## Architecture

### Components

```
normalizeText(text: string) → string
chunkText(text: string, maxChars?: number) → string[]
alignmentToWords(alignment: ElevenLabsAlignment) → Word[]   // formato Rev.ai
offsetWords(chunks: { words: Word[], durationSeconds: number }[]) → Word[]
```

Ninguna de las 4 funciones importa a otra en esta wave — son unidades independientes que Wave 3
compone en `generateNarration.js`. `offsetWords` no decodifica audio (eso es Web Audio API, fuera de
alcance de una función pura) — recibe la duración ya decodificada como parámetro.

### Data Model

- **`Word`** (formato Rev.ai, ya usado por `getActiveWordIndex.js` y `aligned_transcript.json`):
  `{ type: 'text' | 'punct', value: string, ts?: number, end_ts?: number }`
- **`ElevenLabsAlignment`**: `{ characters: string[], character_start_times_seconds: number[], character_end_times_seconds: number[] }` — los tres arrays son paralelos y de igual longitud (guardar contra el caso de longitudes distintas, ver ZOMBIES abajo)
- **Chunk result** (input de `offsetWords`): `{ words: Word[], durationSeconds: number }`

### External Dependencies

Ninguna — JS puro, sin librerías nuevas.

## User Stories

No aplica un formato Gherkin separado para esta wave — es trabajo interno de librería sin
interacción de usuario visible. Los casos de prueba (sección siguiente) cubren el mismo propósito
que aceptaría un backlog de historias.

## Testing Strategy

### Unit Tests (Vitest, colocados junto a cada módulo — convención del proyecto)

- **`normalizeText.test.js`**: espacio faltante tras puntuación de cierre, espacios múltiples
  colapsados, `\n` preservado, texto ya normalizado (no-op), string vacío
- **`chunkText.test.js`**: texto corto (< límite) → un solo chunk; texto largo con puntuación →
  corta en límites de oración; una oración sola > límite → corte duro en palabra (nunca a mitad de
  palabra); texto sin ninguna puntuación de cierre; límite exacto (texto de longitud == `maxChars`);
  input vacío → `[]` o `['']` (decidir y testear explícitamente, no dejarlo implícito)
- **`alignmentToWords.test.js`**: casos ZOMBIES —
  - **Z**ero: `alignment.characters` vacío → `[]`
  - **O**ne: una sola palabra sin espacios
  - **M**any: frase con varias palabras y puntuación pegada (`"Hola, mundo!"`)
  - **B**oundaries: palabra al inicio/fin del array de caracteres, múltiples espacios consecutivos
  - **I**nterface: forma exacta del alignment de ElevenLabs (snake_case, arrays paralelos)
  - **E**xceptional: guard cuando `characters`, `character_start_times_seconds` y
    `character_end_times_seconds` NO tienen la misma longitud → `throw` explícito con mensaje claro
    (decisión: un alignment con arrays paralelos desalineados es un bug upstream de ElevenLabs, no un
    caso a tolerar en silencio truncando datos)
  - **S**imple: verificar que el resultado es consumible por `getActiveWordIndex.js` sin cambios
- **`offsetWords.test.js`**: un solo chunk (offset 0, sin cambios); dos chunks (el segundo arranca
  en la duración real del primero, no en `end_ts` de su última palabra — este es el caso que prueba
  el requirement central); chunk con `words` vacío (duración cuenta igual para el acumulado);
  duración real menor que la suma de `end_ts` del chunk (caso típico: hay padding en el chunk
  anterior — el resultado no debe usar el `end_ts` viejo)

### Integration Tests

No aplica en esta wave — la integración real (red, audio, concatenación de blobs) es Wave 3.

### E2E Tests

No aplica — no hay UI en esta wave.

### Performance Tests

No aplica — funciones puras sobre strings/arrays pequeños, sin requisito de performance específico.

## Boundaries & Constraints

### In Scope

- Las 4 funciones puras y sus tests
- Los thresholds de cobertura correspondientes en `vite.config.js`

### Out of Scope

- Cualquier llamada a `fetch`/red (`src/elevenLabsApi.js` es Wave 3)
- Web Audio API / `decodeAudioData` (Wave 3 la usa para obtener `durationSeconds`, esta wave solo
  recibe ese número como parámetro)
- Concatenación de audio / Blob (Wave 3)
- UI, `App.jsx`, selector de voces (Wave 4)
- Fallback a WAV en juntas de chunk (Wave 3 — se decide con verificación manual sobre audio real)

### Technical Constraints

- JS plano (sin TypeScript — el resto del proyecto tampoco lo usa)
- Vitest + convención de tests colocados junto al archivo (no un árbol `tests/` separado)
- ESLint flat config existente, sin reglas nuevas

## Success Criteria

- [x] `make test` verde con los 4 módulos nuevos cubiertos (53/53 tests, 24 nuevos)
- [x] Los 4 módulos tienen threshold explícito en `vite.config.js` (`test.coverage.thresholds`, 100%
      en los 4) y `make validate` completo pasa
- [x] `make lint` limpio sobre los archivos nuevos
- [x] `alignmentToWords` produce output que `getActiveWordIndex.js` puede consumir sin modificarse
      (verificado con un test que pasa el output de `alignmentToWords` directo a
      `getActiveWordIndex`, no solo verificando la forma del objeto por separado)

## Implementation Plan

Ver `specs/wave2-pure-functions-plan.md` (a crear en la fase PLAN, tras aprobar este spec).

## Changelog

<!-- Vacío hasta que este spec llegue a `completed` y se lo vuelva a tocar. -->

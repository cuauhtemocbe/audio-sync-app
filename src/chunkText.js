// Parte texto normalizado en chunks de hasta maxChars caracteres para respetar el límite de
// eleven_multilingual_v2 (~10k chars) y bajar la latencia percibida por chunk. Corta por oración
// cuando puede; si una sola oración excede el límite, hace un corte duro por palabra (nunca parte
// una palabra a la mitad). Diseño nuevo — sin precedente probado en reel-forge-ts, ver
// specs/elevenlabs-tts-plan.md.
const DEFAULT_MAX_CHARS = 2500

// Cada oración conserva su separador original (espacio, '\n', '\n\n') como prefijo propio en
// vez de perderlo al trimmear — separator/content se re-unen con el separador real, no con un
// ' ' hardcodeado (issue #61).
function splitIntoSentences(text) {
  const rawSentences = text.match(/[^.!?]+[.!?]*/g) || []
  return rawSentences.map((raw) => {
    const [, separator, content] = raw.match(/^(\s*)([\s\S]*)$/)
    return { separator, content }
  })
}

function hardSplitByWords(text, maxChars) {
  // split con grupo de captura: índices pares son palabras, impares son el separador original
  // entre la palabra anterior y la siguiente (preserva '\n'/'\n\n', no solo ' ').
  const parts = text.trim().split(/(\s+)/)
  const chunks = []
  let current = ''

  for (let i = 0; i < parts.length; i += 2) {
    const word = parts[i]
    const separator = i > 0 ? parts[i - 1] : ''
    const candidate = current ? `${current}${separator}${word}` : word
    if (candidate.length > maxChars && current) {
      chunks.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  // current siempre tiene contenido acá: el llamador ya filtró oraciones en blanco
  // antes de invocar hardSplitByWords (ver "content.trim() === ''" en chunkText).
  chunks.push(current)
  return chunks
}

export function chunkText(text, maxChars = DEFAULT_MAX_CHARS) {
  if (!text) return []

  const chunks = []
  let current = ''

  const pushCurrent = () => {
    const trimmed = current.trim()
    if (trimmed !== '') chunks.push(trimmed)
    current = ''
  }

  for (const { separator, content } of splitIntoSentences(text)) {
    if (content.trim() === '') continue

    if (content.length > maxChars) {
      pushCurrent()
      chunks.push(...hardSplitByWords(content, maxChars))
      continue
    }

    // Sin current (arranca chunk nuevo) se descarta el separador: ningún chunk debe empezar
    // con un salto de línea colgante. Con current, se usa el separador real; si no había
    // ninguno entre oraciones pegadas (ej. "Hi.World.") se cae a ' ' como ya hacía el código
    // anterior.
    const joiner = current ? separator || ' ' : ''
    const candidate = current + joiner + content
    if (candidate.length > maxChars) {
      pushCurrent()
      current = content
    } else {
      current = candidate
    }
  }
  pushCurrent()

  return chunks
}

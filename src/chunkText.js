// Parte texto normalizado en chunks de hasta maxChars caracteres para respetar el límite de
// eleven_multilingual_v2 (~10k chars) y bajar la latencia percibida por chunk. Corta por oración
// cuando puede; si una sola oración excede el límite, hace un corte duro por palabra (nunca parte
// una palabra a la mitad). Diseño nuevo — sin precedente probado en reel-forge-ts, ver
// specs/elevenlabs-tts-plan.md.
const DEFAULT_MAX_CHARS = 2500

function splitIntoSentences(text) {
  return text.match(/[^.!?]+[.!?]*/g) || []
}

function hardSplitByWords(text, maxChars) {
  const words = text.trim().split(/\s+/)
  const chunks = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars && current) {
      chunks.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  // current siempre tiene contenido acá: el llamador ya filtró oraciones en blanco
  // antes de invocar hardSplitByWords (ver "sentence.trim() === ''" en chunkText).
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

  for (const sentence of splitIntoSentences(text)) {
    if (sentence.trim() === '') continue

    if (sentence.length > maxChars) {
      pushCurrent()
      chunks.push(...hardSplitByWords(sentence, maxChars))
      continue
    }

    const candidate = current ? `${current} ${sentence.trim()}` : sentence.trim()
    if (candidate.length > maxChars) {
      pushCurrent()
      current = sentence.trim()
    } else {
      current = candidate
    }
  }
  pushCurrent()

  return chunks
}

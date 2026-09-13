// Convierte el alignment char-level de ElevenLabs (POST /v1/text-to-speech/{voiceId}/with-timestamps)
// al formato Rev.ai que ya consume getActiveWordIndex.js: agrupa caracteres consecutivos en
// palabras ('text', con ts/end_ts heredados del primer/último char) o en separadores ('punct',
// espacios y signos de puntuación pegados entre sí, sin ts) — port de alignmentToWords()
// (reel-forge-ts src/pipeline/tts.ts:17-48), verificado contra una respuesta real de ElevenLabs.
const isWordChar = (char) => /[\p{L}\p{N}']/u.test(char)

export function alignmentToWords(alignment) {
  const characters = alignment?.characters
  const starts = alignment?.character_start_times_seconds
  const ends = alignment?.character_end_times_seconds

  if (!Array.isArray(characters) || !Array.isArray(starts) || !Array.isArray(ends)) {
    throw new Error('alignmentToWords: alignment inválido (faltan characters/start/end times)')
  }
  if (characters.length !== starts.length || characters.length !== ends.length) {
    throw new Error(
      'alignmentToWords: characters, character_start_times_seconds y character_end_times_seconds deben tener la misma longitud'
    )
  }

  const words = []
  let buffer = ''
  let bufferType = null
  let bufferStart = null
  let bufferEnd = null

  const flush = () => {
    if (buffer === '') return
    words.push(
      bufferType === 'text'
        ? { type: 'text', value: buffer, ts: bufferStart, end_ts: bufferEnd }
        : { type: 'punct', value: buffer }
    )
    buffer = ''
    bufferStart = null
    bufferEnd = null
  }

  characters.forEach((char, i) => {
    const type = isWordChar(char) ? 'text' : 'punct'
    if (type !== bufferType) {
      flush()
      bufferType = type
    }
    buffer += char
    if (type === 'text') {
      if (bufferStart === null) bufferStart = starts[i]
      bufferEnd = ends[i]
    }
  })
  flush()

  return words
}

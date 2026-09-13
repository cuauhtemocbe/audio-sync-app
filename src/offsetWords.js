// Combina los `words` de cada chunk de TTS en una sola timeline, desplazando cada chunk por la
// duración REAL del audio decodificado de los chunks anteriores (no por el `end_ts` de su última
// palabra) — evita el drift de sync acumulativo que introduciría el silencio de cola que agregan
// los encoders mp3 (ver riesgo documentado en specs/elevenlabs-tts-plan.md, Wave 3).
export function offsetWords(chunks) {
  const words = []
  let accumulatedSeconds = 0

  for (const chunk of chunks) {
    for (const word of chunk.words) {
      words.push(
        word.type === 'text'
          ? { ...word, ts: word.ts + accumulatedSeconds, end_ts: word.end_ts + accumulatedSeconds }
          : word
      )
    }
    accumulatedSeconds += chunk.durationSeconds
  }

  return words
}

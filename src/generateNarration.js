// Orquesta el pipeline completo texto → audio reproducible: normaliza y chunkea el texto (Wave 2),
// pide TTS chunk por chunk a ElevenLabs vía el proxy (Wave 1) manteniendo prosodia con
// previous_text/next_text, decodifica cada chunk para obtener su duración REAL (no la de los
// timestamps del alignment, que no incluyen el padding de cola que agregan los encoders mp3), y
// compone la timeline final con offsetWords (Wave 2).
//
// requestTts y decodeAudio son inyectables porque son las dos únicas fronteras con el entorno real
// (red y Web Audio API) — jsdom no implementa AudioContext, así que los tests siempre inyectan un
// decodeAudio fake y nunca ejercitan defaultDecodeAudio.
import { alignmentToWords } from './alignmentToWords'
import { chunkText } from './chunkText'
import { normalizeText } from './normalizeText'
import { offsetWords } from './offsetWords'
import { requestTts } from './elevenLabsApi'

// Delay/padding típico de encoders mp3 (LAME incluido) por junta ronda ~25-50ms; 0.1s da margen
// sin ser tan laxo que deje pasar un drift real. Valor inicial razonado, no medido contra audio real
// de ElevenLabs — ver "Verificación manual" en specs/wave3-orchestration-audio.md.
const DIVERGENCE_TOLERANCE_SECONDS = 0.1

export function concatMp3Chunks(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalLength)

  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}

function writeAsciiString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

// Re-encodea un AudioBufferLike (real o fake) a PCM16 WAV — fallback cuando la junta de chunks mp3
// concatenados por bytes diverge de la duración real decodificada.
export function encodeWavBlob(audioBufferLike) {
  const { numberOfChannels, sampleRate } = audioBufferLike
  const channelData = []
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(audioBufferLike.getChannelData(channel))
  }

  const numberOfFrames = channelData[0]?.length ?? 0
  const bytesPerSample = 2
  const blockAlign = numberOfChannels * bytesPerSample
  const dataSize = numberOfFrames * blockAlign

  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeAsciiString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAsciiString(view, 8, 'WAVE')
  writeAsciiString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeAsciiString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let frame = 0; frame < numberOfFrames; frame++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][frame]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += bytesPerSample
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

function decodeBase64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function defaultDecodeAudio(bytes) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const audioContext = new AudioContextClass()
  try {
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    return await audioContext.decodeAudioData(arrayBuffer)
  } finally {
    audioContext.close()
  }
}

export async function generateNarration({
  text,
  voiceId,
  onProgress = () => {},
  requestTts: requestTtsImpl = requestTts,
  decodeAudio = defaultDecodeAudio
}) {
  const chunks = chunkText(normalizeText(text))

  if (chunks.length === 0) {
    throw new Error('generateNarration: el texto normalizado no produjo ningún chunk.')
  }

  onProgress(0, chunks.length)

  const chunkResults = []
  for (let i = 0; i < chunks.length; i++) {
    const { audioBase64, alignment } = await requestTtsImpl({
      text: chunks[i],
      voiceId,
      previousText: chunks[i - 1],
      nextText: chunks[i + 1]
    })

    const bytes = decodeBase64ToBytes(audioBase64)
    const audioBuffer = await decodeAudio(bytes)

    chunkResults.push({
      bytes,
      words: alignmentToWords(alignment),
      durationSeconds: audioBuffer.duration
    })

    onProgress(i + 1, chunks.length)
  }

  const concatenatedBytes = concatMp3Chunks(chunkResults.map((chunk) => chunk.bytes))
  const sumOfDurations = chunkResults.reduce((sum, chunk) => sum + chunk.durationSeconds, 0)
  const fullAudioBuffer = await decodeAudio(concatenatedBytes)
  const diverges = Math.abs(fullAudioBuffer.duration - sumOfDurations) > DIVERGENCE_TOLERANCE_SECONDS

  const words = offsetWords(
    chunkResults.map((chunk) => ({ words: chunk.words, durationSeconds: chunk.durationSeconds }))
  )

  const blob = diverges
    ? encodeWavBlob(fullAudioBuffer)
    : new Blob([concatenatedBytes], { type: 'audio/mpeg' })

  return { audioUrl: URL.createObjectURL(blob), words }
}

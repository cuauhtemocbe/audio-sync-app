// Única frontera de red del cliente hacia el proxy /api/tts (server/index.js). Traduce respuestas
// no-ok (ya mapeadas server-side por mapUpstreamError.js) y fallos de conectividad a TtsRequestError
// con un mensaje listo para mostrar en la UI de Wave 4 — el cliente nunca decide el mensaje de error,
// solo lo propaga o cubre el caso de "no hay respuesta del server".
export class TtsRequestError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'TtsRequestError'
    this.status = status
  }
}

export async function requestTts({ text, voiceId, previousText, nextText }, { fetchImpl = fetch } = {}) {
  let response
  try {
    response = await fetchImpl('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, previousText, nextText })
    })
  } catch {
    throw new TtsRequestError('No se pudo conectar con el servidor.', 0)
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new TtsRequestError(body.message || 'Error inesperado al generar audio.', response.status)
  }

  return { audioBase64: body.audioBase64, alignment: body.alignment }
}

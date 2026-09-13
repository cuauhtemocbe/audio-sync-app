// Traduce un error upstream de ElevenLabs a un {status, message} seguro para el cliente:
// nunca reenviamos el body crudo (puede incluir detalles internos de la cuenta).
export function mapUpstreamError(status, body) {
  const detail = body && typeof body === 'object' ? body.detail : undefined
  const detailMessage = typeof detail === 'string' ? detail : detail?.message
  const detailStatus = typeof detail === 'object' ? detail?.status : undefined

  if (status === 401) {
    return { status: 401, message: 'API key de ElevenLabs inválida o revocada.' }
  }

  if (status === 429 || detailStatus === 'quota_exceeded') {
    return { status: 429, message: 'Cuota de ElevenLabs agotada o límite de rate excedido.' }
  }

  if (status === 422) {
    return {
      status: 422,
      message: detailMessage || 'Solicitud inválida para ElevenLabs (texto o voiceId).'
    }
  }

  return {
    status: status >= 500 ? 502 : status,
    message: detailMessage || 'Error inesperado al generar audio con ElevenLabs.'
  }
}

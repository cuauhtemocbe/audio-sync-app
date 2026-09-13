import { describe, it, expect } from 'vitest'
import { mapUpstreamError } from './mapUpstreamError.js'

describe('mapUpstreamError', () => {
  it('mapea 401 a mensaje de key inválida', () => {
    expect(mapUpstreamError(401, { detail: 'Unauthorized' })).toEqual({
      status: 401,
      message: 'API key de ElevenLabs inválida o revocada.'
    })
  })

  it('mapea 429 a mensaje de cuota/rate limit', () => {
    expect(mapUpstreamError(429, { detail: 'Too Many Requests' })).toEqual({
      status: 429,
      message: 'Cuota de ElevenLabs agotada o límite de rate excedido.'
    })
  })

  it('mapea detail.status quota_exceeded a 429 aunque el status HTTP sea otro', () => {
    expect(
      mapUpstreamError(400, { detail: { status: 'quota_exceeded', message: 'no credits' } })
    ).toEqual({
      status: 429,
      message: 'Cuota de ElevenLabs agotada o límite de rate excedido.'
    })
  })

  it('mapea 422 preservando el mensaje de detail cuando existe', () => {
    expect(
      mapUpstreamError(422, { detail: { status: 'invalid_request', message: 'voice_id inválido' } })
    ).toEqual({
      status: 422,
      message: 'voice_id inválido'
    })
  })

  it('usa mensaje default en 422 sin detail.message', () => {
    expect(mapUpstreamError(422, {})).toEqual({
      status: 422,
      message: 'Solicitud inválida para ElevenLabs (texto o voiceId).'
    })
  })

  it('mapea 5xx upstream a 502 con mensaje default', () => {
    expect(mapUpstreamError(500, {})).toEqual({
      status: 502,
      message: 'Error inesperado al generar audio con ElevenLabs.'
    })
  })

  it('pasa a través un status desconocido sin detail', () => {
    expect(mapUpstreamError(418, null)).toEqual({
      status: 418,
      message: 'Error inesperado al generar audio con ElevenLabs.'
    })
  })
})

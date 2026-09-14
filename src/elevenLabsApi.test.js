import { describe, expect, it, vi } from 'vitest'
import { TtsRequestError, requestTts } from './elevenLabsApi'

function fakeFetch(response) {
  return vi.fn().mockResolvedValue(response)
}

function jsonResponse(ok, status, body) {
  return { ok, status, json: () => Promise.resolve(body) }
}

describe('requestTts', () => {
  it('devuelve audioBase64 y alignment en una respuesta exitosa', async () => {
    const fetchImpl = fakeFetch(jsonResponse(true, 200, { audioBase64: 'abc', alignment: { characters: [] } }))

    const result = await requestTts(
      { text: 'hola', voiceId: 'v1' },
      { fetchImpl }
    )

    expect(result).toEqual({ audioBase64: 'abc', alignment: { characters: [] } })
  })

  it('manda el body exacto {text, voiceId, previousText, nextText}', async () => {
    const fetchImpl = fakeFetch(jsonResponse(true, 200, { audioBase64: 'abc', alignment: {} }))

    await requestTts(
      { text: 'chunk 2', voiceId: 'v1', previousText: 'chunk 1', nextText: 'chunk 3' },
      { fetchImpl }
    )

    expect(fetchImpl).toHaveBeenCalledWith('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'chunk 2',
        voiceId: 'v1',
        previousText: 'chunk 1',
        nextText: 'chunk 3'
      })
    })
  })

  it('lanza TtsRequestError con el message del server en una respuesta no-ok', async () => {
    const fetchImpl = fakeFetch(jsonResponse(false, 401, { message: 'API key de ElevenLabs inválida o revocada.' }))

    await expect(requestTts({ text: 'hola', voiceId: 'v1' }, { fetchImpl })).rejects.toMatchObject({
      name: 'TtsRequestError',
      message: 'API key de ElevenLabs inválida o revocada.',
      status: 401
    })
  })

  it('lanza TtsRequestError con mensaje genérico si el body no es JSON válido', async () => {
    const fetchImpl = fakeFetch({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('invalid json'))
    })

    await expect(requestTts({ text: 'hola', voiceId: 'v1' }, { fetchImpl })).rejects.toMatchObject({
      name: 'TtsRequestError',
      message: 'Error inesperado al generar audio.',
      status: 500
    })
  })

  it('lanza TtsRequestError con mensaje genérico si fetch rechaza (red caída)', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    await expect(requestTts({ text: 'hola', voiceId: 'v1' }, { fetchImpl })).rejects.toBeInstanceOf(
      TtsRequestError
    )
    await expect(requestTts({ text: 'hola', voiceId: 'v1' }, { fetchImpl })).rejects.toMatchObject({
      status: 0
    })
  })
})

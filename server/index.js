import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mapUpstreamError } from './mapUpstreamError.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const apiKey = process.env.ELEVENLABS_API_KEY
if (!apiKey) {
  console.error(
    'ELEVENLABS_API_KEY no está definida. Agregala a .env (ver .env.example) antes de levantar el server.'
  )
  process.exit(1)
}

const PORT = process.env.PORT || 3001
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname, '..', 'dist')))

// Usado por el healthcheck de docker-compose.dev.yml (el HEALTHCHECK heredado de Dockerfile.dev
// apunta al puerto 5173 del servicio de Vite, no sirve para este servicio en el puerto 3001).
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/tts', async (req, res) => {
  const { text, voiceId, previousText, nextText } = req.body ?? {}

  if (!text || !voiceId) {
    return res.status(400).json({ message: 'Faltan campos requeridos: text, voiceId.' })
  }

  const upstreamUrl = new URL(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/with-timestamps`)
  upstreamUrl.searchParams.set('output_format', 'mp3_44100_128')

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        ...(previousText ? { previous_text: previousText } : {}),
        ...(nextText ? { next_text: nextText } : {})
      })
    })

    const upstreamBody = await upstreamResponse.json()

    if (!upstreamResponse.ok) {
      const { status, message } = mapUpstreamError(upstreamResponse.status, upstreamBody)
      return res.status(status).json({ message })
    }

    return res.json({
      audioBase64: upstreamBody.audio_base64,
      alignment: upstreamBody.alignment
    })
  } catch (error) {
    console.error('Error llamando a ElevenLabs:', error)
    return res.status(502).json({ message: 'No se pudo contactar a ElevenLabs.' })
  }
})

app.listen(PORT, () => {
  console.log(`Server escuchando en puerto ${PORT}`)
})

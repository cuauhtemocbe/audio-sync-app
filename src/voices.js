// Presets de voz para generateNarration.js — voces de muestra públicas de ElevenLabs, disponibles en
// cualquier cuenta. La selección es solo de timbre/género: eleven_multilingual_v2 funciona con
// cualquier idioma independientemente de la voz elegida (ver nota de scope en
// specs/wave3-orchestration-audio.md).
export const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' }
]

export const DEFAULT_VOICE_ID = VOICES[0].id

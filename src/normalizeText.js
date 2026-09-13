// Normaliza texto libre antes de chunkearlo para TTS: agrega espacio faltante tras puntuación de
// cierre y colapsa espacios horizontales repetidos, preservando saltos de línea (port de
// normalizeScriptText, reel-forge-ts src/pipeline/generate.ts:49-54).
export function normalizeText(text) {
  if (!text) return ''
  return text
    .replace(/([.,;:!?])(?=[^\s.,;:!?)])/g, '$1 ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

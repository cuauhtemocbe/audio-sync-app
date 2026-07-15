// Índice de la palabra activa: se mantiene resaltada hasta que empieza la siguiente palabra con `ts`.
export function getActiveWordIndex(words, currentTime) {
  return words.findIndex((w, idx) => {
    if (w.type !== 'text' || w.ts === undefined) return false
    const next = words.slice(idx + 1).find((nw) => nw.type === 'text' && nw.ts !== undefined)
    const nextTs = next ? next.ts : Infinity
    return currentTime >= w.ts && currentTime < nextTs
  })
}

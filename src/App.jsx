// src/App.jsx
import { useEffect, useRef, useState } from 'react'
import { generateNarration } from './generateNarration'
import { getActiveWordIndex } from './getActiveWordIndex'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { DEFAULT_VOICE_ID, VOICES } from './voices'

export default function App() {
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  const [text, setText] = useState('')
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID)
  const [status, setStatus] = useState('idle') // 'idle' | 'generating' | 'ready' | 'error'
  const [progress, setProgress] = useState(null) // { completed, total } | null
  const [errorMessage, setErrorMessage] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [words, setWords] = useState([])

  // Ref en paralelo al estado: el cleanup de desmontaje corre en un closure fijado al montar el
  // efecto, así que leer `audioUrl` (state) ahí devolvería siempre su valor inicial (null) en vez del
  // último asignado. El ref siempre apunta al valor más reciente. Se sincroniza en un efecto (no
  // durante el render) porque mutar un ref en el cuerpo del componente es inseguro bajo render
  // concurrente/StrictMode.
  const audioUrlRef = useRef(null)
  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

  // Liberar el Blob activo al desmontar, para no acumular audio sin referencias en memoria.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [])

  // Calcular la palabra activa (subrayado se mantiene hasta que la siguiente palabra comience)
  const activeWordIndex = getActiveWordIndex(words, currentTime)

  // Actualizar el tiempo actual cada 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Función para saltar a una palabra
  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      audioRef.current.play()
    }
  }

  const canGenerate = text.trim() !== '' && status !== 'generating'

  const handleGenerate = async () => {
    setStatus('generating')
    setProgress({ completed: 0, total: 0 })
    setErrorMessage(null)

    try {
      const result = await generateNarration({
        text,
        voiceId,
        onProgress: (completed, total) => setProgress({ completed, total })
      })

      setAudioUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl)
        return result.audioUrl
      })
      setCurrentTime(0)
      setWords(result.words.map((w, i) => ({ ...w, id: i })))
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.message || 'Error inesperado al generar audio.')
      setStatus('error')
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto bg-vu-housing min-h-screen text-vu-scale">
      <h1 className="flex items-center gap-2 text-2xl font-bold font-display mb-4">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="16" width="4" height="9" rx="1.5" className="fill-vu-scale" />
          <rect x="10" y="9" width="4" height="16" rx="1.5" className="fill-vu-scale" />
          <rect x="17" y="3" width="4" height="22" rx="1.5" className="fill-vu-peak" />
          <rect x="24" y="12" width="4" height="13" rx="1.5" className="fill-vu-scale" />
          <line
            x1="17"
            y1="28"
            x2="21"
            y2="28"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-vu-peak"
          />
        </svg>
        Texto sincronizado con audio
      </h1>

      <div className="mb-4 flex flex-col gap-3">
        <div>
          <label htmlFor="narration-text" className="block mb-1 font-body text-sm text-vu-dial">
            Texto a narrar
          </label>
          <textarea
            id="narration-text"
            className="w-full min-h-32 p-2 rounded font-body text-vu-scale bg-transparent border border-vu-dial"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="font-mono text-xs text-vu-dial mt-1">{text.length} caracteres</p>
        </div>

        <div>
          <label htmlFor="voice-select" className="block mb-1 font-body text-sm text-vu-dial">
            Voz
          </label>
          <select
            id="voice-select"
            className="bg-transparent border border-vu-dial rounded p-1 font-body text-vu-scale"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
          >
            {VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="self-start px-4 py-2 rounded font-body bg-vu-peak text-vu-housing disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          Generar
        </button>

        <div aria-live="polite" className="font-body text-sm">
          {status === 'generating' && (
            <p className="text-vu-dial">
              Generando… ({progress.completed}/{progress.total})
            </p>
          )}
          {status === 'error' && <p className="text-vu-peak">{errorMessage}</p>}
        </div>
      </div>

      {status === 'ready' && (
        <>
          {/* Sin <source type>: el resultado puede ser audio/mpeg o audio/wav (fallback por
              divergencia, ver generateNarration.js) y un type incorrecto puede hacer que el
              navegador descarte la fuente sin siquiera probarla. */}
          <audio key={audioUrl} ref={audioRef} controls src={audioUrl} className="w-full mb-4">
            Tu navegador no soporta audio.
          </audio>

          <div className="font-body text-lg leading-relaxed text-justify">
            {words.map((w, idx) => {
              const isClickable = w.type === 'text'
              return (
                <span
                  key={w.id}
                  onClick={isClickable ? () => seekTo(w.ts) : undefined}
                  onKeyDown={
                    isClickable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            seekTo(w.ts)
                          }
                        }
                      : undefined
                  }
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  className={`cursor-pointer underline underline-offset-4 ${
                    prefersReducedMotion ? '' : 'transition-colors duration-150'
                  } ${
                    idx === activeWordIndex
                      ? 'decoration-vu-peak text-vu-peak'
                      : 'decoration-transparent text-vu-scale'
                  }`}
                  style={{ textUnderlinePosition: 'under' }}
                >
                  {w.value}
                </span>
              )
            })}
          </div>

          <p className="font-mono mt-4 text-sm text-vu-dial">
            Tiempo actual: {currentTime.toFixed(2)} segundos
          </p>
        </>
      )}
    </div>
  )
}

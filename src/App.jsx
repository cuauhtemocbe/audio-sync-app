// src/App.jsx
import { useEffect, useRef, useState } from "react";
import transcript from "./aligned_transcript.json";
import { getActiveWordIndex } from "./getActiveWordIndex";

export default function App() {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Obtener las palabras del transcript
  const words = transcript.monologues.flatMap((mono) => mono.elements);

  // Calcular la palabra activa (subrayado se mantiene hasta que la siguiente palabra comience)
  const activeWordIndex = getActiveWordIndex(words, currentTime);

  // Actualizar el tiempo actual cada 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Función para saltar a una palabra
  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-2xl font-bold mb-4">🎧 Texto sincronizado con audio</h1>

      <audio ref={audioRef} controls className="w-full mb-4">
        <source src="/daily_job.mp3" type="audio/mp3" />
        Tu navegador no soporta audio.
      </audio>

      <div className="text-lg leading-relaxed text-justify">
        {words.map((w, idx) => (
          <span
            key={idx}
            onClick={w.type === "text" ? () => seekTo(w.ts) : undefined}
            className={`cursor-pointer underline underline-offset-4 transition-colors duration-150 ${
              idx === activeWordIndex
                ? "decoration-orange-500 text-orange-400"
                : "decoration-transparent text-gray-100"
            }`}
            style={{ textUnderlinePosition: "under" }}
          >
            {w.value}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Tiempo actual: {currentTime.toFixed(2)} segundos
      </p>
    </div>
  );
}


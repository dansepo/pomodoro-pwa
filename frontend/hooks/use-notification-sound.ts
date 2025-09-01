import { useState, useEffect, useRef, useCallback } from "react"
import { storage } from "@/lib/storage"

export function useNotificationSound(initialVolume = 0.5) {
  const [selectedSound, setSelectedSound] = useState(() =>
    storage.getString("pomodoro_sound", "/notification.wav"),
  )

   const [isMuted, setIsMuted] = useState(() =>
    storage.getBoolean("pomodoro_muted", false),
  )
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element and update its source when the sound changes.
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!audioRef.current) {
        audioRef.current = new Audio(selectedSound)
        audioRef.current.volume = initialVolume
      } else {
        audioRef.current.src = selectedSound
      }
    }
  }, [selectedSound, initialVolume])

  // Persist sound changes to localStorage.
  useEffect(() => {
    storage.setString("pomodoro_sound", selectedSound)
  }, [selectedSound])

  useEffect(() => {
    storage.setBoolean("pomodoro_muted", isMuted)
  }, [isMuted])

  const playSound = useCallback(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        console.warn("Audio play failed. This might be due to browser autoplay policies.", error)
      })
    }
  }, [isMuted])

 const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return { selectedSound, setSelectedSound, playSound, isMuted, toggleMute }
}


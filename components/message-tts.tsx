'use client'

import { useState, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageTTSProps {
  text: string
}

export function MessageTTS({ text }: MessageTTSProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const cleanText = useCallback((t: string) => {
    // Remove citation markers like [1], [2] etc
    return t.replace(/\[\d+\]/g, '').replace(/\[.*?\]\(.*?\)/g, '')
  }, [])

  const handleToggle = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const utterance = new SpeechSynthesisUtterance(cleanText(text))
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
    }
  }, [isSpeaking, text, cleanText])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      onClick={handleToggle}
      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
    >
      {isSpeaking ? (
        <VolumeX className="size-4" />
      ) : (
        <Volume2 className="size-4" />
      )}
    </Button>
  )
}

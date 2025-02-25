import React, { useEffect, useRef } from "react";
import { useMessageStore } from "@/stores/message-store";

export const TTSManager: React.FC = () => {
  const {
    currentMessage,
    moveToNextMessage,
    isPaused,
    ttsVoice,
    ttsRate,
    ttsPitch,
    ttsVolume,
    includeUsername,
  } = useMessageStore();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (currentMessage && !isPaused) {
      if (synthRef.current) {
        synthRef.current.cancel(); // cancel any ongoing speech
      }

      const message = includeUsername
        ? `${currentMessage.username}: ${currentMessage.content}`
        : currentMessage.content;

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.voice =
        synthRef.current
          ?.getVoices()
          .find((voice) => voice.name === ttsVoice) || null;
      utterance.rate = ttsRate;
      utterance.pitch = ttsPitch;
      utterance.volume = ttsVolume;

      utterance.onend = () => {
        moveToNextMessage();
      };

      utteranceRef.current = utterance;
      synthRef.current?.speak(utterance);
    } else if (isPaused && synthRef.current) {
      synthRef.current.pause();
    } else if (!isPaused && synthRef.current) {
      synthRef.current.resume();
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [
    currentMessage,
    isPaused,
    ttsVoice,
    ttsRate,
    ttsPitch,
    ttsVolume,
    includeUsername,
    moveToNextMessage,
  ]);

  return null;
};

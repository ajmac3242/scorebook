import { useState, useEffect, useCallback, useRef } from "react";
import { parseVoiceCommand, type ParsedVoiceCommand } from "../utils/voiceParser";
import { logger } from "../utils/logger";

interface UseVoiceRecognitionProps {
  onCommand: (command: ParsedVoiceCommand) => void;
  enabled: boolean;
}

export const useVoiceRecognition = ({ onCommand, enabled }: UseVoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      logger.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      logger.info("Voice recognition started");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setLastTranscript(transcript);
      const command = parseVoiceCommand(transcript);
      if (command) {
        onCommand(command);
      }
    };

    recognition.onerror = (event: any) => {
      logger.error("Voice recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      logger.info("Voice recognition ended");
      // Auto-restart if enabled
      if (enabled) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore if already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand, enabled]);

  useEffect(() => {
    if (enabled) {
      try {
        recognitionRef.current?.start();
      } catch (e) {}
    } else {
      recognitionRef.current?.stop();
    }
  }, [enabled]);

  return {
    isListening,
    lastTranscript,
  };
};

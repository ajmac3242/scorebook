import { useState, useEffect, useRef } from "react";
import {
  parseVoiceCommand,
  type ParsedVoiceCommand,
} from "../utils/voiceParser";
import { logger } from "../utils/logger";

// Define SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (_event: Event) => void;
  onresult: (_event: SpeechRecognitionEvent) => void;
  onerror: (_event: SpeechRecognitionErrorEvent) => void;
  onend: (_event: Event) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface UseVoiceRecognitionProps {
  onCommand: (_command: ParsedVoiceCommand) => void;
  enabled: boolean;
}

export const useVoiceRecognition = ({
  onCommand,
  enabled,
}: UseVoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Use a ref for onCommand to avoid restarting recognition when the callback changes
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const SpeechRecognition =
      (window as WindowWithSpeechRecognition).SpeechRecognition ||
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      logger.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = (_event: Event) => {
      setIsListening(true);
      logger.info("Voice recognition started");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setLastTranscript(transcript);
      const command = parseVoiceCommand(transcript);
      if (command) {
        onCommandRef.current(command);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logger.error("Voice recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = (_event: Event) => {
      setIsListening(false);
      logger.info("Voice recognition ended");
      // Auto-restart if enabled
      if (enabled) {
        try {
          recognition.start();
        } catch {
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
  }, [enabled]); // Only depend on enabled, not onCommand

  useEffect(() => {
    if (enabled) {
      try {
        recognitionRef.current?.start();
      } catch {
        // Recognition already started
      }
    } else {
      recognitionRef.current?.stop();
    }
  }, [enabled]);

  return {
    isListening,
    lastTranscript,
  };
};

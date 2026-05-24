import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceRecognition } from "./useVoiceRecognition";
import { logger } from "../utils/logger";

// Mock the logger
vi.mock("../utils/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the voice parser
vi.mock("../utils/voiceParser", () => ({
  parseVoiceCommand: vi.fn((text) => {
    if (text === "foul") return { type: "FOUL" };
    return null;
  }),
}));

describe("useVoiceRecognition", () => {
  let mockSpeechRecognition: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
  };
  let currentOnstart: () => void;
  let currentOnresult: (_event: unknown) => void;
  let currentOnerror: (_error: unknown) => void;
  let currentOnend: () => void;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSpeechRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      continuous: false,
      interimResults: false,
      lang: "",
    };

    const MockSpeechRecognition = vi.fn().mockImplementation(function (
      _this: unknown,
    ) {
      const self = _this as Record<string, unknown>;
      self.start = mockSpeechRecognition.start;
      self.stop = mockSpeechRecognition.stop;
      self.abort = mockSpeechRecognition.abort;
      self.continuous = mockSpeechRecognition.continuous;
      self.interimResults = mockSpeechRecognition.interimResults;
      self.lang = mockSpeechRecognition.lang;

      Object.defineProperty(self, "onstart", {
        set: (cb) => {
          currentOnstart = cb;
        },
      });
      Object.defineProperty(self, "onresult", {
        set: (cb) => {
          currentOnresult = cb;
        },
      });
      Object.defineProperty(self, "onerror", {
        set: (cb) => {
          currentOnerror = cb;
        },
      });
      Object.defineProperty(self, "onend", {
        set: (cb) => {
          currentOnend = cb;
        },
      });
    });

    (window as unknown as Record<string, unknown>).SpeechRecognition =
      MockSpeechRecognition;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>)
      .webkitSpeechRecognition;
  });

  it("warns if SpeechRecognition is not supported", () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    renderHook(() =>
      useVoiceRecognition({ onCommand: vi.fn(), enabled: true }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Web Speech API is not supported in this browser.",
    );
  });

  it("starts recognition if enabled is true", () => {
    renderHook(() =>
      useVoiceRecognition({ onCommand: vi.fn(), enabled: true }),
    );
    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });

  it("stops recognition if enabled is false", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useVoiceRecognition({ onCommand: vi.fn(), enabled }),
      {
        initialProps: { enabled: true },
      },
    );
    rerender({ enabled: false });
    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  it("updates isListening when onstart is called", () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onCommand: vi.fn(), enabled: true }),
    );
    act(() => {
      currentOnstart();
    });
    expect(result.current.isListening).toBe(true);
    expect(logger.info).toHaveBeenCalledWith("Voice recognition started");
  });

  it("processes transcript and calls onCommand when result is received", () => {
    const onCommand = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecognition({ onCommand, enabled: true }),
    );

    const mockEvent = {
      results: [[{ transcript: "foul" }]],
      resultIndex: 0,
    };

    act(() => {
      currentOnresult(mockEvent);
    });
    expect(result.current.lastTranscript).toBe("foul");
    expect(onCommand).toHaveBeenCalledWith({ type: "FOUL" });
  });

  it("handles errors and updates isListening", () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onCommand: vi.fn(), enabled: true }),
    );
    act(() => {
      currentOnstart();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      currentOnerror({ error: "network", message: "no internet" });
    });
    expect(result.current.isListening).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "Voice recognition error:",
      "network",
    );
  });

  it("handles onend and auto-restarts if enabled", () => {
    renderHook(() =>
      useVoiceRecognition({ onCommand: vi.fn(), enabled: true }),
    );
    act(() => {
      currentOnend();
    });
    expect(logger.info).toHaveBeenCalledWith("Voice recognition ended");
    // Should try to start again because enabled is true
    expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2);
  });
});

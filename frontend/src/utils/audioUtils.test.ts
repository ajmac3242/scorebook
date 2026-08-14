import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { playBuzzerSound } from "./audioUtils";

describe("audioUtils", () => {
  const originalAudioContext = globalThis.AudioContext;
  const originalWebkitAudioContext = (
    globalThis as unknown as Record<string, unknown>
  ).webkitAudioContext;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalAudioContext !== undefined) {
      globalThis.AudioContext = originalAudioContext;
      window.AudioContext = originalAudioContext;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).AudioContext;
      delete (window as unknown as Record<string, unknown>).AudioContext;
    }

    if (originalWebkitAudioContext !== undefined) {
      (globalThis as unknown as Record<string, unknown>).webkitAudioContext =
        originalWebkitAudioContext;
      (window as unknown as Record<string, unknown>).webkitAudioContext =
        originalWebkitAudioContext as typeof AudioContext;
    } else {
      delete (globalThis as unknown as Record<string, unknown>)
        .webkitAudioContext;
      delete (window as unknown as Record<string, unknown>).webkitAudioContext;
    }
  });

  it("plays buzzer sound using standard AudioContext when available", () => {
    const mockOscillator = {
      type: "",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockCtx = {
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
    };

    class MockAudioContext {
      constructor() {
        return mockCtx;
      }
    }

    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    playBuzzerSound();

    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockOscillator.type).toBe("sawtooth");
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
      150,
      10,
    );
    expect(
      mockOscillator.frequency.exponentialRampToValueAtTime,
    ).toHaveBeenCalledWith(120, 11.2);
    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 10);
    expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.01,
      11.2,
    );
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(mockCtx.destination);
    expect(mockOscillator.start).toHaveBeenCalled();
    expect(mockOscillator.stop).toHaveBeenCalledWith(11.2);
  });

  it("plays buzzer sound using webkitAudioContext if AudioContext is unavailable", () => {
    delete (window as unknown as Record<string, unknown>).AudioContext;
    delete (globalThis as unknown as Record<string, unknown>).AudioContext;

    const mockOscillator = {
      type: "",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockCtx = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
    };

    class MockWebkitAudioContext {
      constructor() {
        return mockCtx;
      }
    }

    (window as unknown as Record<string, unknown>).webkitAudioContext =
      MockWebkitAudioContext;

    playBuzzerSound();

    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it("returns gracefully if neither AudioContext nor webkitAudioContext is supported", () => {
    delete (window as unknown as Record<string, unknown>).AudioContext;
    delete (globalThis as unknown as Record<string, unknown>).AudioContext;
    delete (window as unknown as Record<string, unknown>).webkitAudioContext;
    delete (globalThis as unknown as Record<string, unknown>)
      .webkitAudioContext;

    expect(() => playBuzzerSound()).not.toThrow();
  });

  it("handles errors thrown during audio context creation silently", () => {
    class FailingAudioContext {
      constructor() {
        throw new Error("AudioContext blocked by user gesture");
      }
    }

    window.AudioContext = FailingAudioContext as unknown as typeof AudioContext;

    expect(() => playBuzzerSound()).not.toThrow();
  });
});

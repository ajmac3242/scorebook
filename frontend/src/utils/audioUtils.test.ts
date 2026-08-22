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
    const mockOscillator1 = {
      type: "",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockOscillator2 = {
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

    let oscCallCount = 0;
    const mockCtx = {
      currentTime: 10,
      destination: {},
      createOscillator: vi.fn().mockImplementation(() => {
        oscCallCount++;
        return oscCallCount === 1 ? mockOscillator1 : mockOscillator2;
      }),
      createGain: vi.fn().mockReturnValue(mockGain),
    };

    class MockAudioContext {
      constructor() {
        return mockCtx;
      }
    }

    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    playBuzzerSound();

    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockOscillator1.type).toBe("sawtooth");
    expect(mockOscillator1.frequency.setValueAtTime).toHaveBeenCalledWith(
      150,
      10,
    );
    expect(
      mockOscillator1.frequency.exponentialRampToValueAtTime,
    ).toHaveBeenCalledWith(120, 11.5);

    expect(mockOscillator2.type).toBe("triangle");
    expect(mockOscillator2.frequency.setValueAtTime).toHaveBeenCalledWith(
      220,
      10,
    );
    expect(
      mockOscillator2.frequency.exponentialRampToValueAtTime,
    ).toHaveBeenCalledWith(180, 11.5);

    expect(mockGain.gain.setValueAtTime).toHaveBeenCalledWith(0.4, 10);
    expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.01,
      11.5,
    );
    expect(mockOscillator1.connect).toHaveBeenCalledWith(mockGain);
    expect(mockOscillator2.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(mockCtx.destination);
    expect(mockOscillator1.start).toHaveBeenCalled();
    expect(mockOscillator2.start).toHaveBeenCalled();
    expect(mockOscillator1.stop).toHaveBeenCalledWith(11.5);
    expect(mockOscillator2.stop).toHaveBeenCalledWith(11.5);
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

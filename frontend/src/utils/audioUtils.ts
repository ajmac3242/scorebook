let sharedAudioCtx: AudioContext | null = null;

/**
 * Resets the cached shared AudioContext (useful for testing or full audio resets).
 */
export const resetAudioContext = (): void => {
  if (sharedAudioCtx) {
    try {
      if (sharedAudioCtx.state !== "closed") {
        sharedAudioCtx.close().catch(() => {});
      }
    } catch {
      // ignore
    }
    sharedAudioCtx = null;
  }
};

/**
 * Retrieves or initializes the shared Web Audio API AudioContext.
 */
export const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch {
      sharedAudioCtx = null;
    }
  }
  return sharedAudioCtx;
};

/**
 * Explicitly unlocks and resumes the Web Audio AudioContext if it is suspended by browser autoplay policy.
 */
export const unlockAudioContext = (): AudioContext | null => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {
      // Audio context resume error ignored in headless or strict contexts
    });
  }
  return ctx;
};

/**
 * Synthesizes a standard basketball buzzer/horn sound using Web Audio API oscillator nodes.
 * Plays high-amplitude low-frequency saw/triangle waves for 1.5 seconds.
 */
export const playBuzzerSound = (): void => {
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(150, ctx.currentTime); // Low fundamental frequency for horn tone
    osc1.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.5);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(220, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.5);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  } catch {
    // Audio Context might be blocked or unsupported in test/headless environment
  }
};

/**
 * Synthesizes a standard basketball buzzer/horn sound using Web Audio API oscillator nodes.
 * Plays high-amplitude low-frequency saw/triangle waves for 1.5 seconds.
 */
export const playBuzzerSound = (): void => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
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

let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  } catch {
    // Web Audio not available (e.g. no user interaction yet) — fail silently.
  }
}

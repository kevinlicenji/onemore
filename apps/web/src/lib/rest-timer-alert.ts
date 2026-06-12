let audioContext: AudioContext | null = null;

/**
 * Plays a short chime when the rest timer reaches zero (fallback when haptics are unavailable).
 */
export function playRestCompleteChime(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const windowWithWebkit = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = windowWithWebkit.webkitAudioContext ?? window.AudioContext;
    if (typeof AudioContextCtor !== 'function') {
      return;
    }

    audioContext ??= new AudioContextCtor();
    const context = audioContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.0001;

    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    oscillator.start(now);
    oscillator.stop(now + 0.36);
  } catch {
    // Audio may be blocked until a user gesture on some browsers.
  }
}

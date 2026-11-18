// Sound, synthesized live with WebAudio: no audio files, nothing to load.
// Every colour sings one note of a pentatonic ladder, so catching a sequence
// in order plays a little melody; a finished constellation is an arpeggio.
// The context is only created on the first user gesture (browsers demand it),
// and every call is guarded, so a headless screenshot run stays silent.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context !== null) return context;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, dur, type, gain, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const start = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    // One note for the caught colour.
    caught(pitch) {
      tone(pitch, 0.22, 'sine', 0.16);
      tone(pitch * 2, 0.14, 'triangle', 0.05);
    },
    // A rising arpeggio when a constellation is complete.
    complete() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => tone(n, 0.34, 'triangle', 0.14, i * 0.07));
      tone(1318.5, 0.5, 'sine', 0.08, 0.3);
    },
    // A low thud when the wrong colour shatters in the bowl.
    wrong() {
      tone(110, 0.28, 'sawtooth', 0.14);
      tone(55, 0.32, 'square', 0.08);
    },
    // A bright chime for a moonstone.
    moonstone() {
      tone(880, 0.3, 'sine', 0.12);
      tone(1318.5, 0.42, 'sine', 0.09, 0.08);
    },
    // A quick sparkle for a comet.
    comet() {
      tone(1567.98, 0.18, 'triangle', 0.1);
      tone(2093.0, 0.24, 'sine', 0.07, 0.05);
    },
    // A short fanfare when the forge is mastered.
    win() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      notes.forEach((n, i) => tone(n, 0.4, 'triangle', 0.13, i * 0.09));
    },
  };
}

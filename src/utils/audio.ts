// Ambient audio synth & player using Web Audio API and HTMLAudioElement

let audioCtx: AudioContext | null = null;
let isSynthesizing = false;
let synthTimer: any = null;

export const playAmbientChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Pentatonic scale frequencies for soothing eastern / ambient scale (D minor / oriental vibe)
    const scale = [293.66, 329.63, 349.23, 440.00, 523.25, 587.33, 659.25, 698.46, 880.00];
    const freq = scale[Math.floor(Math.random() * scale.length)];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Soft chime envelope
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 3.2);
  } catch (err) {
    console.error('Ambient chime error:', err);
  }
};

export const startAmbientLoop = () => {
  if (isSynthesizing) return;
  isSynthesizing = true;
  playAmbientChime();
  synthTimer = setInterval(() => {
    if (isSynthesizing) {
      playAmbientChime();
    }
  }, 3200);
};

export const stopAmbientLoop = () => {
  isSynthesizing = false;
  if (synthTimer) {
    clearInterval(synthTimer);
    synthTimer = null;
  }
};

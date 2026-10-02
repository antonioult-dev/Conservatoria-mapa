/**
 * Web Audio API Acoustic Seresta Violão Synthesizer
 * Generates resonant classical acoustic guitar arpeggios typical of Conservatória serestas.
 * Works 100% offline, zero network requests.
 */

let audioCtx: AudioContext | null = null;
let isPlayingSeresta = false;
let serestaInterval: number | null = null;
let onPlayStateChangeCallback: ((playing: boolean) => void) | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pluck a guitar string with nylon-like timbre (filtered harmonics + decay)
function pluckNote(freq: number, time: number, duration: number = 1.8, velocity: number = 0.5) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(freq * 2, time);

  // Warm nylon filter
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, time);
  filter.frequency.exponentialRampToValueAtTime(320, time + duration);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(velocity * 0.45, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  subOsc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  subOsc.start(time);
  osc.stop(time + duration);
  subOsc.stop(time + duration);
}

// Chords for classic seresta arpeggio (Valsinha / Serenata em Lá Menor)
// Frequencies in Hz
const Am = [110, 164.81, 220, 261.63, 329.63, 440]; // A2, E3, A3, C4, E4, A4
const Dm = [146.83, 220, 293.66, 349.23, 440, 587.33]; // D3, A3, D4, F4, A4, D5
const E7 = [123.47, 164.81, 246.94, 311.13, 370.0, 493.88]; // B2, E3, B3, D#4, F#4, B4
const Fmaj = [87.31, 130.81, 174.61, 220, 261.63, 349.23]; // F2, C3, F3, A3, C4, F4

const chordProgression = [Am, Dm, E7, Am, Fmaj, E7, Am, Am];

export function toggleSerestaAudio(onStateChange?: (playing: boolean) => void): boolean {
  if (onStateChange) {
    onPlayStateChangeCallback = onStateChange;
  }

  if (isPlayingSeresta) {
    stopSerestaAudio();
    return false;
  } else {
    startSerestaAudio();
    return true;
  }
}

export function startSerestaAudio() {
  const ctx = getAudioContext();
  isPlayingSeresta = true;
  if (onPlayStateChangeCallback) onPlayStateChangeCallback(true);

  let chordIndex = 0;

  const playBar = () => {
    if (!isPlayingSeresta) return;
    const now = ctx.currentTime;
    const chord = chordProgression[chordIndex % chordProgression.length];

    // Classic 3/4 Valsinha Seresteira fingerpicking: Bass, 3rd, 2nd, 1st, 2nd, 3rd
    const pattern = [
      { noteIdx: 0, timeOffset: 0.0, dur: 2.2, vel: 0.7 },      // Bass note
      { noteIdx: 2, timeOffset: 0.28, dur: 1.4, vel: 0.45 },
      { noteIdx: 3, timeOffset: 0.56, dur: 1.4, vel: 0.5 },
      { noteIdx: 4, timeOffset: 0.84, dur: 1.6, vel: 0.6 },
      { noteIdx: 3, timeOffset: 1.12, dur: 1.2, vel: 0.45 },
      { noteIdx: 2, timeOffset: 1.40, dur: 1.2, vel: 0.4 },
    ];

    pattern.forEach((p) => {
      const noteFreq = chord[p.noteIdx] || chord[0];
      pluckNote(noteFreq, now + p.timeOffset, p.dur, p.vel);
    });

    chordIndex++;
  };

  playBar();
  serestaInterval = window.setInterval(playBar, 1700);
}

export function stopSerestaAudio() {
  isPlayingSeresta = false;
  if (serestaInterval) {
    clearInterval(serestaInterval);
    serestaInterval = null;
  }
  if (onPlayStateChangeCallback) onPlayStateChangeCallback(false);
}

export function isSerestaPlaying(): boolean {
  return isPlayingSeresta;
}

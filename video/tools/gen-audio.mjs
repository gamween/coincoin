// Synthesizes royalty-free SFX + an ambient music bed as WAVs (no deps).
// Run: node tools/gen-audio.mjs   → writes tools/_raw/*.wav
// A follow-up ffmpeg step converts/cleans them into public/audio/**.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 44100;
const OUT = new URL("./_raw/", import.meta.url);
mkdirSync(OUT, { recursive: true });

// ---- WAV writer (stereo 16-bit) ----
function writeWav(name, left, right = left) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buf.writeInt16LE((l * 32767) | 0, o);
    buf.writeInt16LE((r * 32767) | 0, o + 2);
    o += 4;
  }
  writeFileSync(new URL(name + ".wav", OUT), buf);
  console.log("wrote", name, `(${(n / SR).toFixed(2)}s)`);
}

const soft = (x) => Math.tanh(x * 1.2); // gentle saturation / limiter
const sine = (t, f) => Math.sin(2 * Math.PI * f * t);
// click-free attack + exponential-ish decay envelope
const env = (t, dur, attack = 0.006, curve = 4) => {
  if (t < 0 || t > dur) return 0;
  const a = Math.min(1, t / attack);
  const rel = Math.pow(1 - t / dur, curve);
  return a * rel;
};

// ---------- SFX ----------
function boom() {
  const dur = 0.38;
  const N = (dur * SR) | 0;
  const s = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const f = 120 * Math.pow(45 / 120, t / dur); // 120 → 45 Hz drop
    const body = sine(t, f) * env(t, dur, 0.004, 3);
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 90) * 0.4;
    s[i] = soft((body * 0.9 + click) * 0.85);
  }
  writeWav("boom", s);
}

function pop() {
  const dur = 0.14;
  const N = (dur * SR) | 0;
  const s = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const f = 480 + 700 * (t / dur);
    s[i] = soft(sine(t, f) * env(t, dur, 0.003, 5) * 0.6);
  }
  writeWav("pop", s);
}

function whoosh() {
  const dur = 0.5;
  const N = (dur * SR) | 0;
  const l = new Float32Array(N);
  const r = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    // raised-cosine swell, noise + faint rising tone (ffmpeg adds the bandpass)
    const swell = Math.sin(Math.PI * (t / dur));
    const noise = (Math.random() * 2 - 1) * swell * 0.5;
    const tone = sine(t, 200 + 500 * (t / dur)) * swell * 0.12;
    l[i] = soft((noise + tone) * 0.7);
    r[i] = soft(((Math.random() * 2 - 1) * swell * 0.5 + tone) * 0.7);
  }
  writeWav("whoosh", l, r);
}

function alert() {
  const dur = 0.42;
  const N = (dur * SR) | 0;
  const s = new Float32Array(N);
  const beep = (t, t0, len, f) => {
    const lt = t - t0;
    if (lt < 0 || lt > len) return 0;
    // square-ish via summed odd harmonics, soft
    const v = sine(lt, f) + 0.3 * sine(lt, f * 3) + 0.15 * sine(lt, f * 5);
    return v * env(lt, len, 0.004, 3);
  };
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    s[i] = soft((beep(t, 0, 0.16, 920) + beep(t, 0.2, 0.18, 700)) * 0.34);
  }
  writeWav("alert", s);
}

function chime() {
  const dur = 0.72;
  const N = (dur * SR) | 0;
  const l = new Float32Array(N);
  const r = new Float32Array(N);
  const notes = [
    [523.25, 0.0],
    [659.25, 0.12],
    [783.99, 0.24],
    [1046.5, 0.36],
  ];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let v = 0;
    for (const [f, t0] of notes) {
      const lt = t - t0;
      if (lt < 0) continue;
      const e = Math.exp(-lt * 4.2) * (1 - Math.exp(-lt * 120));
      v += (sine(lt, f) + 0.25 * sine(lt, f * 2)) * e;
    }
    l[i] = soft(v * 0.26);
    r[i] = soft(v * 0.26 * 0.98);
  }
  writeWav("chime", l, r);
}

// ---------- Ambient music bed ----------
function music() {
  const chordDur = 5;
  const loops = 4; // 4 chords × 5s × 4 = 80s
  const chords = [
    [261.63, 329.63, 392.0, 587.33], // Cadd9
    [196.0, 246.94, 293.66, 392.0], // G
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
  ];
  const total = chordDur * chords.length * loops;
  const N = (total * SR) | 0;
  const l = new Float32Array(N);
  const r = new Float32Array(N);
  // smooth per-chord gate (cross-attack/release so chords blend)
  const gate = (lt) => Math.min(1, lt / 0.9) * Math.min(1, (chordDur - lt) / 1.2);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const idx = Math.floor(t / chordDur) % chords.length;
    const lt = t - Math.floor(t / chordDur) * chordDur;
    const g = Math.max(0, gate(lt));
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.08 * t); // slow swell
    const ch = chords[idx];
    let vl = 0;
    let vr = 0;
    for (let k = 0; k < ch.length; k++) {
      const f = ch[k];
      const w = k === 0 ? 0.9 : 0.6 - k * 0.06; // root strongest
      // two slightly detuned layers panned for width
      vl += (sine(t, f * 0.9985) + 0.18 * sine(t, f * 2)) * w;
      vr += (sine(t, f * 1.0015) + 0.18 * sine(t, f * 2)) * w;
    }
    // sub bass on the root
    const sub = sine(t, ch[0] / 2) * 0.5;
    const amp = 0.13 * g * lfo;
    l[i] = (vl / ch.length + sub) * amp;
    r[i] = (vr / ch.length + sub) * amp;
  }
  // one-pole lowpass for warmth (Remotion's ffmpeg lacks the lowpass filter)
  lowpass(l, 2600);
  lowpass(r, 2600);
  // light reverb (a few attenuated taps) for a touch of space
  reverb(l);
  reverb(r);
  // fades in/out
  fade(l);
  fade(r);
  for (let i = 0; i < N; i++) {
    l[i] = soft(l[i]);
    r[i] = soft(r[i]);
  }
  writeWav("music", l, r);
}

function lowpass(buf, fc) {
  const dt = 1 / SR;
  const rc = 1 / (2 * Math.PI * fc);
  const a = dt / (rc + dt);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y = y + a * (buf[i] - y);
    buf[i] = y;
  }
}

function reverb(buf) {
  const taps = [
    [0.041, 0.16],
    [0.077, 0.11],
    [0.123, 0.07],
  ];
  const src = Float32Array.from(buf);
  for (const [delay, gain] of taps) {
    const d = (delay * SR) | 0;
    for (let i = d; i < buf.length; i++) buf[i] += src[i - d] * gain;
  }
}

function fade(buf) {
  const inN = (2.5 * SR) | 0;
  const outN = (3 * SR) | 0;
  for (let i = 0; i < inN; i++) buf[i] *= i / inN;
  for (let i = 0; i < outN; i++) buf[buf.length - 1 - i] *= i / outN;
}

boom();
pop();
whoosh();
alert();
chime();
music();
console.log("done");

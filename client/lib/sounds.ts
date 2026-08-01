// Lightweight notification sounds generated with the Web Audio API —
// no audio files to host, no network request, works offline.
//
// Browsers block audio until the user has interacted with the page at
// least once (autoplay policy). Since these only ever fire in response
// to socket events that happen well after the user has clicked around
// the app, that's a non-issue in practice — but resumeAudio() is safe
// to call defensively before each sound just in case.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!ctx) {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  return ctx;
}

type Tone = {
  freq: number;
  start: number; // seconds from now
  duration: number; // seconds
  type?: OscillatorType;
  gain?: number;
};

function playTones(tones: Tone[]) {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  tones.forEach(({ freq, start, duration, type = "sine", gain = 0.15 }) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);

    // Quick fade in/out so notes "pop" instead of clicking
    gainNode.gain.setValueAtTime(0, now + start);
    gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      now + start + duration
    );

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  });
}

// Incoming message in a random-stranger chat — one short, neutral blip
export function playMessageSound() {
  playTones([{ freq: 720, start: 0, duration: 0.09, type: "sine", gain: 0.14 }]);
}

// Incoming friend DM — slightly brighter two-note ping, distinct from
// the stranger-chat blip so the two are easy to tell apart by ear
export function playDmSound() {
  playTones([
    { freq: 880, start: 0, duration: 0.09, type: "sine", gain: 0.16 },
    { freq: 1175, start: 0.09, duration: 0.12, type: "sine", gain: 0.14 },
  ]);
}

// Friend request received — a small cheerful three-note rise
export function playFriendRequestSound() {
  playTones([
    { freq: 523.25, start: 0, duration: 0.1, type: "triangle", gain: 0.13 },
    { freq: 659.25, start: 0.1, duration: 0.1, type: "triangle", gain: 0.13 },
    { freq: 783.99, start: 0.2, duration: 0.16, type: "triangle", gain: 0.13 },
  ]);
}

// Two people connect (matched with a stranger) — a bright confirming
// two-note chime, different in character from the friend-request one
export function playConnectSound() {
  playTones([
    { freq: 587.33, start: 0, duration: 0.11, type: "sine", gain: 0.16 },
    { freq: 880, start: 0.1, duration: 0.18, type: "sine", gain: 0.16 },
  ]);
}

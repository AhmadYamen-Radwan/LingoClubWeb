// Web Speech API TTS & Speech-to-Text + WebAudio Mic Level Visualizer
// Includes clean iOS Safari fallback & resource disposal

class TtsService {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
    this._voices = [];
    this._seqCancelled = false;
    this.isSpeaking = false;

    if (this.synth) {
      const load = () => {
        try {
          this._voices = this.synth.getVoices() || [];
        } catch (_) {}
      };
      load();
      if (typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = load;
      }
    }
  }

  isSupported() {
    return Boolean(this.synth);
  }

  _pickVoice(langPrefix) {
    if (!this._voices.length && this.synth) {
      this._voices = this.synth.getVoices() || [];
    }
    const lower = langPrefix.toLowerCase();
    return (
      this._voices.find((v) => v.lang.toLowerCase().startsWith(lower) && v.localService) ||
      this._voices.find((v) => v.lang.toLowerCase().startsWith(lower)) ||
      null
    );
  }

  stop() {
    this._seqCancelled = true;
    this.isSpeaking = false;
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (_) {}
    }
  }

  speak(text, { lang = 'en-US', rate = 1.0, onEnd = null } = {}) {
    const clean = String(text || '').trim();
    if (!clean || !this.synth) {
      onEnd?.();
      return;
    }
    this._seqCancelled = true;
    try {
      this.synth.cancel();
    } catch (_) {}

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = lang;
    utt.rate = Math.min(Math.max(Number(rate) || 1.0, 0.5), 1.8);
    const voice = this._pickVoice(lang.slice(0, 2));
    if (voice) utt.voice = voice;

    this.isSpeaking = true;
    utt.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    utt.onerror = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    try {
      this.synth.speak(utt);
    } catch (_) {
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  speakParagraphs(paragraphs, { startIndex = 0, lang = 'en-US', rate = 1.0, onParagraphStart, onComplete } = {}) {
    if (!this.synth || !paragraphs?.length) {
      onComplete?.();
      return;
    }
    this.stop();
    this._seqCancelled = false;

    const speakNext = (idx) => {
      if (this._seqCancelled || idx >= paragraphs.length) {
        this.isSpeaking = false;
        if (!this._seqCancelled) onComplete?.();
        return;
      }
      onParagraphStart?.(idx);
      const utt = new SpeechSynthesisUtterance(String(paragraphs[idx] || ''));
      utt.lang = lang;
      utt.rate = Math.min(Math.max(Number(rate) || 1.0, 0.5), 1.8);
      const voice = this._pickVoice(lang.slice(0, 2));
      if (voice) utt.voice = voice;
      this.isSpeaking = true;
      utt.onend = () => {
        if (!this._seqCancelled) speakNext(idx + 1);
      };
      utt.onerror = () => {
        this.isSpeaking = false;
        if (!this._seqCancelled) onComplete?.();
      };
      try {
        this.synth.speak(utt);
      } catch (_) {
        this.isSpeaking = false;
        onComplete?.();
      }
    };

    speakNext(Math.max(0, startIndex));
  }
}

export const ttsSpeaker = new TtsService();

export class SpeechInputController {
  constructor() {
    this.recognition = null;
    this.audioCtx = null;
    this.mediaStream = null;
    this.rafId = null;
    this.isListening = false;
  }

  isSpeechApiSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async start({
    lang = 'en-US',
    existingText = '',
    onTranscript,
    onMicLevel,
    onError,
    onEnd
  }) {
    this.stop();
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      onError?.('Live speech recognition is not supported in this browser. Type or paste your spoken line below.');
      onEnd?.();
      return;
    }

    // Optional WebAudio mic level visualizer
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
          this.audioCtx = new Ctx();
          const src = this.audioCtx.createMediaStreamSource(this.mediaStream);
          const analyser = this.audioCtx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const buf = new Uint8Array(analyser.frequencyBinCount);
          const pump = () => {
            if (!this.isListening) return;
            analyser.getByteFrequencyData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) sum += buf[i];
            const level = Math.min(1, (sum / buf.length) / 90);
            onMicLevel?.(level);
            this.rafId = requestAnimationFrame(pump);
          };
          this.isListening = true;
          this.rafId = requestAnimationFrame(pump);
        }
      } catch (_) {
        // Continue with SpeechRecognition even if AudioContext analyser wasn't granted separately
      }
    }

    const rec = new Rec();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    this.recognition = rec;
    this.isListening = true;

    let finalPrefix = existingText ? existingText.trim() + ' ' : '';

    rec.onresult = (ev) => {
      let interim = '';
      let finals = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const txt = res[0]?.transcript || '';
        if (res.isFinal) finals += txt + ' ';
        else interim += txt;
      }
      if (finals) finalPrefix += finals;
      onTranscript?.((finalPrefix + interim).trim());
    };

    rec.onerror = (ev) => {
      const code = ev?.error || 'unknown';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        onError?.('Microphone permission denied. Allow mic access in browser settings or type your line directly.');
      } else if (code !== 'aborted' && code !== 'no-speech') {
        onError?.(`Voice recognition notice (${code}). You can edit the transcript manually.`);
      }
    };

    rec.onend = () => {
      this.stop();
      onEnd?.();
    };

    try {
      rec.start();
    } catch (err) {
      this.stop();
      onError?.('Could not start microphone (' + (err?.message || 'error') + ').');
      onEnd?.();
    }
  }

  stop() {
    this.isListening = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => {
        try { t.stop(); } catch (_) {}
      });
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (_) {}
      this.audioCtx = null;
    }
  }
}

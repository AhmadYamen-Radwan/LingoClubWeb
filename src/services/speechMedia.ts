interface SpeakOptions {
  lang?: string;
  rate?: number;
  onEnd?: () => void;
}

interface ParagraphSpeakOptions {
  startIndex?: number;
  lang?: string;
  rate?: number;
  onParagraphStart?: (index: number) => void;
  onComplete?: () => void;
}

interface SpeechInputStartOptions {
  lang?: string;
  existingText?: string;
  onTranscript?: (text: string) => void;
  onMicLevel?: (level: number) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript?: string };
  }>;
}

function getSpeechRecCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition;
}

class TtsService {
  private synth: SpeechSynthesis | null;
  private voices: SpeechSynthesisVoice[] = [];
  private seqCancelled = false;
  public isSpeaking = false;

  constructor() {
    this.synth =
      typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis
        : null;
    if (this.synth) {
      const load = () => {
        try {
          this.voices = this.synth?.getVoices() || [];
        } catch {
          this.voices = [];
        }
      };
      load();
      if (typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = load;
      }
    }
  }

  isSupported(): boolean {
    return Boolean(this.synth);
  }

  private pickVoice(langPrefix: string): SpeechSynthesisVoice | null {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices() || [];
    }
    const lower = langPrefix.toLowerCase();
    return (
      this.voices.find((v) => v.lang.toLowerCase().startsWith(lower) && v.localService) ||
      this.voices.find((v) => v.lang.toLowerCase().startsWith(lower)) ||
      null
    );
  }

  stop(): void {
    this.seqCancelled = true;
    this.isSpeaking = false;
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore browser synth cancel quirks
      }
    }
  }

  speak(text: string, { lang = 'en-US', rate = 1.0, onEnd }: SpeakOptions = {}): void {
    const clean = String(text || '').trim();
    if (!clean || !this.synth) {
      onEnd?.();
      return;
    }
    this.seqCancelled = true;
    try {
      this.synth.cancel();
    } catch {
      // Ignore
    }

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = lang;
    utt.rate = Math.min(Math.max(Number(rate) || 1.0, 0.5), 1.8);
    const voice = this.pickVoice(lang.slice(0, 2));
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
    } catch {
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  speakParagraphs(
    paragraphs: string[],
    { startIndex = 0, lang = 'en-US', rate = 1.0, onParagraphStart, onComplete }: ParagraphSpeakOptions = {}
  ): void {
    if (!this.synth || !paragraphs?.length) {
      onComplete?.();
      return;
    }
    this.stop();
    this.seqCancelled = false;

    const speakNext = (idx: number) => {
      if (this.seqCancelled || idx >= paragraphs.length) {
        this.isSpeaking = false;
        if (!this.seqCancelled) onComplete?.();
        return;
      }
      onParagraphStart?.(idx);
      const utt = new SpeechSynthesisUtterance(String(paragraphs[idx] || ''));
      utt.lang = lang;
      utt.rate = Math.min(Math.max(Number(rate) || 1.0, 0.5), 1.8);
      const voice = this.pickVoice(lang.slice(0, 2));
      if (voice) utt.voice = voice;
      this.isSpeaking = true;
      utt.onend = () => {
        if (!this.seqCancelled) speakNext(idx + 1);
      };
      utt.onerror = () => {
        this.isSpeaking = false;
        if (!this.seqCancelled) onComplete?.();
      };
      try {
        this.synth?.speak(utt);
      } catch {
        this.isSpeaking = false;
        onComplete?.();
      }
    };

    speakNext(Math.max(0, startIndex));
  }
}

export const ttsSpeaker = new TtsService();

export class SpeechInputController {
  private recognition: InstanceType<SpeechRecognitionCtor> | null = null;
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private rafId: number | null = null;
  public isListening = false;

  isSpeechApiSupported(): boolean {
    return Boolean(getSpeechRecCtor());
  }

  async start({
    lang = 'en-US',
    existingText = '',
    onTranscript,
    onMicLevel,
    onError,
    onEnd,
  }: SpeechInputStartOptions): Promise<void> {
    this.stop();
    const Rec = getSpeechRecCtor();
    if (!Rec) {
      onError?.('Live speech recognition is not supported in this browser. Type your spoken line below.');
      onEnd?.();
      return;
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const win = window as unknown as {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        };
        const Ctx = win.AudioContext || win.webkitAudioContext;
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
            const level = Math.min(1, sum / buf.length / 90);
            onMicLevel?.(level);
            this.rafId = requestAnimationFrame(pump);
          };
          this.isListening = true;
          this.rafId = requestAnimationFrame(pump);
        }
      } catch {
        // Proceed with SpeechRecognition even without separate AudioContext meter
      }
    }

    const rec = new Rec();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    this.recognition = rec;
    this.isListening = true;

    let finalPrefix = existingText ? `${existingText.trim()} ` : '';

    rec.onresult = (ev) => {
      let interim = '';
      let finals = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const txt = res[0]?.transcript || '';
        if (res.isFinal) finals += `${txt} `;
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
      const msg = err instanceof Error ? err.message : 'error';
      onError?.(`Could not start microphone (${msg}).`);
      onEnd?.();
    }
  }

  stop(): void {
    this.isListening = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // Ignore
        }
      });
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      try {
        void this.audioCtx.close();
      } catch {
        // Ignore
      }
      this.audioCtx = null;
    }
  }
}

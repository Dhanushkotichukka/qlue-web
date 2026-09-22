/**
 * Speech-to-text via the Web Speech API — the browser-native equivalent of the
 * Flutter `speech_to_text` service. Mirrors its interface: init / startListening
 * (partial + final callbacks) / stop / reInitialize / isListening.
 *
 * Note: SpeechRecognition is supported in Chromium browsers (Chrome, Edge) and
 * Safari (webkit prefix). Firefox does not implement it.
 */

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

interface ListenArgs {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (msg: string) => void;
  onStatus?: (status: string) => void;
}

export class SttService {
  private recognition: SpeechRecognitionLike | null = null;
  private initialized = false;
  private listening = false;
  private localeId = 'en-IN';
  private finalBuffer = '';
  private args: ListenArgs | null = null;

  async init(): Promise<boolean> {
    if (this.initialized) return true;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      this.initialized = false;
      return false;
    }
    // Prefer the device's English locale where exposed.
    const navLang = navigator.language || '';
    if (navLang.toLowerCase().startsWith('en')) {
      this.localeId = navLang;
    }
    this.initialized = true;
    return true;
  }

  async reInitialize(): Promise<void> {
    this.initialized = false;
    this.stop();
    await this.init();
  }

  startListening(args: ListenArgs): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      args.onError?.('Speech recognition is not supported in this browser.');
      return;
    }
    this.args = args;
    this.finalBuffer = '';

    const rec = new Ctor();
    rec.lang = this.localeId;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      this.listening = true;
      args.onStatus?.('listening');
    };

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          this.finalBuffer += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      const partial = (this.finalBuffer + interim).trim();
      if (partial) args.onPartial(partial);
    };

    rec.onerror = (e: any) => {
      const err = e?.error ?? 'unknown';
      // 'no-speech' / 'aborted' are benign flow-control signals, surface as status
      if (err === 'no-speech' || err === 'aborted') {
        args.onStatus?.('done');
      } else {
        args.onError?.(String(err));
      }
    };

    rec.onend = () => {
      this.listening = false;
      const finalText = this.finalBuffer.trim();
      args.onStatus?.('done');
      // Emit the accumulated final transcript when the engine stops.
      args.onFinal(finalText);
    };

    this.recognition = rec;
    try {
      rec.start();
    } catch (err) {
      args.onError?.(String(err));
    }
  }

  stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
    }
    this.listening = false;
  }

  get isListening(): boolean {
    return this.listening;
  }
}

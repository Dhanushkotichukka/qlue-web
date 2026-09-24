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
  private currentInterim = '';
  private args: ListenArgs | null = null;
  private endpointTimer: ReturnType<typeof setTimeout> | null = null;

  // END-OF-SPEECH ENDPOINTING (latency fix):
  // With `continuous = true`, Chrome keeps the mic session open long after the
  // user stops talking and only fires `onend` after its own internal silence
  // timeout (frequently 8s+). That tail is the "it takes too long after I
  // finish speaking" lag — the Flutter app feels instant because the native
  // mobile recognizer endpoints ~1s after speech ends. We reproduce that by
  // auto-stopping this many ms after the LAST recognized word. Long enough to
  // ride over natural inter-word/inter-sentence pauses, short enough to feel
  // responsive. Tunable: raise if users get cut off while thinking mid-answer.
  private static readonly endOfSpeechMs = 2500;

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
    this.currentInterim = '';

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
      this.currentInterim = interim;
      const partial = (this.finalBuffer + interim).trim();
      if (partial) {
        args.onPartial(partial);
        // The user is actively speaking — (re)start the end-of-speech
        // countdown so we only submit once they've truly gone quiet.
        this.armEndpoint();
      }
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
      this.clearEndpoint();
      // Prefer the finalized transcript, but fall back to the last interim so a
      // turn is never lost when Chrome ends before promoting it to final.
      const finalText = (this.finalBuffer + this.currentInterim).trim();
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

  /**
   * Restart the silence countdown. When it elapses we `stop()` the recognizer,
   * which flushes the pending result and fires `onend` → onFinal, submitting
   * the turn without waiting for Chrome's much longer built-in timeout.
   */
  private armEndpoint(): void {
    this.clearEndpoint();
    this.endpointTimer = setTimeout(() => {
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {
          /* ignore */
        }
      }
    }, SttService.endOfSpeechMs);
  }

  private clearEndpoint(): void {
    if (this.endpointTimer) {
      clearTimeout(this.endpointTimer);
      this.endpointTimer = null;
    }
  }

  stop(): void {
    this.clearEndpoint();
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

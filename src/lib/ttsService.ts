/**
 * Audio playback for AI turn audio — the web equivalent of the Flutter
 * `just_audio` TtsService. playUrl / playBase64 resolve when playback finishes
 * (with a 30s safety timeout so a stalled stream never hangs the turn loop).
 */
export class TtsService {
  private audio: HTMLAudioElement | null = null;

  private async playSource(src: string, onStart?: () => void): Promise<void> {
    await this.stop();
    return new Promise<void>((resolve) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      this.audio = audio;

      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        audio.onended = null;
        audio.onerror = null;
        audio.onplaying = null;
        resolve();
      };

      // Hard safety timeout — mirrors the Dart 30s onTimeout fallback.
      const safety = setTimeout(done, 30_000);

      audio.onended = done;
      audio.onerror = done;

      // Fire the moment sound actually begins (after the browser has buffered
      // enough to play), so the caller can reveal the question text in sync
      // with the voice instead of several seconds ahead of it.
      let started = false;
      audio.onplaying = () => {
        if (started) return;
        started = true;
        onStart?.();
      };

      audio.play().catch(() => {
        // Autoplay can be blocked until the user gestures; the interview flow
        // starts from a tap, so this rarely fires. Resolve to keep the loop
        // moving rather than stranding the turn.
        done();
      });
    });
  }

  playUrl(url: string, onStart?: () => void): Promise<void> {
    return this.playSource(url, onStart);
  }

  playBase64(base64Data: string, onStart?: () => void, mime = 'audio/mpeg'): Promise<void> {
    return this.playSource(`data:${mime};base64,${base64Data}`, onStart);
  }

  async stop(): Promise<void> {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.src = '';
      } catch {
        /* ignore */
      }
      this.audio = null;
    }
  }
}

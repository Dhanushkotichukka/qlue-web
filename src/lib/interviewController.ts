import axios from 'axios';
import { api } from './apiClient';
import { Api } from '@/config/env';
import { Env } from '@/config/env';
import { currentIdToken, auth } from './firebase';
import { WebSocketClient } from './websocketClient';
import { SttService } from './sttService';
import { TtsService } from './ttsService';

export type InterviewPhase = 'ready' | 'speaking' | 'listening' | 'processing' | 'error';

export interface TranscriptEntry {
  role: 'AI' | 'USER';
  text: string;
  timestamp: Date;
}

export interface InterviewSnapshot {
  phase: InterviewPhase;
  sessionId: string | null;
  moduleType: string | null;
  currentQuestion: string | null;
  questionText: string;
  finalQuestionText: string;
  subtitleText: string;
  isStreamingText: boolean;
  partialTranscript: string;
  finalTranscript: string;
  isConnecting: boolean;
  isListening: boolean;
  isSessionEnded: boolean;
  silenceStrikes: number;
  errorMessage: string | null;
  transcript: TranscriptEntry[];
  selectedVoiceId: string;
  voiceMode: string;
  activeSessionConflictId: string | null;
}

/**
 * Faithful port of the Flutter InterviewProvider. Holds the full imperative
 * turn loop (WS + STT + TTS) and emits an immutable snapshot to subscribers.
 */
export class InterviewController {
  private listeners = new Set<() => void>();
  private snapshot: InterviewSnapshot;

  // mutable working state
  private phase: InterviewPhase = 'ready';
  sessionId: string | null = null;
  moduleType: string | null = null;
  private currentQuestion: string | null = null;
  private audioUrl: string | null = null;
  private transcript: TranscriptEntry[] = [];
  private errorMessage: string | null = null;
  private selectedVoiceId = 'Tiffany';
  private selectedEngine = 'neural';
  private voiceMode = 'cost_saver';

  private questionText = '...';
  private finalQuestionText = '';
  private subtitleText = '';
  private isStreamingText = false;
  private partialTranscript = '';
  private finalTranscript = '';
  private isConnecting = false;
  private isListening = false;
  private isSessionEnded = false;
  private silenceStrikes = 0;
  private sttRetryCount = 0;
  private activeSessionConflictId: string | null = null;

  private ws: WebSocketClient | null = null;
  private stt = new SttService();
  private tts = new TtsService();

  private isEnding = false;
  private isInitializing = false;
  private pendingTermination = false;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.snapshot = this.buildSnapshot();
  }

  // ---- external store plumbing ----------------------------------------
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  getSnapshot = (): InterviewSnapshot => this.snapshot;

  private buildSnapshot(): InterviewSnapshot {
    return {
      phase: this.phase,
      sessionId: this.sessionId,
      moduleType: this.moduleType,
      currentQuestion: this.currentQuestion,
      questionText: this.questionText,
      finalQuestionText: this.finalQuestionText,
      subtitleText: this.subtitleText,
      isStreamingText: this.isStreamingText,
      partialTranscript: this.partialTranscript,
      finalTranscript: this.finalTranscript,
      isConnecting: this.isConnecting,
      isListening: this.isListening,
      isSessionEnded: this.isSessionEnded,
      silenceStrikes: this.silenceStrikes,
      errorMessage: this.errorMessage,
      transcript: [...this.transcript],
      selectedVoiceId: this.selectedVoiceId,
      voiceMode: this.voiceMode,
      activeSessionConflictId: this.activeSessionConflictId,
    };
  }

  private notify(): void {
    this.snapshot = this.buildSnapshot();
    this.listeners.forEach((l) => l());
  }

  // ---- public API ------------------------------------------------------
  setVoice(voiceId: string, opts?: { engine?: string; voiceMode?: string }): void {
    this.selectedVoiceId = voiceId;
    this.voiceMode = opts?.voiceMode ?? 'cost_saver';
    this.selectedEngine =
      opts?.engine ?? (this.voiceMode === 'premium' ? 'generative' : 'neural');
    this.notify();
  }

  resetForNewSession(): void {
    this.cleanup();
    this.isEnding = false;
    this.isInitializing = false;
    this.isSessionEnded = false;
    this.isConnecting = true;
    this.sessionId = null;
    this.subtitleText = '';
    this.isStreamingText = false;
    this.finalTranscript = '';
    this.partialTranscript = '';
    this.questionText = '';
    this.finalQuestionText = '';
    this.transcript = [];
    this.phase = 'ready';
    this.silenceStrikes = 0;
    this.errorMessage = null;
    this.activeSessionConflictId = null;
    this.notify();
  }

  async initSession(
    type: string,
    opts?: { resumeId?: string; websiteUrl?: string },
    retried = false,
  ): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;
    try {
      this.moduleType = type;
      this.isConnecting = true;
      this.errorMessage = null;
      this.notify();

      await this.stt.init();

      const user = auth().currentUser;
      const idToken = await currentIdToken();
      if (!user || !idToken) {
        this.errorMessage = 'Authentication required. Please log in again.';
        this.isConnecting = false;
        this.notify();
        return;
      }

      // Create backend session first
      try {
        const res = await api().post(Api.interviewInit, {
          moduleType: this.moduleType,
          voiceId: this.selectedVoiceId,
          engine: this.selectedEngine,
          voiceMode: this.voiceMode,
          resumeId: opts?.resumeId,
          websiteUrl: opts?.websiteUrl,
        });
        this.sessionId = res.data?.sessionId?.toString() ?? null;
        if (!this.sessionId) throw new Error('Invalid sessionId returned from interview init');
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          const activeId = e.response?.data?.activeSessionId?.toString();
          if (activeId && !retried) {
            // A previous session is still open on the backend — almost always
            // an interview that failed before it could terminate. Clear it and
            // start fresh once, instead of dead-ending the user on a start
            // they explicitly asked for.
            try {
              await api().post(Api.interviewTerminate, {
                sessionId: activeId,
                reason: 'STALE_SESSION_CLEANUP',
              });
            } catch {
              /* best-effort cleanup */
            }
            this.isInitializing = false; // release the guard before retrying
            await this.initSession(type, opts, true);
            return;
          }
          if (activeId) {
            this.errorMessage =
              'You still have an active interview session. Please end it and try again.';
            this.sessionId = activeId;
            this.activeSessionConflictId = activeId;
            this.isConnecting = false;
            this.notify();
            return;
          }
        }
        this.errorMessage = `Failed to initialize interview session: ${e}`;
        this.isConnecting = false;
        this.notify();
        return;
      }

      this.ws = new WebSocketClient(Env.websocketUrl, user.uid, this.sessionId, {
        onMessage: (m) => this.handleWsMessage(m),
        onError: (err) => {
          this.errorMessage = err;
          this.notify();
        },
        onDisconnect: () => {
          if (!this.isSessionEnded) {
            this.isSessionEnded = true;
            this.phase = 'ready';
            this.notify();
          }
        },
        onReconnect: () => {
          if (!this.isSessionEnded && this.sessionId) {
            this.ws?.sendMessage({
              type: 'session_reconnect',
              payload: { sessionId: this.sessionId },
            });
          }
        },
      });

      try {
        await this.ws.connect(idToken);
        await this.ws.waitForConnection();
      } catch (e) {
        this.errorMessage = `Failed to connect: ${e}`;
        this.isConnecting = false;
        this.notify();
        return;
      }

      this.ws.sendMessage({
        type: 'session_init',
        payload: {
          sessionId: this.sessionId,
          moduleType: this.moduleType,
          voiceId: this.selectedVoiceId,
          engine: this.selectedEngine,
          voiceMode: this.voiceMode,
          resumeId: opts?.resumeId,
          websiteUrl: opts?.websiteUrl,
        },
      });
      this.isConnecting = false;
      this.notify();
    } finally {
      this.isInitializing = false;
    }
  }

  private handleWsMessage(message: any): void {
    switch (message?.type) {
      case 'text_stream':
        this.handleTextStream(message.payload ?? {});
        break;
      case 'turn_complete':
        this.handleTurnComplete(message.payload ?? {});
        break;
      case 'turn_error':
        this.handleTurnError(message.payload ?? {});
        break;
      case 'termination':
        this.handleTermination();
        break;
      case 'error':
        this.errorMessage = message.payload?.message ?? 'Unknown error';
        this.notify();
        break;
    }
  }

  private handleTextStream(payload: any): void {
    if (this.phase !== 'speaking') this.phase = 'speaking';
    this.isStreamingText = true;
    this.subtitleText = payload.fullText ?? this.subtitleText;
    this.questionText = this.subtitleText;
    this.notify();
  }

  private handleTurnComplete(payload: any): void {
    const finalText: string = payload.questionText ?? '';
    this.transcript.push({ role: 'AI', text: finalText, timestamp: new Date() });
    this.currentQuestion = finalText || null;
    this.audioUrl = payload.audioUrl ?? null;
    const audioData: string | undefined = payload.audioData;
    // Keep the "thinking" state on screen (isStreamingText stays true) until
    // the voice actually starts — the question text is revealed in sync with
    // the audio, not 3–5s earlier while the backend is still synthesizing it.
    this.phase = 'speaking';
    this.notify();

    let revealed = false;
    const revealText = () => {
      if (revealed) return;
      revealed = true;
      this.isStreamingText = false;
      this.questionText = finalText || '...';
      this.finalQuestionText = this.questionText;
      this.subtitleText = this.questionText;
      this.notify();
    };

    const afterPlayback = () => {
      revealText(); // guarantees the text is shown even if 'playing' never fired
      this.phase = 'listening';
      this.notify();
      this.startListening();
    };
    const onPlaybackError = (error: unknown) => {
      revealText();
      this.errorMessage = `Audio playback failed: ${error}`;
      this.phase = 'listening';
      this.notify();
      this.startListening();
    };

    if (this.audioUrl) {
      this.tts.playUrl(this.audioUrl, revealText).then(afterPlayback).catch(onPlaybackError);
    } else if (audioData) {
      this.tts.playBase64(audioData, revealText).then(afterPlayback).catch(onPlaybackError);
    } else {
      revealText();
      afterPlayback();
    }
  }

  private handleTermination(): void {
    this.isEnding = true;
    this.stt.stop();
    if (this.phase === 'speaking') {
      this.pendingTermination = true;
      setTimeout(() => {
        if (this.pendingTermination) this.finalizeTermination();
      }, 30_000);
      return;
    }
    this.finalizeTermination();
  }

  private finalizeTermination(): void {
    this.pendingTermination = false;
    this.isSessionEnded = true;
    this.phase = 'ready';
    this.cleanup();
    this.notify();
  }

  private handleTurnError(payload: any): void {
    this.errorMessage = payload.message ?? payload.error ?? 'Unknown error';
    this.phase = 'error';
    this.notify();
  }

  private startListening(): void {
    if (this.isEnding || this.isSessionEnded) {
      if (this.pendingTermination) this.finalizeTermination();
      return;
    }
    if (this.isListening && this.stt.isListening) return;

    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.isListening = true;
    this.notify();

    this.stt.startListening({
      onPartial: (text) => {
        this.partialTranscript = text;
        this.notify();
      },
      onFinal: (text) => {
        this.finalTranscript = text;
        this.isListening = false;
        this.sttRetryCount = 0;
        if (this.safetyTimer) clearTimeout(this.safetyTimer);
        if (text.length === 0) this.silenceStrikes++;
        else this.silenceStrikes = 0;
        this.submitResponse(text);
        this.notify();
      },
      onError: () => this.handleSttFailure(),
      onStatus: (status) => {
        if (status === 'done' && this.isListening) {
          // engine ended; onFinal will follow with the buffer
        }
      },
    });

    this.safetyTimer = setTimeout(() => {
      if (this.isListening) {
        this.isListening = false;
        this.submitResponse(this.partialTranscript);
        this.notify();
      }
    }, 40_000);
  }

  private async handleSttFailure(): Promise<void> {
    if (!this.isListening) return;
    if (this.sttRetryCount < 2) {
      this.sttRetryCount++;
      this.stt.stop();
      await new Promise((r) => setTimeout(r, 500));
      if (this.sttRetryCount === 2) await this.stt.reInitialize();
      this.startListening();
    } else {
      this.isListening = false;
      this.sttRetryCount = 0;
      this.submitResponse(this.partialTranscript);
      this.notify();
    }
  }

  private submitResponse(text: string): void {
    this.isStreamingText = true;
    this.phase = 'processing';
    this.partialTranscript = '';
    this.notify();
    this.transcript.push({ role: 'USER', text, timestamp: new Date() });
    this.ws?.sendMessage({
      type: 'turn_submit',
      payload: {
        sessionId: this.sessionId,
        textTranscript: text,
        isSilence: text.length === 0,
        voiceId: this.selectedVoiceId,
        engine: this.selectedEngine,
        voiceMode: this.voiceMode,
      },
    });
  }

  /** Manually submit typed text (accessibility / no-mic fallback). */
  submitManual(text: string): void {
    if (this.isEnding || this.isSessionEnded) return;
    this.stt.stop();
    this.isListening = false;
    if (text.trim().length === 0) return;
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.silenceStrikes = 0;
    this.submitResponse(text.trim());
  }

  /** Toggle the mic off during the listening phase (forces a submit). */
  stopListeningAndSubmit(): void {
    if (!this.isListening) return;
    this.stt.stop();
  }

  private terminateSession(): void {
    this.ws?.sendMessage({ type: 'terminate_session', payload: { sessionId: this.sessionId } });
  }

  async endSession(): Promise<void> {
    if (this.isSessionEnded) return;
    this.isEnding = true;
    this.stt.stop();
    const savedSessionId = this.sessionId;
    this.terminateSession();
    if (savedSessionId) {
      try {
        await api().post(Api.interviewTerminate, {
          sessionId: savedSessionId,
          reason: 'USER_INITIATED',
        });
      } catch {
        /* REST safety net best-effort */
      }
    }
    await new Promise((r) => setTimeout(r, 300));
    this.cleanupResources();
    this.isSessionEnded = true;
    this.sessionId = savedSessionId;
    this.phase = 'ready';
    this.notify();
  }

  private cleanupResources(): void {
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
    this.stt.stop();
    this.tts.stop();
    this.ws?.disconnect();
    this.ws = null;
  }

  private cleanup(): void {
    this.cleanupResources();
  }

  dispose(): void {
    this.cleanup();
    this.listeners.clear();
  }
}

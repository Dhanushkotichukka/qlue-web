import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInterview } from '@/state/InterviewContext';
import { useAuth } from '@/state/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/Icon';
import { isSttSupported } from '@/lib/sttService';
import { cx } from '@/lib/utils';
import type { VoiceMode } from '@/config/modules';
import type { InterviewPhase } from '@/lib/interviewController';
import './interview.css';

const LOADING_MESSAGES: Record<string, string[]> = {
  RESUME: ['Analyzing your resume…', 'Scanning key skills and experience…', 'Preparing personalized questions…'],
  WEBSITE: ['Analyzing the study material…', 'Extracting key concepts…', 'Preparing tutor session…'],
  INTRO: ['Analyzing communication style…', 'Preparing introduction assessment…', 'Calibrating evaluation criteria…'],
  HR: ['Analyzing behavioral patterns…', 'Calibrating question difficulty…', 'Preparing situational scenarios…'],
};

const ORB_COLOR: Record<InterviewPhase | 'connecting', string> = {
  connecting: 'rgba(255,255,255,0.75)',
  speaking: '#34d399',
  listening: '#ffb04d',
  processing: '#5e8cff',
  ready: '#ffffff',
  error: '#ff6b6b',
};

export function InterviewSessionScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, controller } = useInterview();
  const auth = useAuth();

  const moduleType =
    params.get('moduleType') ??
    (params.get('resumeId') ? 'RESUME' : params.get('websiteUrl') ? 'WEBSITE' : 'HR');
  const resumeId = params.get('resumeId') ?? undefined;
  const websiteUrl = params.get('websiteUrl') ?? undefined;

  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [manual, setManual] = useState('');
  const [showType, setShowType] = useState(!isSttSupported());
  const navigatedRef = useRef(false);
  const startedRef = useRef(false);
  // Latches true once THIS mount's session is actually underway. The
  // controller is a shared singleton, so on mount its snapshot still carries
  // the PREVIOUS interview's isSessionEnded=true; without this guard the
  // navigate effect below fires on that stale flag and bounces a freshly
  // started interview straight to the old feedback report while the new
  // session runs unseen in the background.
  const activatedRef = useRef(false);

  // start the session once
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    controller.resetForNewSession();
    controller.setVoice(auth.profile.voiceId, { voiceMode: auth.profile.voiceMode as VoiceMode });
    controller.initSession(moduleType, { resumeId, websiteUrl });
    return () => {
      // leaving the screen ends any live session
      if (!controller.getSnapshot().isSessionEnded) controller.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rotate loading messages while connecting
  useEffect(() => {
    if (!state.isConnecting) return;
    const id = setInterval(
      () => setMsgIndex((i) => (i + 1) % (LOADING_MESSAGES[moduleType] ?? LOADING_MESSAGES.HR).length),
      3000,
    );
    return () => clearInterval(id);
  }, [state.isConnecting, moduleType]);

  // navigate away on session end — but only for a session THIS screen started.
  // We wait until the new session is observably underway (connecting or an
  // active phase) before honouring isSessionEnded, so the stale ended-flag left
  // on the shared controller by the previous interview can't trigger a bounce.
  useEffect(() => {
    if (
      state.isConnecting ||
      state.phase === 'speaking' ||
      state.phase === 'listening' ||
      state.phase === 'processing'
    ) {
      activatedRef.current = true;
    }
    if (state.isSessionEnded && activatedRef.current && !navigatedRef.current) {
      navigatedRef.current = true;
      if (moduleType === 'WEBSITE') navigate('/dashboard', { replace: true });
      else navigate(`/feedback/${state.sessionId}`, { replace: true });
    }
  }, [state.isConnecting, state.phase, state.isSessionEnded, state.sessionId, moduleType, navigate]);

  const isTutor = moduleType === 'WEBSITE';
  const phase = state.phase;
  const orbColor = state.isConnecting ? ORB_COLOR.connecting : ORB_COLOR[phase];

  const statusText = useMemo(() => {
    if (state.isConnecting) {
      return (LOADING_MESSAGES[moduleType] ?? LOADING_MESSAGES.HR)[msgIndex];
    }
    if (phase === 'speaking') return state.isStreamingText ? 'Qlue is thinking…' : 'Qlue is speaking…';
    if (phase === 'listening') return state.silenceStrikes > 0 ? 'Waiting for your response…' : 'Listening…';
    if (phase === 'processing') return 'Processing…';
    return '';
  }, [state.isConnecting, phase, state.isStreamingText, state.silenceStrikes, msgIndex, moduleType]);

  // The question is revealed only once the voice actually starts (the
  // controller sets finalQuestionText on audio playback start), so the text
  // and the spoken question land together instead of the text showing 3–5s
  // ahead while the backend is still synthesizing speech. During connecting,
  // streaming and processing we show only the orb + status.
  const aiText = state.isConnecting || state.isStreamingText ? '' : state.finalQuestionText;

  const userText =
    state.isListening && state.partialTranscript
      ? state.partialTranscript
      : state.finalTranscript || '';

  const endSession = async () => {
    if (ending) return;
    setEnding(true);
    await controller.endSession();
  };

  const submitManual = () => {
    const text = manual.trim();
    if (!text) return;
    controller.submitManual(text);
    setManual('');
  };

  return (
    <div className={cx('iv', `iv--${state.isConnecting ? 'connecting' : phase}`)} style={{ ['--orb' as string]: orbColor }}>
      <div className="iv__grid" />

      <div className="iv__bar">
        <span className="iv__mode">{isTutor ? 'TUTOR MODE' : 'INTERVIEW MODE'}</span>
        <button className="iv__end" onClick={() => setEndOpen(true)}>
          END
        </button>
      </div>

      <div className="iv__body">
        {aiText && <div className={cx('iv__ai', isTutor && 'iv__ai--tutor')}>{aiText}</div>}

        <div className="iv__orb-wrap">
          <div className="iv__orb">
            <span className="iv__orb-ring" />
            <span className="iv__orb-ring" />
            <span className="iv__orb-ring" />
            <span className="iv__orb-core" />
          </div>
        </div>

        {userText && <div className="iv__user">{userText}</div>}

        <div className="iv__status">{statusText}</div>
        {state.silenceStrikes > 0 && (
          <div className="iv__strikes">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cx('iv__strike', i < state.silenceStrikes && 'iv__strike--on')} />
            ))}
          </div>
        )}
      </div>

      <div className="iv__foot">
        {state.errorMessage && (
          <div className="iv__hint" style={{ color: '#ff9b9b' }}>
            {state.errorMessage}
          </div>
        )}

        {!state.isConnecting && (
          showType ? (
            <div className="iv__type">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitManual();
                }}
                placeholder="Type your response…"
                disabled={phase !== 'listening'}
              />
              <button onClick={submitManual} aria-label="Send response">
                <Icon name="send" size={20} />
              </button>
            </div>
          ) : (
            <button
              className={cx('iv__mic', phase === 'listening' && 'iv__mic--on')}
              onClick={() => {
                if (phase === 'listening') controller.stopListeningAndSubmit();
              }}
              aria-label={phase === 'listening' ? 'Stop and submit' : 'Microphone'}
            >
              <Icon name={phase === 'listening' ? 'mic' : 'mic-off'} size={28} />
            </button>
          )
        )}

        {!state.isConnecting && isSttSupported() && (
          <div className="iv__hint">
            {showType ? (
              <>
                Prefer voice?{' '}
                <button onClick={() => setShowType(false)}>Use the microphone</button>
              </>
            ) : (
              <>
                Mic trouble?{' '}
                <button onClick={() => setShowType(true)}>Type your answer</button>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={endOpen}
        title="End interview?"
        message="Are you sure you want to end this session? You’ll get your feedback report."
        confirmLabel="End session"
        cancelLabel="Keep going"
        destructive
        icon="alert-triangle"
        loading={ending}
        onCancel={() => setEndOpen(false)}
        onConfirm={() => {
          setEndOpen(false);
          endSession();
        }}
      />
    </div>
  );
}

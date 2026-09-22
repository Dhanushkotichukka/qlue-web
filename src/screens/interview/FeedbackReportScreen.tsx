import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';
import { parseFeedbackReport, type FeedbackReport } from '@/types/feedback';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SemiCircleGauge } from '@/components/charts/SemiCircleGauge';
import { ScoreBar } from '@/components/charts/ScoreBar';
import { RadarChart } from '@/components/charts/RadarChart';
import { Icon } from '@/components/Icon';
import { exportFeedbackPdf } from '@/lib/feedbackPdf';
import { prettyDimension } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import './feedback.css';

const LOADING_PHRASES = [
  'Analyzing your transcription…',
  'Evaluating core dimensions…',
  'Cross-referencing behavioral patterns…',
  'Synthesizing actionable feedback…',
  'Finalizing your comprehensive report…',
];

function scoreColor(v: number): string {
  if (v >= 75) return '#4ade80';
  if (v >= 50) return '#fbbf24';
  return '#f87171';
}

type Tab = 'summary' | 'strengths' | 'weaknesses';

export function FeedbackReportScreen() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const toast = useToast();

  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [tab, setTab] = useState<Tab>('summary');
  const [exporting, setExporting] = useState(false);
  const cancelled = useRef(false);

  const fetchReport = useCallback(
    async (retries = 40) => {
      if (cancelled.current) return;
      try {
        const res = await api().get(`${Api.feedbackReport}/${sessionId}`, {
          params: { _t: Date.now() },
        });
        const data = res.data;
        let feedbackData = data?.feedback;
        if (feedbackData) {
          feedbackData = { ...feedbackData };
          if (data.transcript) feedbackData.transcript = data.transcript;
          if (!cancelled.current) {
            setReport(parseFeedbackReport(feedbackData));
            setLoading(false);
          }
        } else if (retries > 0) {
          await new Promise((r) => setTimeout(r, 3000));
          if (!cancelled.current) fetchReport(retries - 1);
        } else if (!cancelled.current) {
          setLoading(false);
          setError('Feedback generation is taking longer than expected. Please check back later.');
        }
      } catch (e: any) {
        const status = e?.response?.status;
        const authErr = status === 401 || status === 403;
        if (!authErr && retries > 0) {
          await new Promise((r) => setTimeout(r, 3000));
          if (!cancelled.current) fetchReport(retries - 1);
        } else if (!cancelled.current) {
          setLoading(false);
          setError(
            authErr
              ? 'Authentication error. Please log in again and retry.'
              : 'Unable to load feedback at this time. It may still be generating.',
          );
        }
      }
    },
    [sessionId],
  );

  useEffect(() => {
    cancelled.current = false;
    fetchReport();
    return () => {
      cancelled.current = true;
    };
  }, [fetchReport]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length), 3000);
    return () => clearInterval(id);
  }, [loading]);

  const dims = useMemo(
    () =>
      report
        ? Object.entries(report.dimensionScores).sort((a, b) => b[1] - a[1])
        : [],
    [report],
  );

  const overall = report ? Math.round(report.overallScore) : 0;
  const topic = 'Interview feedback';
  const role = auth.profile.profession || 'Candidate';

  const radarDims = useMemo(() => {
    const top = dims.slice(0, Math.max(3, Math.min(6, dims.length)));
    const out: Record<string, number> = {};
    for (const [k, v] of top) out[prettyDimension(k)] = v / 100;
    return out;
  }, [dims]);

  const onExport = async () => {
    if (!report || exporting) return;
    setExporting(true);
    try {
      exportFeedbackPdf({ report, topic, userName: auth.displayName, role, overallScore: overall });
    } catch {
      toast.error('Could not export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const content = (
    <div className="fb" data-theme="dark">
      {loading ? (
        <div className="fb__loading">
          <Spinner size={54} />
          <div className="fb__loading-msg" key={phraseIndex}>
            {LOADING_PHRASES[phraseIndex]}
          </div>
          <span className="caption">This usually takes 15–30 seconds</span>
        </div>
      ) : error ? (
        <div className="fb__loading">
          <span style={{ color: 'var(--warning)' }}>
            <Icon name="alert-triangle" size={48} />
          </span>
          <p className="body" style={{ maxWidth: 340, color: 'var(--text)' }}>
            {error}
          </p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Go back
          </Button>
        </div>
      ) : report ? (
        <div className="page">
          {/* header */}
          <div className="row gap-3" style={{ marginBottom: 'var(--sp-5)' }}>
            <button className="icon-btn icon-btn--filled" onClick={() => navigate('/dashboard')} aria-label="Back">
              <Icon name="chevron-left" size={22} />
            </button>
            <div className="grow">
              <div className="caption" style={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                PERFORMANCE ANALYSIS
              </div>
              <div className="headline">{topic}</div>
            </div>
            <button
              className="icon-btn icon-btn--filled"
              onClick={onExport}
              aria-label="Export PDF"
              disabled={exporting}
            >
              {exporting ? <Spinner size={18} /> : <Icon name="download" size={20} />}
            </button>
          </div>

          {/* score card */}
          <GlassCard pad="none" className="fb__score-card" style={{ marginBottom: 'var(--sp-5)' }}>
            <div className="grow">
              <div className="fb__id-name">{auth.displayName}</div>
              <div className="fb__id-role">{role}</div>
              <span
                className="fb__badge"
                style={{
                  background: `${scoreColor(overall)}1f`,
                  color: scoreColor(overall),
                }}
              >
                {overall >= 80 ? 'Top 15% of candidates' : overall >= 50 ? 'Solid performance' : 'Keep practicing!'}
              </span>
            </div>
            <SemiCircleGauge
              progress={overall / 100}
              color={scoreColor(overall)}
              size={132}
              center={
                <>
                  <span style={{ fontSize: '1.9rem', fontWeight: 800, color: scoreColor(overall), lineHeight: 1 }}>
                    {overall}
                  </span>
                  <span className="caption" style={{ letterSpacing: '0.14em', fontSize: '0.5rem' }}>OVERALL</span>
                </>
              }
            />
          </GlassCard>

          {/* dimension breakdown */}
          {dims.length > 0 && (
            <GlassCard pad="lg" style={{ marginBottom: 'var(--sp-5)' }}>
              <h3 className="headline" style={{ marginBottom: 'var(--sp-4)' }}>Dimension breakdown</h3>
              <div className="fb__dim-row">
                <div style={{ display: 'grid', placeItems: 'center' }}>
                  <RadarChart data={radarDims} size={190} color="#4ade80" />
                </div>
                <div className="stack gap-3">
                  {dims.map(([k, v]) => (
                    <ScoreBar key={k} label={prettyDimension(k)} value={v} color={scoreColor(v)} />
                  ))}
                </div>
              </div>
              {dims.length >= 2 && (
                <div className="row gap-2" style={{ marginTop: 'var(--sp-4)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Icon name="award" size={14} color="var(--success)" />
                  Strongest: {prettyDimension(dims[0][0])} · Focus next: {prettyDimension(dims[dims.length - 1][0])}
                </div>
              )}
            </GlassCard>
          )}

          {/* tabs */}
          <SegmentedControl<Tab>
            className="fb__tabs"
            options={[
              { value: 'summary', label: 'Summary' },
              { value: 'strengths', label: 'Strengths' },
              { value: 'weaknesses', label: 'Weaknesses' },
            ]}
            value={tab}
            onChange={setTab}
          />

          <GlassCard pad="lg" style={{ marginBottom: 'var(--sp-6)' }}>
            {tab === 'summary' && (
              <div className="stack gap-4">
                <div className="row gap-3">
                  <Icon name="file-text" size={20} color="var(--primary)" />
                  <h3 className="headline">Executive summary</h3>
                </div>
                <p className="body" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {report.executiveSummary || 'Your performance report is being processed.'}
                </p>
                <div>
                  <div className="fb__metric">
                    <span className="text-secondary">Confidence level</span>
                    <b style={{ color: 'var(--primary)' }}>High</b>
                  </div>
                  <div className="fb__metric" style={{ borderBottom: 'none' }}>
                    <span className="text-secondary">Pace</span>
                    <b style={{ color: 'var(--success)' }}>Steady</b>
                  </div>
                </div>
              </div>
            )}
            {tab === 'strengths' && (
              <div className="stack gap-4">
                <div className="row gap-3">
                  <Icon name="zap" size={20} color="var(--success)" />
                  <h3 className="headline">Your strengths</h3>
                </div>
                <div>
                  {(report.strengths.length ? report.strengths : ['Great effort in completing the session.']).map(
                    (s, i) => (
                      <div className="fb__bullet" key={i}>
                        <span className="fb__bullet-dot" style={{ background: 'var(--success)' }} />
                        {s}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {tab === 'weaknesses' && (
              <div className="stack gap-4">
                <div className="row gap-3">
                  <Icon name="alert-circle" size={20} color="var(--warning)" />
                  <h3 className="headline">Areas for improvement</h3>
                </div>
                <div>
                  {(report.weaknesses.length ? report.weaknesses : ['No major weaknesses identified.']).map(
                    (w, i) => (
                      <div className="fb__bullet" key={i}>
                        <span className="fb__bullet-dot" style={{ background: 'var(--warning)' }} />
                        {w}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </GlassCard>

          {/* recommendations */}
          {report.recommendations.length > 0 && (
            <GlassCard pad="lg" style={{ marginBottom: 'var(--sp-6)' }}>
              <div className="row gap-3" style={{ marginBottom: 'var(--sp-4)' }}>
                <Icon name="target" size={20} color="var(--primary)" />
                <h3 className="headline">Recommendations</h3>
              </div>
              {report.recommendations.map((r, i) => (
                <div className="fb__bullet" key={i}>
                  <span className="fb__bullet-dot" style={{ background: 'var(--primary)' }} />
                  {r}
                </div>
              ))}
            </GlassCard>
          )}

          {/* transcript */}
          <div className="row gap-3" style={{ marginBottom: 'var(--sp-4)' }}>
            <Icon name="message" size={20} color="var(--primary)" />
            <h3 className="headline">Q&A transcript</h3>
          </div>
          <GlassCard pad="lg">
            {report.transcript.length === 0 ? (
              <p className="body text-center">Transcript not available</p>
            ) : (
              report.transcript.map((item, i) => {
                const isAI = item.role.toUpperCase() === 'AI';
                return (
                  <div className="fb__tx" key={i}>
                    <span className="fb__tx-icon">
                      <Icon name={isAI ? 'mic' : 'user'} size={16} color={isAI ? 'var(--primary)' : 'var(--text-secondary)'} />
                    </span>
                    <span style={{ lineHeight: 1.5 }}>
                      <b style={{ color: isAI ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {isAI ? 'Qlue: ' : 'You: '}
                      </b>
                      {item.text}
                    </span>
                  </div>
                );
              })
            )}
          </GlassCard>
        </div>
      ) : null}
    </div>
  );

  return content;
}

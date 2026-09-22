import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useDashboard } from '@/state/DashboardContext';
import { useInterview } from '@/state/InterviewContext';
import { Ambient } from '@/components/layout/Ambient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlipCard } from '@/components/ui/FlipCard';
import { Modal } from '@/components/ui/Modal';
import { Icon, type IconName } from '@/components/Icon';
import { RadarChart } from '@/components/charts/RadarChart';
import { dimensionsForModule, type DashboardSummary } from '@/types/dashboard';
import { sessionScore, sessionTopic, sessionDateText } from '@/types/session';
import './dashboard.css';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const MODULE_TILES: { key: string; label: string; icon: IconName; colorVar: string }[] = [
  { key: 'RESUME', label: 'Resume', icon: 'file-text', colorVar: '--module-resume' },
  { key: 'HR', label: 'HR', icon: 'users', colorVar: '--module-hr' },
  { key: 'WEBSITE', label: 'Website', icon: 'link', colorVar: '--module-web' },
  { key: 'INTRO', label: 'Intro', icon: 'mic', colorVar: '--success' },
];

function bestScoreLabel(summary: DashboardSummary): string {
  if (summary.bestScore <= 0) return 'Best score';
  const names: Record<string, string> = {
    RESUME: 'Resume',
    HR: 'HR',
    WEBSITE: 'Website',
    INTRO: 'Intro',
    JD: 'Job Match',
  };
  let bestModule: string | null = null;
  let best = 0;
  for (const [k, v] of Object.entries(summary.bestScoreByModule)) {
    if (v > best) {
      best = v;
      bestModule = names[k] ?? k;
    }
  }
  return bestModule ? `Best · ${bestModule}` : 'Best score';
}

export function DashboardScreen() {
  const navigate = useNavigate();
  const { displayName, profileImageUrl } = useAuth();
  const { summary, radarData, history, hasLoadedOnce, isLoading, fetchDashboardData } =
    useDashboard();
  const { state: interview, controller } = useInterview();
  const [radar, setRadar] = useState('overall');
  const [detail, setDetail] = useState<null | { title: string; items: string[]; color: string; icon: IconName }>(
    null,
  );

  useEffect(() => {
    fetchDashboardData();
    // clean up any hanging interview session on dashboard entry
    if (interview.sessionId && !interview.isSessionEnded) controller.endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radarDims = useMemo(() => dimensionsForModule(radarData, radar), [radarData, radar]);
  const total = summary.totalSessions;

  const strengths = summary.strengths.length ? summary.strengths.slice(0, 3) : ['Complete an interview', 'to see your strengths'];
  const improvements = summary.improvements.length
    ? summary.improvements.slice(0, 3)
    : ['Complete an interview', 'to see insights'];

  return (
    <>
      <div className="page">
        {/* header */}
        <div className="page-hero">
          <div>
            <div className="page-hero__eyebrow">{greeting()}</div>
            <div className="page-hero__title">{displayName}</div>
          </div>
        </div>

        {!hasLoadedOnce || (isLoading && total === 0) ? (
          <div className="loading-fill">
            <Spinner size={34} />
          </div>
        ) : total === 0 ? (
          <GlassCard pad="lg" style={{ marginTop: 'var(--sp-6)' }}>
            <EmptyState
              icon="trending-up"
              title="No stats yet"
              body="Attend an interview to see your performance stats here."
              action={
                <Button onClick={() => navigate('/practice')} leading={<Icon name="play" size={18} />}>
                  Start an interview
                </Button>
              }
            />
          </GlassCard>
        ) : (
          <div className="dash">
            {/* score + best */}
            <div className="dash__score">
              <GlassCard className="dash__score-hero" pad="md">
                <div className="row between">
                  <span className="caption" style={{ fontWeight: 600 }}>Avg score</span>
                  <Icon name="trending-up" size={16} />
                </div>
                <div style={{ marginTop: 'var(--sp-3)' }}>
                  <span className="dash__big">{summary.averageScore}</span>
                  <span className="dash__big-suffix">/100</span>
                </div>
              </GlassCard>
              <GlassCard pad="md">
                <span style={{ color: 'var(--success)' }}>
                  <Icon name="target" size={18} />
                </span>
                <div className="dash__big" style={{ marginTop: 'var(--sp-3)', color: 'var(--text)' }}>
                  {summary.bestScore > 0 ? `${summary.bestScore}%` : '—'}
                </div>
                <div className="caption" style={{ marginTop: 4 }}>{bestScoreLabel(summary)}</div>
              </GlassCard>
            </div>

            <div className="dash__body">
            <div className="dash__main">
            {/* modules overview */}
            <section>
              <div className="section-head">
                <h2>Modules overview</h2>
              </div>
              <div className="dash__modules">
                {MODULE_TILES.map((m) => (
                  <FlipCard
                    key={m.key}
                    front={
                      <GlassCard style={{ height: '100%' }} pad="none">
                        <div className="module-tile">
                          <span
                            className="module-tile__icon"
                            style={{ color: `var(${m.colorVar})` }}
                          >
                            <Icon name={m.icon} size={24} />
                          </span>
                          <div>
                            <div className="module-tile__title">{m.label}</div>
                            <div className="module-tile__sub">
                              {summary.moduleBreakdown[m.key] ?? 0} sessions
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    }
                    back={
                      <div
                        className="module-tile module-tile--back"
                        style={{
                          height: '100%',
                          borderRadius: 'var(--r-lg)',
                          background: `linear-gradient(150deg, var(${m.colorVar}), var(--primary-strong))`,
                        }}
                      >
                        <span className="caption" style={{ color: 'rgba(255,255,255,.75)' }}>
                          {m.label}
                        </span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                          High: {summary.bestScoreByModule[m.key] ?? 0}%
                        </span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Keep going!</span>
                      </div>
                    }
                  />
                ))}
              </div>
            </section>

            {/* radar */}
            <GlassCard pad="lg">
              <div className="section-head" style={{ marginBottom: 'var(--sp-2)' }}>
                <h2>Performance radar</h2>
                <select
                  className="dash__radar-select"
                  value={radar}
                  onChange={(e) => setRadar(e.target.value)}
                  aria-label="Radar module"
                >
                  <option value="overall">Overall</option>
                  <option value="resume">Resume</option>
                  <option value="hr">HR</option>
                  <option value="website">Website</option>
                  <option value="intro">Intro</option>
                </select>
              </div>
              <div style={{ display: 'grid', placeItems: 'center', paddingTop: 'var(--sp-3)' }}>
                <RadarChart data={radarDims} size={280} color="var(--primary)" />
              </div>
            </GlassCard>

            </div>

            <div className="dash__side">
            {/* strengths + improve */}
            <div className="dash__keyareas">
              <GlassCard
                className="key-area"
                pad="none"
                onClick={() =>
                  setDetail({ title: 'Strengths', items: strengths, color: 'var(--success)', icon: 'zap' })
                }
              >
                <div className="key-area__row" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
                  <span style={{ color: 'var(--success)' }}><Icon name="zap" size={16} /></span>
                  Strengths
                </div>
                {strengths.map((s, i) => (
                  <div key={i} className="key-area__row">
                    <span className="key-area__dot" />
                    {s}
                  </div>
                ))}
              </GlassCard>

              <GlassCard
                className="key-area"
                pad="none"
                onClick={() =>
                  setDetail({ title: 'To improve', items: improvements, color: 'var(--warning)', icon: 'trending-up' })
                }
              >
                <div className="key-area__row" style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
                  <span style={{ color: 'var(--warning)' }}><Icon name="trending-up" size={16} /></span>
                  To improve
                </div>
                {improvements.map((s, i) => (
                  <div key={i} className="key-area__row">
                    <span className="key-area__dot" />
                    {s}
                  </div>
                ))}
              </GlassCard>
            </div>

            {/* tip */}
            <GlassCard className="tip-card" pad="lg">
              <div className="row gap-3" style={{ marginBottom: 'var(--sp-3)' }}>
                <Icon name="help" size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Improvement tip</h3>
              </div>
              <p>
                {summary.tip ||
                  'Complete your first interview session to get personalized, AI-powered coaching tips.'}
              </p>
            </GlassCard>

            {/* recent activity */}
            <section>
              <div className="section-head">
                <h2>Recent activity</h2>
                <button className="section-link" onClick={() => navigate('/history')}>
                  See all <Icon name="chevron-right" size={16} />
                </button>
              </div>
              {history.length === 0 ? (
                <GlassCard pad="md">
                  <span className="caption">Your recent sessions will appear here.</span>
                </GlassCard>
              ) : (
                <div className="stack gap-3">
                  {history.slice(0, 3).map((s) => (
                    <GlassCard
                      key={s.sessionId}
                      as="article"
                      pad="none"
                      className="activity"
                      onClick={() => navigate(`/feedback/${s.sessionId}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="activity__icon">
                        <Icon name="zap" size={18} />
                      </span>
                      <div className="grow">
                        <div style={{ fontWeight: 700 }}>{sessionTopic(s)}</div>
                        <div className="caption">{sessionDateText(s)}</div>
                      </div>
                      <span className="activity__score">{sessionScore(s)}%</span>
                    </GlassCard>
                  ))}
                </div>
              )}
            </section>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* detail flash modal (strengths / to improve) */}
      <Modal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div className="stack gap-4">
            <div className="row gap-3">
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--r-md)',
                  display: 'grid',
                  placeItems: 'center',
                  background: detail.color,
                  color: '#fff',
                }}
              >
                <Icon name={detail.icon} size={22} />
              </span>
              <h3 className="headline">{detail.title}</h3>
            </div>
            <div className="stack gap-3">
              {detail.items.map((it, i) => (
                <div key={i} className="row gap-3" style={{ alignItems: 'flex-start' }}>
                  <span className="key-area__dot" style={{ background: detail.color, marginTop: 8 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{it}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" block onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

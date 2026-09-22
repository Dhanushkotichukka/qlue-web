import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useDashboard } from '@/state/DashboardContext';
import { Ambient } from '@/components/layout/Ambient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/Icon';
import { sessionScore, sessionTopic, sessionDateText, type Session } from '@/types/session';
import './history.css';

type Filter = 'Date' | 'Score' | 'Module';

const MODULE_ICON: Record<string, IconName> = {
  resume: 'file-text',
  hr: 'users',
  website: 'link',
  intro: 'mic',
};

function calcStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  let streak = 0;
  const expected = new Date();
  expected.setHours(0, 0, 0, 0);
  for (const s of sorted) {
    const d = new Date(s.startedAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === expected.getTime()) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (d.getTime() < expected.getTime()) {
      break;
    }
  }
  return streak;
}

export function HistoryScreen() {
  const navigate = useNavigate();
  const { displayName, profileImageUrl } = useAuth();
  const { history, hasLoadedOnce, isLoading, fetchHistory } = useDashboard();
  const [filter, setFilter] = useState<Filter>('Date');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessions = useMemo(() => {
    const list = [...history];
    if (filter === 'Score') list.sort((a, b) => sessionScore(b) - sessionScore(a));
    else if (filter === 'Module') list.sort((a, b) => a.moduleType.localeCompare(b.moduleType));
    return list;
  }, [history, filter]);

  const total = sessions.length;
  const avgScore =
    total > 0 ? Math.round(sessions.reduce((sum, s) => sum + sessionScore(s), 0) / total) : 0;
  const streak = calcStreak(sessions);

  return (
    <>
      <div className="page">
        <div className="practice__head">
          <div className="grow">
            <div className="practice__title">History</div>
            <div className="practice__subtitle">Your practice sessions</div>
          </div>
          <select
            className="hist__filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            aria-label="Sort history"
          >
            <option value="Date">By date</option>
            <option value="Score">By score</option>
            <option value="Module">By module</option>
          </select>
        </div>

        {!hasLoadedOnce || (isLoading && history.length === 0) ? (
          <div className="loading-fill">
            <Spinner size={34} />
          </div>
        ) : history.length === 0 ? (
          <GlassCard pad="lg" style={{ marginTop: 'var(--sp-6)' }}>
            <EmptyState
              icon="clock"
              title="No interviews yet"
              body="Attend an interview to view your practice history here."
              action={<Button onClick={() => navigate('/practice')}>Start an interview</Button>}
            />
          </GlassCard>
        ) : (
          <>
            <div className="hist__badges" style={{ marginBottom: 'var(--sp-6)' }}>
              <span className="hist__badge">
                Total: <b>{total}</b>
              </span>
              <span className="hist__badge">
                Avg: <b>{avgScore}%</b>
              </span>
              <span className="hist__badge">
                Streak: <b>{streak}d</b>
              </span>
            </div>

            <div className="caption" style={{ fontWeight: 700, letterSpacing: '0.12em', marginBottom: 'var(--sp-4)' }}>
              TIMELINE
            </div>

            <div className="timeline">
              {sessions.map((s, i) => (
                <div className="tl-item" key={s.sessionId}>
                  <div className="tl-rail">
                    <span className="tl-node">
                      <Icon name={MODULE_ICON[s.moduleType.toLowerCase()] ?? 'zap'} size={16} />
                    </span>
                    {i < sessions.length - 1 && <span className="tl-line" />}
                  </div>
                  <GlassCard
                    as="article"
                    pad="none"
                    className="tl-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/feedback/${s.sessionId}`)}
                  >
                    <div className="row between">
                      <span className="tl-card__date">{sessionDateText(s)}</span>
                      <span className="tl-card__score">{sessionScore(s)}%</span>
                    </div>
                    <div className="tl-card__topic">{sessionTopic(s)}</div>
                    <div className="tl-card__meta">
                      <Icon name="zap" size={12} color="var(--primary)" />
                      {s.moduleType[0].toUpperCase() + s.moduleType.slice(1).toLowerCase()} · Practice
                      session
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

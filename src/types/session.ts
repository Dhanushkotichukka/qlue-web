export interface Session {
  sessionId: string;
  userId: string;
  moduleType: string;
  startedAt: Date;
  accumulatedScores?: Record<string, unknown> | null;
  status?: string | null;
}

export function parseSession(json: any): Session {
  const parseStartedAt = (): Date => {
    if (json.startedAt != null) return new Date(Number(json.startedAt));
    if (json.startTime != null) return new Date(json.startTime);
    return new Date(0);
  };
  return {
    sessionId: json.sessionId ?? '',
    userId: json.userId ?? '',
    moduleType: json.moduleType ?? 'HR',
    startedAt: parseStartedAt(),
    accumulatedScores: json.accumulatedScores ?? null,
    status: json.status ?? json.currentState ?? null,
  };
}

/** Average of accumulated dimension scores, rounded — mirrors SessionModel.score. */
export function sessionScore(s: Session): number {
  const scores = s.accumulatedScores;
  if (!scores) return 0;
  let total = 0;
  let count = 0;
  for (const value of Object.values(scores)) {
    if (typeof value === 'number') {
      total += Math.trunc(value);
      count++;
    } else if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        total += parsed;
        count++;
      }
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

export function sessionTopic(s: Session): string {
  switch (s.moduleType.toUpperCase()) {
    case 'RESUME':
      return 'Resume Analysis';
    case 'HR':
      return 'Behavioral Skills';
    case 'WEBSITE':
      return 'Domain Knowledge';
    case 'INTRO':
      return 'Self Introduction';
    default:
      return 'Practice Session';
  }
}

export function sessionDateText(s: Session): string {
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - s.startedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  if (diffDays < 7) return `${diffDays} DAYS AGO`;
  return s.startedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

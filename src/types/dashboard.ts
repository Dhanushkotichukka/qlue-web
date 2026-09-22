export interface DashboardSummary {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  moduleBreakdown: Record<string, number>;
  bestScoreByModule: Record<string, number>;
  strengths: string[];
  improvements: string[];
  tip: string;
}

export function initialDashboardSummary(): DashboardSummary {
  return {
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0,
    bestScore: 0,
    moduleBreakdown: { RESUME: 0, HR: 0, WEBSITE: 0, INTRO: 0 },
    bestScoreByModule: { RESUME: 0, HR: 0, WEBSITE: 0, INTRO: 0 },
    strengths: [],
    improvements: [],
    tip: '',
  };
}

export function parseDashboardSummary(json: any): DashboardSummary {
  const summary = json?.summary ?? {};
  const feedback = summary.latestFeedback;
  return {
    totalSessions: summary.totalSessions ?? 0,
    completedSessions: summary.completedSessions ?? 0,
    averageScore: summary.averageScore ?? 0,
    bestScore: summary.bestScore ?? 0,
    moduleBreakdown: { ...(summary.moduleBreakdown ?? {}) },
    bestScoreByModule: { ...(summary.bestScoreByModule ?? {}) },
    strengths: feedback ? [...(feedback.strengths ?? [])] : [],
    improvements: feedback ? [...(feedback.improvements ?? [])] : [],
    tip: feedback ? feedback.tip ?? '' : '',
  };
}

export interface RadarData {
  /** module -> { dimension -> score(0..100) } */
  data: Record<string, Record<string, number>>;
}

export function initialRadarData(): RadarData {
  return { data: {} };
}

export function parseRadarData(json: any): RadarData {
  const radar = json?.radarData ?? {};
  const parsed: Record<string, Record<string, number>> = {};
  for (const [mod, dims] of Object.entries(radar)) {
    parsed[mod] = { ...(dims as Record<string, number>) };
  }
  return { data: parsed };
}

/** Prettify camelCase dimension -> "Technical Vocabulary", value scaled 0..1.
 *  Mirrors RadarData.getDimensionsForModule. Returns a zeroed placeholder set
 *  when the module has no data (keeps the chart shape). */
export function dimensionsForModule(
  radar: RadarData,
  module: string,
): Record<string, number> {
  const modKey = module.toUpperCase();
  const dims = radar.data[modKey];
  if (!dims || Object.keys(dims).length === 0) {
    return { Comm: 0, Tech: 0, Logic: 0, Fit: 0, Conf: 0, Lead: 0 };
  }
  const result: Record<string, number> = {};
  for (const [dim, score] of Object.entries(dims)) {
    let key = dim.replace(/([a-z])([A-Z])/g, '$1 $2');
    if (key.length > 0) key = key[0].toUpperCase() + key.slice(1);
    result[key] = score / 100;
  }
  return result;
}

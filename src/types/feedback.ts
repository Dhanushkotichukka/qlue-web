export interface TranscriptEntry {
  role: string; // 'AI' | 'USER' | speaker
  text: string;
  timestamp: Date;
  turnIndex: number;
}

export interface FeedbackReport {
  sessionId: string;
  overallScore: number;
  dimensionScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  executiveSummary: string;
  transcript: TranscriptEntry[];
}

function parseDimensionScores(data: any): Record<string, number> {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number') result[key] = value;
  }
  return result;
}

export function parseFeedbackReport(json: any): FeedbackReport {
  let transcript: TranscriptEntry[] = [];
  if (Array.isArray(json.transcript)) {
    transcript = json.transcript.map((item: any) => ({
      role: item.speaker ?? 'UNKNOWN',
      text: item.text ?? '',
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      turnIndex: item.turnIndex ?? 0,
    }));
  }
  return {
    sessionId: json.sessionId ?? '',
    overallScore: Number(json.overallScore ?? 0),
    dimensionScores: parseDimensionScores(json.dimensionScores),
    strengths: [...(json.strengths ?? [])],
    // backend uses 'weaknesses' or 'improvements'
    weaknesses: [...(json.weaknesses ?? json.improvements ?? [])],
    recommendations: [...(json.recommendations ?? [])],
    executiveSummary: json.executiveSummary ?? 'No summary available.',
    transcript,
  };
}

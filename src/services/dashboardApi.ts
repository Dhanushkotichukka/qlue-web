import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';
import {
  parseDashboardSummary,
  parseRadarData,
  type DashboardSummary,
  type RadarData,
} from '@/types/dashboard';
import { parseSession, type Session } from '@/types/session';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await api().get(Api.dashboardSummary);
    return parseDashboardSummary(res.data);
  },

  async getModuleStats(period = '30d'): Promise<RadarData> {
    const res = await api().get(Api.dashboardStats, { params: { period } });
    return parseRadarData(res.data);
  },

  async getHistory(opts?: { moduleType?: string; limit?: number }): Promise<Session[]> {
    const params: Record<string, unknown> = { limit: opts?.limit ?? 100 };
    if (opts?.moduleType) params.moduleType = opts.moduleType;
    const res = await api().get(Api.sessionHistory, { params });
    const sessions = res.data.sessions ?? [];
    return (sessions as any[]).map(parseSession);
  },
};

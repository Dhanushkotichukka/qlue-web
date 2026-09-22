import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { dashboardApi } from '@/services/dashboardApi';
import {
  initialDashboardSummary,
  initialRadarData,
  type DashboardSummary,
  type RadarData,
} from '@/types/dashboard';
import type { Session } from '@/types/session';

interface DashboardCtx {
  summary: DashboardSummary;
  radarData: RadarData;
  history: Session[];
  isLoading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  fetchDashboardData: (opts?: { silent?: boolean }) => Promise<void>;
  refreshNow: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  fetchHistory: (moduleType?: string) => Promise<void>;
}

const Ctx = createContext<DashboardCtx | null>(null);

const AUTO_REFRESH_MS = 45_000;
const MIN_GAP_MS = 10_000;

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary>(initialDashboardSummary);
  const [radarData, setRadar] = useState<RadarData>(initialRadarData);
  const [history, setHistory] = useState<Session[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [hasLoadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const lastFetched = useRef<number | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDashboardData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const [sum, radar, hist] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getModuleStats(),
        dashboardApi.getHistory({ limit: 5 }),
      ]);
      setSummary(sum);
      setRadar(radar);
      setHistory(hist);
      lastFetched.current = Date.now();
      setLoadedOnce(true);
      setError(null);
    } catch {
      if (!silent) setError('Failed to load dashboard data.');
      // silent failures keep last good data
    } finally {
      inFlight.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshNow = useCallback(async () => {
    const last = lastFetched.current;
    if (last != null && Date.now() - last < MIN_GAP_MS) return;
    await fetchDashboardData({ silent: true });
  }, [fetchDashboardData]);

  const startAutoRefresh = useCallback(() => {
    if (autoTimer.current) return;
    autoTimer.current = setInterval(
      () => fetchDashboardData({ silent: true }),
      AUTO_REFRESH_MS,
    );
  }, [fetchDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = null;
  }, []);

  useEffect(() => () => stopAutoRefresh(), [stopAutoRefresh]);

  const fetchHistory = useCallback(async (moduleType?: string) => {
    try {
      setLoading(true);
      setError(null);
      const hist = await dashboardApi.getHistory({ moduleType });
      setHistory(hist);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  const value: DashboardCtx = {
    summary,
    radarData,
    history,
    isLoading,
    hasLoadedOnce,
    error,
    fetchDashboardData,
    refreshNow,
    startAutoRefresh,
    stopAutoRefresh,
    fetchHistory,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'qlue.theme';

interface ThemeCtx {
  isDark: boolean;
  mode: ThemeMode;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function initialMode(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value: ThemeCtx = {
    isDark: mode === 'dark',
    mode,
    toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    setDark: (v) => setMode(v ? 'dark' : 'light'),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

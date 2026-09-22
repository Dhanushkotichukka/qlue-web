import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/** Mirrors AppearanceProvider — user-owned UI dials, persisted to localStorage. */
type GlassStyle = 'liquid' | 'classic';

const K_STYLE = 'appearance.glassStyle';
const K_INTENSITY = 'appearance.glassIntensity';
const K_REDUCE = 'appearance.reduceMotion';

interface AppearanceCtx {
  glassStyle: GlassStyle;
  isLiquid: boolean;
  glassIntensity: number; // 0.6 .. 1.4
  reduceMotion: boolean;
  setGlassStyle: (s: GlassStyle) => void;
  setGlassIntensity: (v: number) => void;
  setReduceMotion: (v: boolean) => void;
}

const Ctx = createContext<AppearanceCtx | null>(null);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [glassStyle, setStyle] = useState<GlassStyle>(
    () => (localStorage.getItem(K_STYLE) as GlassStyle) || 'liquid',
  );
  const [glassIntensity, setIntensity] = useState<number>(() =>
    clamp(parseFloat(localStorage.getItem(K_INTENSITY) ?? '1') || 1, 0.6, 1.4),
  );
  const [reduceMotion, setReduce] = useState<boolean>(
    () => localStorage.getItem(K_REDUCE) === 'true',
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-intensity', String(glassIntensity));
    root.dataset.glass = glassStyle;
    root.classList.toggle('reduce-motion', reduceMotion);
  }, [glassStyle, glassIntensity, reduceMotion]);

  const value: AppearanceCtx = {
    glassStyle,
    isLiquid: glassStyle === 'liquid',
    glassIntensity,
    reduceMotion,
    setGlassStyle: (s) => {
      if (s !== 'liquid' && s !== 'classic') return;
      setStyle(s);
      localStorage.setItem(K_STYLE, s);
    },
    setGlassIntensity: (v) => {
      const c = clamp(v, 0.6, 1.4);
      setIntensity(c);
      localStorage.setItem(K_INTENSITY, String(c));
    },
    setReduceMotion: (v) => {
      setReduce(v);
      localStorage.setItem(K_REDUCE, String(v));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance(): AppearanceCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider');
  return ctx;
}

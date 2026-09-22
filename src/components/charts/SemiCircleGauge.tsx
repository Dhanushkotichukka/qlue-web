import { useId, type ReactNode } from 'react';

/** 270° arc gauge (Apple activity style) with a center slot. */
export function SemiCircleGauge({
  progress,
  color,
  size = 132,
  stroke = 11,
  trackColor = 'var(--border)',
  center,
}: {
  progress: number; // 0..1
  color: string;
  size?: number;
  stroke?: number;
  trackColor?: string;
  center?: ReactNode;
}) {
  const id = useId();
  const r = (size - stroke) / 2;
  const sweep = 0.75; // 270°
  const circumference = 2 * Math.PI * r;
  const arcLen = circumference * sweep;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = arcLen * (1 - clamped);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(135deg)' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms var(--ease-out)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {center}
      </div>
    </div>
  );
}

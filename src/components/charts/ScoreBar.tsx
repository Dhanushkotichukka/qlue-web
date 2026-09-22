/** Horizontal dimension score bar (0..100). */
export function ScoreBar({
  label,
  value,
  color = 'var(--primary)',
  max = 100,
}: {
  label: string;
  value: number;
  color?: string;
  max?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="stack gap-2">
      <div className="row between">
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
        <span className="mono-num caption" style={{ fontWeight: 700, color: 'var(--text)' }}>
          {Math.round(value)}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 'var(--r-pill)',
          background: 'var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 'var(--r-pill)',
            background: color,
            transition: 'width 800ms var(--ease-out)',
          }}
        />
      </div>
    </div>
  );
}

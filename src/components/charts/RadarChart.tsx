import { useId } from 'react';

interface Props {
  /** label -> value in 0..1 */
  data: Record<string, number>;
  size?: number;
  color?: string; // css color or var()
  rings?: number;
}

/** Clean Apple-styled radar/spider chart. Wraps long labels onto two lines. */
export function RadarChart({ data, size = 260, color = 'var(--primary)', rings = 4 }: Props) {
  const id = useId();
  const labels = Object.keys(data);
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46;

  if (n < 3) {
    return (
      <div style={{ height: size, display: 'grid', placeItems: 'center' }} className="caption">
        Not enough data yet
      </div>
    );
  }

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };

  const gridPolys = Array.from({ length: rings }, (_, ring) => {
    const r = (radius * (ring + 1)) / rings;
    return labels.map((_, i) => point(i, r).join(',')).join(' ');
  });

  const valuePoly = labels
    .map((label, i) => point(i, radius * Math.max(0, Math.min(1, data[label]))).join(','))
    .join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Skills radar">
      <defs>
        <radialGradient id={`${id}-fill`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.42" />
          <stop offset="100%" stopColor={color} stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* grid rings */}
      {gridPolys.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.7}
        />
      ))}

      {/* spokes */}
      {labels.map((_, i) => {
        const [x, y] = point(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} opacity={0.6} />;
      })}

      {/* value polygon */}
      <polygon points={valuePoly} fill={`url(#${id}-fill)`} stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {/* value vertices */}
      {labels.map((label, i) => {
        const [x, y] = point(i, radius * Math.max(0, Math.min(1, data[label])));
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}

      {/* labels */}
      {labels.map((label, i) => {
        const [lx, ly] = point(i, radius + 22);
        const a = angleFor(i);
        const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        const words = label.split(' ');
        const lines =
          words.length > 1 && label.length > 9
            ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')]
            : [label];
        return (
          <text
            key={i}
            x={lx}
            y={ly - (lines.length - 1) * 6}
            textAnchor={anchor}
            dominantBaseline="middle"
            style={{ fontSize: 10.5, fontWeight: 600, fill: 'var(--text-secondary)' }}
          >
            {lines.map((ln, j) => (
              <tspan key={j} x={lx} dy={j === 0 ? 0 : 12}>
                {ln}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

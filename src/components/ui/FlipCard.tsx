import { useState, type ReactNode } from 'react';
import './flip.css';

/** Tap-to-flip card. Front and back share the same footprint. */
export function FlipCard({
  front,
  back,
  className,
}: {
  front: ReactNode;
  back: ReactNode;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className={`flip ${flipped ? 'flip--on' : ''} ${className ?? ''}`}
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
    >
      <span className="flip__inner">
        <span className="flip__face flip__front">{front}</span>
        <span className="flip__face flip__back">{back}</span>
      </span>
    </button>
  );
}

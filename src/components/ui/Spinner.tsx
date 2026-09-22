import { cx } from '@/lib/utils';

export function Spinner({
  size = 24,
  onPrimary = false,
  className,
}: {
  size?: number;
  onPrimary?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx('spinner', onPrimary && 'spinner--on-primary', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingFill() {
  return (
    <div className="loading-fill">
      <Spinner size={34} />
    </div>
  );
}

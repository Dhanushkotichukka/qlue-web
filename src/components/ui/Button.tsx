import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  leading,
  trailing,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={cx(
        'btn',
        `btn--${variant}`,
        size === 'sm' && 'btn--sm',
        size === 'lg' && 'btn--lg',
        block && 'btn--block',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner size={18} onPrimary={variant === 'primary' || variant === 'accent'} />
      ) : (
        leading
      )}
      {children}
      {!loading && trailing}
    </button>
  );
}

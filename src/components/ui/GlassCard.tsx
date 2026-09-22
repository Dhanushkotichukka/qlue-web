import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/utils';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** solid card vs liquid glass */
  variant?: 'glass' | 'card';
  pad?: 'none' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

export function GlassCard({
  children,
  variant = 'glass',
  pad = 'md',
  className,
  as: Tag = 'div',
  ...rest
}: Props) {
  return (
    <Tag
      className={cx(
        variant,
        pad === 'md' && 'card-pad',
        pad === 'lg' && 'card-pad-lg',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

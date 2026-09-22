import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** bottom sheet on small screens */
  sheet?: boolean;
  labelledBy?: string;
}

export function Modal({ open, onClose, children, sheet, labelledBy }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={cx('scrim', sheet && 'sheet')}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {sheet && <div className="sheet-grip" />}
        {children}
      </div>
    </div>,
    document.body,
  );
}

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';
import { cx } from '@/lib/utils';

interface Props {
  title?: string;
  titleAlign?: 'center' | 'left';
  onBack?: () => void;
  showBack?: boolean;
  trailing?: ReactNode;
  leading?: ReactNode;
}

export function TopBar({ title, titleAlign = 'center', onBack, showBack, trailing, leading }: Props) {
  const navigate = useNavigate();
  const back = () => (onBack ? onBack() : navigate(-1));
  return (
    <header className="topbar">
      {leading ?? (
        showBack ? (
          <button className="icon-btn" onClick={back} aria-label="Back">
            <Icon name="chevron-left" size={24} />
          </button>
        ) : (
          <span style={{ width: 42 }} />
        )
      )}
      {title && (
        <h1 className={cx('topbar__title', titleAlign === 'left' && 'topbar__title--left')}>
          {title}
        </h1>
      )}
      {trailing ?? <span style={{ width: 42 }} />}
    </header>
  );
}

import { Modal } from './Modal';
import { Button } from './Button';
import { Icon, type IconName } from '../Icon';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: IconName;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  icon,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="stack gap-4" style={{ textAlign: 'center', alignItems: 'center' }}>
        {icon && (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--r-lg)',
              display: 'grid',
              placeItems: 'center',
              background: destructive ? 'var(--error-tint)' : 'var(--primary-tint)',
              color: destructive ? 'var(--error)' : 'var(--primary)',
            }}
          >
            <Icon name={icon} size={26} />
          </div>
        )}
        <div className="stack gap-2">
          <h3 className="headline">{title}</h3>
          <p className="body">{message}</p>
        </div>
        <div className="row gap-3" style={{ width: '100%', marginTop: 'var(--sp-2)' }}>
          <Button variant="secondary" block onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            block
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

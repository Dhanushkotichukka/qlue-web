import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '@/lib/utils';
import { Icon } from '../Icon';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  leading?: ReactNode;
  /** show a password reveal toggle */
  reveal?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  { label, error, leading, reveal, type = 'text', className, id, ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  const inputType = reveal ? (show ? 'text' : 'password') : type;
  const fieldId = id ?? rest.name;
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className="field-input-wrap">
        {leading && <span className="field-lead">{leading}</span>}
        <input
          ref={ref}
          id={fieldId}
          type={inputType}
          className={cx(
            'field-input',
            !!leading && 'field-input--has-lead',
            reveal && 'field-input--has-trail',
            className,
          )}
          aria-invalid={!!error}
          {...rest}
        />
        {reveal && (
          <button
            type="button"
            className="field-trail"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <Icon name={show ? 'eye-off' : 'eye'} size={20} />
          </button>
        )}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
});

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

export function TextArea({ label, error, className, id, ...rest }: AreaProps) {
  const fieldId = id ?? rest.name;
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <textarea id={fieldId} className={cx('field-input', className)} {...rest} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

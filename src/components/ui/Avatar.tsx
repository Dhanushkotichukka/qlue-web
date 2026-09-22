import { initials } from '@/lib/utils';

export function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}

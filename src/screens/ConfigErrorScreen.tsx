import { Icon } from '@/components/Icon';

/** Shown when required VITE_* env values are missing — the web equivalent of
 *  the Flutter startup-error screen for a missing --dart-define-from-file. */
export function ConfigErrorScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--sp-6)',
        background: 'var(--bg)',
      }}
    >
      <div className="stack gap-4" style={{ maxWidth: 460, textAlign: 'center', alignItems: 'center' }}>
        <span style={{ color: 'var(--warning)' }}>
          <Icon name="alert-triangle" size={44} />
        </span>
        <h1 className="title">Qlue isn’t configured</h1>
        <p className="body">
          The app can’t reach its backend or Firebase yet. Copy{' '}
          <code>.env.example</code> to <code>.env</code> in <code>frontend/qlue-web</code>{' '}
          and fill in your API, WebSocket, and Firebase values, then restart the dev server.
        </p>
        <div
          className="card card-pad"
          style={{ textAlign: 'left', width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
        >
          VITE_API_BASE_URL=…<br />
          VITE_WEBSOCKET_URL=…<br />
          VITE_FIREBASE_API_KEY=…
        </div>
      </div>
    </div>
  );
}

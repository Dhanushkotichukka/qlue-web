import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { Ambient } from '@/components/layout/Ambient';
import { GlassCard } from '@/components/ui/GlassCard';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Icon } from '@/components/Icon';
import './auth.css';

const EMAIL_RE = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;

export function RegisterScreen() {
  const { register, signInWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => () => clearError(), [clearError]);

  const shownError = localError || error || '';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (!agreed) {
      setLocalError('Please agree to the Terms of Service.');
      return;
    }
    setLoading(true);
    await register(email.trim(), password, name.trim());
    setLoading(false);
    if (!error) setSuccess(true);
  };

  const onGoogle = async () => {
    setLocalError('');
    clearError();
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  if (success) {
    return (
      <>
        <Ambient />
        <div className="auth">
          <GlassCard pad="lg" className="auth__card">
            <div className="stack gap-4" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--r-xl)',
                  background: 'var(--success-tint)',
                  color: 'var(--success)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="mail" size={30} />
              </div>
              <h1 className="auth__heading">Check your inbox</h1>
              <p className="body">
                We sent a verification link to <strong>{email.trim()}</strong>. Verify your
                email, then sign in to start practising.
              </p>
              <Button block size="lg" onClick={() => navigate('/login')}>
                Back to sign in
              </Button>
            </div>
          </GlassCard>
        </div>
      </>
    );
  }

  return (
    <>
      <Ambient />
      <div className="auth">
        <div className="auth__brand">
          <div className="auth__logo">Qlue</div>
          <div className="auth__rule" />
          <div className="auth__tagline">AI Career Intelligence</div>
        </div>

        <GlassCard pad="lg" className="auth__card">
          <h1 className="auth__heading">Create your account</h1>
          <p className="auth__sub">Start practising in minutes</p>

          {shownError && <div className="auth__banner auth__banner--error">{shownError}</div>}

          <form className="stack gap-4" onSubmit={onSubmit}>
            <TextField
              name="name"
              label="Full name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              leading={<Icon name="user" size={20} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              name="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              leading={<Icon name="mail" size={20} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              name="password"
              label="Password"
              reveal
              autoComplete="new-password"
              placeholder="At least 6 characters"
              leading={<Icon name="lock" size={20} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="row gap-3" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
              />
              <span className="text-secondary">
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>

            <Button type="submit" size="lg" block loading={loading}>
              Create account
            </Button>
          </form>

          <div className="auth__divider">OR</div>

          <button className="auth__google" onClick={onGoogle} disabled={googleLoading}>
            {googleLoading ? <Spinner size={20} /> : <Icon name="google" size={20} />}
            Continue with Google
          </button>
        </GlassCard>

        <p className="auth__foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </>
  );
}

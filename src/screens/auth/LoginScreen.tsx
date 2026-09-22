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

export function LoginScreen() {
  const { login, signInWithGoogle, error, clearError, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => () => clearError(), [clearError]);

  const shownError = localError || error || '';
  const isUnverified = shownError === 'EMAIL_NOT_VERIFIED';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setLocalError('');
    clearError();
    if (!email.trim() || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    await login(email.trim(), password);
    setLoading(false);
    // navigation happens via auth-state redirect; unverified users see the banner
    if (user && !user.emailVerified) return;
    navigate('/dashboard');
  };

  const onGoogle = async () => {
    if (loading || googleLoading) return;
    setLocalError('');
    clearError();
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

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
          <h1 className="auth__heading">Welcome back</h1>
          <p className="auth__sub">Sign in to continue your journey</p>

          {shownError && (
            <div className={`auth__banner ${isUnverified ? 'auth__banner--warn' : 'auth__banner--error'}`}>
              {isUnverified
                ? 'Please verify your email address before logging in. Check your inbox for the link.'
                : shownError}
            </div>
          )}

          <form className="stack gap-4" onSubmit={onSubmit}>
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
              autoComplete="current-password"
              placeholder="••••••••"
              leading={<Icon name="lock" size={20} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="auth__forgot">
              Forgot password?
            </button>
            <Button type="submit" size="lg" block loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="auth__divider">OR</div>

          <button className="auth__google" onClick={onGoogle} disabled={googleLoading}>
            {googleLoading ? <Spinner size={20} /> : <Icon name="google" size={20} />}
            Continue with Google
          </button>
        </GlassCard>

        <p className="auth__foot">
          Don’t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </>
  );
}

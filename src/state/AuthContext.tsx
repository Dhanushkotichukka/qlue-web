import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile as fbUpdateProfile,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import axios from 'axios';
import { auth, googleProvider } from '@/lib/firebase';
import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';

export interface Profile {
  email: string;
  profession: string;
  skills: string[];
  voiceId: string;
  voiceMode: string;
  photoUrl: string;
  displayName: string;
}

interface AuthCtx {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  profile: Profile;
  displayName: string;
  email: string;
  profileImageUrl: string;
  isPremiumVoice: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchProfileData: () => Promise<void>;
  updateUserProfile: (updates: Partial<{
    name: string;
    imageUrl: string;
    profession: string;
    skills: string[];
    voiceId: string;
    voiceMode: string;
  }>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<string | null>;
  updateFcmToken: (token: string) => Promise<void>;
  clearError: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const emptyProfile: Profile = {
  email: '',
  profession: '',
  skills: [],
  voiceId: 'Tiffany',
  voiceMode: 'cost_saver',
  photoUrl: '',
  displayName: '',
};

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No user found for that email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong password provided.';
    case 'auth/email-already-in-use':
      return 'The account already exists for that email.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/weak-password':
      return 'The password is too weak.';
    default:
      return 'Authentication failed.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setInitializing] = useState(true);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const startRef = useRef(Date.now());

  const syncWithBackend = useCallback(async () => {
    try {
      await api().post(Api.authSync);
    } catch {
      /* best effort */
    }
  }, []);

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await api().get(Api.authProfile);
      const d = res.data ?? {};
      setProfile({
        email: d.email ?? '',
        profession: d.profession ?? '',
        skills: [...(d.skills ?? [])],
        voiceId: d.voiceId ?? 'Tiffany',
        voiceMode: d.voiceMode ?? 'cost_saver',
        photoUrl: d.photoUrl ?? '',
        displayName: d.displayName ?? '',
      });
    } catch {
      /* keep last-known profile */
    }
  }, []);

  useEffect(() => {
    // Safety net: never strand the splash if auth never emits.
    const cap = setTimeout(() => setInitializing(false), 6000);

    const unsub = onAuthStateChanged(
      auth(),
      async (u) => {
        const wasNull = user === null;
        setUser(u);
        if (u) {
          syncWithBackend();
          if (wasNull) fetchProfileData();
        }
        // Hold the splash for a beat so it doesn't flash.
        const elapsed = Date.now() - startRef.current;
        const remaining = 800 - elapsed;
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
        setInitializing(false);
      },
      () => setInitializing(false),
    );
    return () => {
      clearTimeout(cap);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api().post(Api.login, { email, password });
      if (res.status === 200) {
        await signInWithEmailAndPassword(auth(), email, password);
      }
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 403) setError('EMAIL_NOT_VERIFIED');
        else setError(e.response?.data?.details ?? 'Login failed.');
      } else if (e && typeof e === 'object' && 'code' in e) {
        setError(mapFirebaseError(String((e as { code: string }).code)));
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        await api().post(Api.register, { email, password, displayName });
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) setError(e.response?.data?.error ?? 'Registration failed.');
        else setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth(), googleProvider);
      GoogleAuthProvider.credentialFromResult(result);
      const u = result.user;
      // Backend sync is best-effort — the user is already signed in to Firebase.
      if (u) {
        try {
          const idToken = await u.getIdToken();
          await api().post(Api.googleLogin, { idToken });
        } catch {
          /* ignore backend sync failure */
        }
      }
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        setError(null); // user dismissed — not an error worth showing
      } else if (code.includes('popup-blocked')) {
        setError('Your browser blocked the sign-in popup. Allow popups for this site and retry.');
      } else if (code.includes('unauthorized-domain')) {
        setError(
          'This address isn’t authorized for Google sign-in. Open the app at http://localhost:5173, or add this domain in Firebase Console → Authentication → Settings → Authorized domains.',
        );
      } else if (code.includes('operation-not-allowed')) {
        setError('Google sign-in is not enabled for this Firebase project.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth());
    setProfile(emptyProfile);
  }, []);

  const updateUserProfile = useCallback<AuthCtx['updateUserProfile']>(
    async (updates) => {
      const cur = auth().currentUser;
      if (!cur) return;
      const prev = profile;
      const next: Profile = { ...profile };
      if (updates.profession != null) next.profession = updates.profession;
      if (updates.skills != null) next.skills = [...updates.skills];
      if (updates.voiceId != null) next.voiceId = updates.voiceId;
      if (updates.voiceMode != null) next.voiceMode = updates.voiceMode;
      if (updates.imageUrl != null) next.photoUrl = updates.imageUrl;
      if (updates.name != null) next.displayName = updates.name;
      setProfile(next); // optimistic

      try {
        if (updates.name != null || updates.imageUrl != null) {
          await fbUpdateProfile(cur, {
            displayName: updates.name ?? cur.displayName ?? undefined,
            photoURL:
              updates.imageUrl && /^https?:/.test(updates.imageUrl)
                ? updates.imageUrl
                : (cur.photoURL ?? undefined),
          });
        }
        const body: Record<string, unknown> = {};
        if (updates.name != null) body.displayName = updates.name;
        if (updates.imageUrl != null) body.photoUrl = updates.imageUrl;
        if (updates.profession != null) body.profession = updates.profession;
        if (updates.skills != null) body.skills = updates.skills;
        if (updates.voiceId != null) body.voiceId = updates.voiceId;
        if (updates.voiceMode != null) body.voiceMode = updates.voiceMode;
        await api().put(Api.authProfile, body);
        await cur.reload();
        setUser(auth().currentUser);
      } catch (e) {
        setProfile(prev); // revert
        throw e;
      }
    },
    [profile],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<string | null> => {
      try {
        const cur = auth().currentUser;
        if (!cur || !cur.email) return 'No signed-in account found. Please log in again.';
        const hasPassword = cur.providerData.some((p) => p.providerId === 'password');
        if (!hasPassword)
          return 'This account signs in with Google and has no password to change.';
        const credential = EmailAuthProvider.credential(cur.email, currentPassword);
        await reauthenticateWithCredential(cur, credential);
        await updatePassword(cur, newPassword);
        return null;
      } catch (e: unknown) {
        const code = e && typeof e === 'object' && 'code' in e ? String((e as any).code) : '';
        if (code.includes('wrong-password') || code.includes('invalid-credential'))
          return 'Current password is incorrect.';
        if (code.includes('weak-password')) return 'The new password is too weak.';
        if (code.includes('too-many-requests'))
          return 'Too many attempts. Please try again in a few minutes.';
        if (code.includes('requires-recent-login'))
          return 'For security, please log out and log back in, then retry.';
        return 'Password change failed. Please try again.';
      }
    },
    [],
  );

  const updateFcmToken = useCallback(async (token: string) => {
    try {
      await api().post(Api.updateFcmToken, { token });
    } catch {
      /* best effort */
    }
  }, []);

  const displayName = profile.displayName || user?.displayName || 'User';
  const email = profile.email || user?.email || '';
  const profileImageUrl = profile.photoUrl || user?.photoURL || '';

  const value: AuthCtx = {
    user,
    isAuthenticated: user !== null,
    isInitializing,
    isLoading,
    error,
    profile,
    displayName,
    email,
    profileImageUrl,
    isPremiumVoice: profile.voiceMode === 'premium',
    login,
    register,
    signInWithGoogle,
    logout,
    fetchProfileData,
    updateUserProfile,
    changePassword,
    updateFcmToken,
    clearError: () => setError(null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

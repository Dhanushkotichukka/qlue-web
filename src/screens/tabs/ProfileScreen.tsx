import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useDashboard } from '@/state/DashboardContext';
import { useResumes } from '@/state/ResumeContext';
import { useTheme } from '@/state/ThemeContext';
import { useAppearance } from '@/state/AppearanceContext';
import { useToast } from '@/components/ui/Toast';
import { Ambient } from '@/components/layout/Ambient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon, type IconName } from '@/components/Icon';
import { VOICES, type VoiceMode } from '@/config/modules';
import { cx } from '@/lib/utils';
import './profile.css';

const AVATAR_LIBRARY = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Charlie&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/png?seed=George&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Sophie&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Oliver&backgroundColor=c1f4c1',
];

function SettingRow({
  icon,
  color,
  label,
  right,
  onClick,
}: {
  icon: IconName;
  color: string;
  label: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="set-row" onClick={onClick} type="button">
      <span className="set-row__icon" style={{ background: `${color}22`, color }}>
        <Icon name={icon} size={16} />
      </span>
      <span className="set-row__label">{label}</span>
      <span className="set-row__right">
        {right}
        {onClick && <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
      </span>
    </button>
  );
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { summary, fetchDashboardData } = useDashboard();
  const { resumes, fetchResumes } = useResumes();
  const theme = useTheme();
  const appearance = useAppearance();
  const toast = useToast();
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const [sheet, setSheet] = useState<null | 'avatar' | 'avatarLib' | 'voice' | 'appearance' | 'skills'>(null);
  const [editField, setEditField] = useState<null | { title: string; value: string; onSave: (v: string) => void }>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playPreview = (voiceId: string) => {
    try {
      previewRef.current?.pause();
      const a = new Audio(`/assets/audios/${voiceId.toLowerCase()}.mp3`);
      previewRef.current = a;
      a.play().catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const skillsRight =
    auth.profile.skills.length === 0
      ? 'Add skills'
      : auth.profile.skills.length > 2
        ? `${auth.profile.skills.slice(0, 2).join(', ')}…`
        : auth.profile.skills.join(', ');

  return (
    <>
      <div className="page" style={{ maxWidth: 760 }}>
        <h1 className="practice__title" style={{ marginBottom: 'var(--sp-5)' }}>Profile</h1>

        {/* hero */}
        <div className="pf__hero">
          <button className="pf__avatar-wrap" onClick={() => setSheet('avatar')} aria-label="Change photo">
            <Avatar name={auth.displayName} src={auth.profileImageUrl} size={88} />
            <span className="pf__avatar-badge">
              <Icon name="edit" size={12} />
            </span>
          </button>
          <div className="grow">
            <button
              className="pf__name"
              onClick={() =>
                setEditField({
                  title: 'Name',
                  value: auth.displayName,
                  onSave: (v) => auth.updateUserProfile({ name: v }),
                })
              }
            >
              {auth.displayName}
              <Icon name="edit" size={14} color="var(--primary)" />
            </button>
            <button
              onClick={() =>
                setEditField({
                  title: 'Profession',
                  value: auth.profile.profession,
                  onSave: (v) => auth.updateUserProfile({ profession: v }),
                })
              }
              className={cx('pf__profession', !auth.profile.profession && 'pf__profession--empty')}
              style={{ display: 'block', textAlign: 'left' }}
            >
              {auth.profile.profession || 'Tap to add profession'}
            </button>
            <div className="pf__ready">Interview ready</div>
          </div>
        </div>

        {/* stats */}
        <GlassCard pad="none" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="pf__stats">
            <div className="pf__stat">
              <b>{summary.totalSessions}</b>
              <span>Sessions</span>
            </div>
            <span className="pf__stat-div" />
            <div className="pf__stat">
              <b>{resumes.length}</b>
              <span>Resumes</span>
            </div>
            <span className="pf__stat-div" />
            <div className="pf__stat">
              <b>{summary.averageScore > 0 ? `${summary.averageScore}%` : '—'}</b>
              <span>Avg score</span>
            </div>
          </div>
        </GlassCard>

        {/* career profile */}
        <div className="pf__section">
          <div className="pf__section-title">Career profile</div>
          <GlassCard pad="none">
            <SettingRow
              icon="briefcase"
              color="var(--primary)"
              label="Profession"
              right={<span>{auth.profile.profession || 'Not set'}</span>}
              onClick={() =>
                setEditField({
                  title: 'Profession',
                  value: auth.profile.profession,
                  onSave: (v) => auth.updateUserProfile({ profession: v }),
                })
              }
            />
            <SettingRow
              icon="code"
              color="var(--success)"
              label="Skills"
              right={<span>{skillsRight}</span>}
              onClick={() => setSheet('skills')}
            />
          </GlassCard>
        </div>

        {/* app preferences */}
        <div className="pf__section">
          <div className="pf__section-title">App preferences</div>
          <GlassCard pad="none">
            <SettingRow
              icon="mic"
              color="var(--primary)"
              label="Voice model"
              right={<span>{auth.profile.voiceId} · {auth.isPremiumVoice ? 'Premium' : 'Cost Saver'}</span>}
              onClick={() => setSheet('voice')}
            />
          </GlassCard>
        </div>

        {/* account */}
        <div className="pf__section">
          <div className="pf__section-title">Account</div>
          <GlassCard pad="none">
            <SettingRow
              icon="mail"
              color="var(--success)"
              label="Email address"
              right={<span>{auth.email || '—'}</span>}
              onClick={() => toast.info('Email cannot be changed directly.')}
            />
            <SettingRow
              icon="sparkles"
              color="var(--primary)"
              label="Appearance"
              onClick={() => setSheet('appearance')}
            />
            <SettingRow
              icon="lock"
              color="var(--warning)"
              label="Change password"
              onClick={() => setPwOpen(true)}
            />
          </GlassCard>
        </div>

        {/* support */}
        <div className="pf__section">
          <div className="pf__section-title">Support</div>
          <GlassCard pad="none">
            <SettingRow
              icon="help"
              color="var(--module-resume)"
              label="Help & support"
              onClick={() => navigate('/profile/help')}
            />
            <SettingRow
              icon="info"
              color="var(--text-tertiary)"
              label="Version 2.0.0"
              right={<span>Latest</span>}
            />
          </GlassCard>
        </div>

        <button className="pf__logout" onClick={() => setLogoutOpen(true)}>
          <Icon name="log-out" size={18} />
          Sign out
        </button>
      </div>

      {/* ---- avatar picker ---- */}
      <Modal open={sheet === 'avatar'} onClose={() => setSheet(null)} sheet>
        <h3 className="headline text-center" style={{ marginBottom: 'var(--sp-5)' }}>Profile identity</h3>
        <div className="row gap-4" style={{ justifyContent: 'space-around' }}>
          <button
            className="stack gap-3"
            style={{ alignItems: 'center' }}
            onClick={() => {
              setSheet(null);
              auth.updateUserProfile({
                imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.displayName)}&background=random`,
              });
              toast.success('Profile picture updated!');
            }}
          >
            <span style={{ width: 64, height: 64, borderRadius: 'var(--r-lg)', background: 'var(--primary-tint)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
              <Icon name="user" size={28} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Generated</span>
          </button>
          <button
            className="stack gap-3"
            style={{ alignItems: 'center' }}
            onClick={() => setSheet('avatarLib')}
          >
            <span style={{ width: 64, height: 64, borderRadius: 'var(--r-lg)', background: 'var(--success-tint)', color: 'var(--success)', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkles" size={28} />
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Avatar library</span>
          </button>
        </div>
      </Modal>

      {/* ---- avatar library ---- */}
      <Modal open={sheet === 'avatarLib'} onClose={() => setSheet(null)} sheet>
        <h3 className="headline" style={{ marginBottom: 'var(--sp-5)' }}>Avatar library</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-4)' }}>
          {AVATAR_LIBRARY.map((url) => (
            <button
              key={url}
              onClick={() => {
                auth.updateUserProfile({ imageUrl: url });
                setSheet(null);
                toast.success('Avatar updated!');
              }}
              style={{
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                border: `2px solid ${auth.profileImageUrl === url ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      </Modal>

      {/* ---- voice selection ---- */}
      <VoiceSheet
        open={sheet === 'voice'}
        onClose={() => setSheet(null)}
        currentVoice={auth.profile.voiceId}
        currentMode={auth.profile.voiceMode as VoiceMode}
        onSelect={async (voiceId, mode) => {
          try {
            await auth.updateUserProfile({ voiceId, voiceMode: mode });
            toast.success(`Voice updated to ${voiceId}`);
          } catch {
            toast.error('Failed to update voice model');
          }
        }}
        onModeChange={async (mode) => {
          const stillValid = VOICES.some((v) => v.id === auth.profile.voiceId && v.mode === mode);
          const fallback = mode === 'premium' ? 'Tiffany' : 'Ruth';
          try {
            await auth.updateUserProfile({
              voiceMode: mode,
              voiceId: stillValid ? auth.profile.voiceId : fallback,
            });
            toast.success(mode === 'premium' ? 'Premium voices enabled' : 'Cost Saver voices enabled');
          } catch {
            toast.error('Failed to update voice mode');
          }
        }}
        onPreview={playPreview}
      />

      {/* ---- appearance ---- */}
      <Modal open={sheet === 'appearance'} onClose={() => setSheet(null)} sheet>
        <div className="stack gap-2" style={{ marginBottom: 'var(--sp-5)' }}>
          <h3 className="headline">Appearance</h3>
          <p className="caption">Make Qlue yours — changes apply instantly everywhere.</p>
        </div>

        <div className="pf__section-title">Theme</div>
        <SegmentedControl
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={theme.mode}
          onChange={(v) => theme.setDark(v === 'dark')}
        />

        <div className="pf__section-title" style={{ marginTop: 'var(--sp-5)' }}>Glass style</div>
        <SegmentedControl
          options={[
            { value: 'liquid', label: 'Liquid glass' },
            { value: 'classic', label: 'Classic' },
          ]}
          value={appearance.glassStyle}
          onChange={(v) => appearance.setGlassStyle(v)}
        />

        <div className="pf__section-title" style={{ marginTop: 'var(--sp-5)' }}>Glass intensity</div>
        <input
          type="range"
          min={0.6}
          max={1.4}
          step={0.05}
          value={appearance.glassIntensity}
          onChange={(e) => appearance.setGlassIntensity(parseFloat(e.target.value))}
        />
        <div className="row between caption">
          <span>Subtle</span>
          <span>Heavy</span>
        </div>

        <div className="row between" style={{ marginTop: 'var(--sp-5)' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Reduce motion</div>
            <div className="caption">Calms ambient animations, saves battery</div>
          </div>
          <button
            className={cx('switch', appearance.reduceMotion && 'switch--on')}
            onClick={() => appearance.setReduceMotion(!appearance.reduceMotion)}
            aria-pressed={appearance.reduceMotion}
            aria-label="Reduce motion"
          />
        </div>
      </Modal>

      {/* ---- skills ---- */}
      <SkillsSheet
        open={sheet === 'skills'}
        onClose={() => setSheet(null)}
        skills={auth.profile.skills}
        onSave={(skills) => {
          auth.updateUserProfile({ skills });
          toast.success('Skills saved!');
          setSheet(null);
        }}
      />

      {/* ---- edit field ---- */}
      <EditFieldModal
        field={editField}
        onClose={() => setEditField(null)}
        onSaved={(title) => toast.success(`${title} updated!`)}
      />

      {/* ---- change password ---- */}
      <ChangePasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        onChangePassword={auth.changePassword}
        onDone={(msg, ok) => (ok ? toast.success(msg) : toast.error(msg))}
      />

      {/* ---- logout ---- */}
      <ConfirmDialog
        open={logoutOpen}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        destructive
        icon="log-out"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await auth.logout();
          navigate('/login');
        }}
      />
    </>
  );
}

/* ---------------------------------------------------------------- voice --- */
function VoiceSheet({
  open,
  onClose,
  currentVoice,
  currentMode,
  onSelect,
  onModeChange,
  onPreview,
}: {
  open: boolean;
  onClose: () => void;
  currentVoice: string;
  currentMode: VoiceMode;
  onSelect: (voiceId: string, mode: VoiceMode) => void;
  onModeChange: (mode: VoiceMode) => void;
  onPreview: (voiceId: string) => void;
}) {
  const visible = VOICES.filter((v) => v.mode === currentMode);
  return (
    <Modal open={open} onClose={onClose} sheet>
      <div className="stack gap-2" style={{ marginBottom: 'var(--sp-4)' }}>
        <h3 className="headline">Voice model</h3>
        <p className="caption">Choose a voice mode, then pick a persona.</p>
      </div>
      <div className="row gap-3" style={{ marginBottom: 'var(--sp-5)' }}>
        <button
          className={cx('mode-chip', currentMode === 'cost_saver' && 'mode-chip--active')}
          onClick={() => onModeChange('cost_saver')}
        >
          <b><Icon name="shield" size={15} /> Cost Saver</b>
          <span>Neural · Free-tier</span>
        </button>
        <button
          className={cx('mode-chip', currentMode === 'premium' && 'mode-chip--active')}
          onClick={() => onModeChange('premium')}
        >
          <b><Icon name="zap" size={15} /> Premium</b>
          <span>Generative · Lifelike</span>
        </button>
      </div>
      <div className="stack gap-3" style={{ maxHeight: '46vh', overflowY: 'auto' }}>
        {visible.map((v) => {
          const active = currentVoice === v.id;
          return (
            <div key={v.id} className={cx('voice-row', active && 'voice-row--active')}>
              <button
                className="row gap-3 grow"
                style={{ textAlign: 'left' }}
                onClick={() => onSelect(v.id, v.mode)}
              >
                <span className={cx('voice-row__badge', active && 'voice-row__badge--active')}>
                  <Icon name={active ? 'check' : 'user'} size={18} />
                </span>
                <span className="grow">
                  <span style={{ display: 'block', fontWeight: 700 }}>{v.id}</span>
                  <span className="caption">{v.descriptor}</span>
                </span>
              </button>
              <button
                className="icon-btn"
                onClick={() => onPreview(v.id)}
                aria-label={`Preview ${v.id}`}
              >
                <Icon name="play" size={18} color="var(--primary)" />
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- skills --- */
function SkillsSheet({
  open,
  onClose,
  skills,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  skills: string[];
  onSave: (skills: string[]) => void;
}) {
  const [local, setLocal] = useState<string[]>(skills);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (open) setLocal(skills);
  }, [open, skills]);

  const add = () => {
    const s = draft.trim();
    if (s && !local.includes(s)) {
      setLocal((l) => [...l, s]);
      setDraft('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} sheet>
      <div className="row between" style={{ marginBottom: 'var(--sp-4)' }}>
        <h3 className="headline">Manage skills</h3>
        <span className="caption" style={{ color: 'var(--primary)', fontWeight: 700 }}>{local.length} total</span>
      </div>
      <div className="row gap-3" style={{ alignItems: 'flex-end', marginBottom: 'var(--sp-5)' }}>
        <div className="grow">
          <TextField
            label="Add new skill"
            placeholder="e.g. System Design"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <Button onClick={add} leading={<Icon name="plus" size={18} />}>Add</Button>
      </div>
      <div className="pf__section-title">Current skills</div>
      {local.length === 0 ? (
        <p className="caption text-center" style={{ padding: 'var(--sp-5) 0' }}>
          No skills added yet. Add your first skill above.
        </p>
      ) : (
        <div className="row wrap gap-2" style={{ marginBottom: 'var(--sp-5)' }}>
          {local.map((s) => (
            <span key={s} className="skill-chip">
              {s}
              <button
                className="icon-btn"
                style={{ width: 22, height: 22 }}
                onClick={() => setLocal((l) => l.filter((x) => x !== s))}
                aria-label={`Remove ${s}`}
              >
                <Icon name="x" size={13} color="var(--error)" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Button block variant="primary" onClick={() => onSave(local)}>
        Save skills
      </Button>
    </Modal>
  );
}

/* ------------------------------------------------------------- edit field --- */
function EditFieldModal({
  field,
  onClose,
  onSaved,
}: {
  field: null | { title: string; value: string; onSave: (v: string) => void };
  onClose: () => void;
  onSaved: (title: string) => void;
}) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (field) setValue(field.value);
  }, [field]);
  if (!field) return null;
  return (
    <Modal open={!!field} onClose={onClose}>
      <h3 className="headline" style={{ marginBottom: 'var(--sp-5)' }}>Edit {field.title.toLowerCase()}</h3>
      <div className="stack gap-5">
        <TextField
          label={field.title}
          placeholder={`Enter ${field.title.toLowerCase()}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <Button
          block
          onClick={() => {
            field.onSave(value.trim());
            onClose();
            onSaved(field.title);
          }}
        >
          Save changes
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------- change pw --- */
function ChangePasswordModal({
  open,
  onClose,
  onChangePassword,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onChangePassword: (current: string, next: string) => Promise<string | null>;
  onDone: (msg: string, ok: boolean) => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  }, [open]);

  const submit = async () => {
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      onDone('New password must be 8+ characters with letters and numbers.', false);
      return;
    }
    if (next !== confirm) {
      onDone('New passwords do not match.', false);
      return;
    }
    if (next === current) {
      onDone('New password must differ from the current one.', false);
      return;
    }
    setBusy(true);
    const err = await onChangePassword(current, next);
    setBusy(false);
    if (err == null) {
      onClose();
      onDone('Password updated successfully.', true);
    } else {
      onDone(err, false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3 className="headline" style={{ marginBottom: 'var(--sp-5)' }}>Change password</h3>
      <div className="stack gap-4">
        <TextField label="Current password" reveal value={current} onChange={(e) => setCurrent(e.target.value)} />
        <TextField label="New password" reveal placeholder="Min 8, letters + numbers" value={next} onChange={(e) => setNext(e.target.value)} />
        <TextField label="Confirm new password" reveal value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="row gap-3">
          <Button variant="secondary" block onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button block loading={busy} onClick={submit}>
            Update
          </Button>
        </div>
      </div>
    </Modal>
  );
}

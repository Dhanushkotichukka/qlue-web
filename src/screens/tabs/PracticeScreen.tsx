import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useResumes } from '@/state/ResumeContext';
import { useToast } from '@/components/ui/Toast';
import { Ambient } from '@/components/layout/Ambient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';
import type { Resume } from '@/types/resume';
import './practice.css';

type Tab = 'interview' | 'tutor';

export function PracticeScreen() {
  const navigate = useNavigate();
  const { displayName, profileImageUrl } = useAuth();
  const { resumes, fetchResumes } = useResumes();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('interview');
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResume = () => {
    if (resumes.length === 0) {
      toast.info('Please upload a resume first.');
      navigate('/resume/upload');
    } else if (!selectedResume) {
      setPickerOpen(true);
    } else {
      navigate(
        `/interview/session/new?moduleType=RESUME&resumeId=${selectedResume.resumeId}`,
      );
    }
  };

  const startWebsite = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error('Please enter a website URL first.');
      return;
    }
    let parsed: URL | null = null;
    try {
      parsed = new URL(trimmed);
    } catch {
      parsed = null;
    }
    if (!parsed || !parsed.protocol.startsWith('http')) {
      toast.error('Invalid URL format.');
      return;
    }
    setValidating(true);
    try {
      const res = await api().post(Api.websiteValidate, { websiteUrl: trimmed });
      const result = res.data?.data ?? res.data;
      if (result?.isEducational === true) {
        navigate(
          `/interview/session/new?moduleType=WEBSITE&websiteUrl=${encodeURIComponent(trimmed)}`,
        );
      } else {
        toast.error(result?.reason ?? 'This website does not contain educational content.');
      }
    } catch {
      toast.error('Network error during URL validation.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <div className="page">
        {/* header */}
        <div className="practice__head">
          <div className="grow">
            <div className="practice__title">Practice</div>
            <div className="practice__subtitle">AI learning modules</div>
          </div>
          <Button onClick={() => navigate('/resume/upload')} leading={<Icon name="file-text" size={16} />}>
            Upload résumé
          </Button>
        </div>

        <SegmentedControl<Tab>
          options={[
            { value: 'interview', label: 'AI Interview' },
            { value: 'tutor', label: 'AI Tutor' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div className="practice__grid">
          {tab === 'interview' ? (
            <>
              <GlassCard pad="none" className="module-card">
                <span className="module-card__glow" style={{ background: 'var(--module-resume)' }} />
                <div className="module-card__body">
                  <div>
                    <div className="module-card__title">Resume</div>
                    <div className="module-card__desc">Analyze key skills and work history.</div>
                  </div>
                  <button className="module-card__chip" onClick={() => setPickerOpen(true)}>
                    <Icon name="file-text" size={16} />
                    <span>
                      {selectedResume ? `Selected: ${selectedResume.fileName}` : 'No resume selected'}
                    </span>
                  </button>
                  <Button onClick={startResume} leading={<Icon name="play" size={18} />}>
                    Start practice
                  </Button>
                </div>
                <div className="module-card__art">
                  <img src="/assets/images/Resume.png" alt="" />
                </div>
              </GlassCard>

              <GlassCard pad="none" className="module-card">
                <span className="module-card__glow" style={{ background: 'var(--module-hr)' }} />
                <div className="module-card__body">
                  <div>
                    <div className="module-card__title">HR</div>
                    <div className="module-card__desc">
                      Practice behavioral and situational questions.
                    </div>
                  </div>
                  <span className="module-card__chip">
                    <Icon name="users" size={16} />
                    <span>Analyze your culture fit</span>
                  </span>
                  <Button
                    onClick={() => navigate('/interview/session/new?moduleType=HR')}
                    leading={<Icon name="play" size={18} />}
                  >
                    Start practice
                  </Button>
                </div>
                <div className="module-card__art">
                  <img src="/assets/images/hr.png" alt="" />
                </div>
              </GlassCard>

              <GlassCard pad="none" className="module-card">
                <span className="module-card__glow" style={{ background: 'var(--primary)' }} />
                <div className="module-card__body">
                  <div>
                    <div className="module-card__title">Job Match</div>
                    <div className="module-card__desc">
                      Get a profile match score for any job posting, then practice an interview
                      tailored to that exact role.
                    </div>
                  </div>
                  <span className="module-card__chip">
                    <Icon name="briefcase" size={16} />
                    <span>Link or pasted JD + your resume</span>
                  </span>
                  <Button onClick={() => navigate('/job-match')} leading={<Icon name="target" size={18} />}>
                    Start practice
                  </Button>
                </div>
                <div className="module-card__art">
                  <img src="/assets/images/Resume.png" alt="" />
                </div>
              </GlassCard>
            </>
          ) : (
            <>
              <GlassCard pad="none" className="module-card">
                <span className="module-card__glow" style={{ background: 'var(--module-web)' }} />
                <div className="module-card__body">
                  <div>
                    <div className="module-card__title">Website</div>
                    <div className="module-card__desc">Learn from educational URL content.</div>
                  </div>
                  <TextField
                    name="url"
                    placeholder="https://example.com/topic"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    leading={<Icon name="link" size={18} />}
                    inputMode="url"
                  />
                  <Button loading={validating} onClick={startWebsite} leading={<Icon name="play" size={18} />}>
                    Start practice
                  </Button>
                </div>
                <div className="module-card__art">
                  <img src="/assets/images/website.png" alt="" />
                </div>
              </GlassCard>

              <GlassCard pad="none" className="module-card">
                <span className="module-card__glow" style={{ background: 'var(--success)' }} />
                <div className="module-card__body">
                  <div>
                    <div className="module-card__title">Self-Intro</div>
                    <div className="module-card__desc">Record your professional introduction.</div>
                  </div>
                  <span className="module-card__chip">
                    <Icon name="mic" size={16} />
                    <span>Evaluate clarity and delivery</span>
                  </span>
                  <Button
                    onClick={() => navigate('/interview/session/new?moduleType=INTRO')}
                    leading={<Icon name="play" size={18} />}
                  >
                    Start practice
                  </Button>
                </div>
                <div className="module-card__art">
                  <img src="/assets/images/SelfIntro.png" alt="" />
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>

      {/* resume picker sheet */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} sheet>
        <div className="row between" style={{ marginBottom: 'var(--sp-4)' }}>
          <h3 className="headline">Select resume</h3>
          <button className="icon-btn" onClick={() => setPickerOpen(false)} aria-label="Close">
            <Icon name="x" size={22} />
          </button>
        </div>
        {resumes.length === 0 ? (
          <div className="stack gap-4" style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
            <p className="body">No resumes available. Please upload one.</p>
            <Button
              block
              onClick={() => {
                setPickerOpen(false);
                navigate('/resume/upload');
              }}
            >
              Upload resume
            </Button>
          </div>
        ) : (
          <div className="stack gap-3" style={{ maxHeight: '56vh', overflowY: 'auto' }}>
            {resumes.map((r) => {
              const active = selectedResume?.resumeId === r.resumeId;
              return (
                <button
                  key={r.resumeId}
                  className={`resume-pick ${active ? 'resume-pick--active' : ''}`}
                  onClick={() => {
                    setSelectedResume(r);
                    setPickerOpen(false);
                  }}
                >
                  <Icon name="file-text" size={20} color={active ? 'var(--primary)' : 'var(--text-secondary)'} />
                  <span className="grow" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.fileName}
                  </span>
                  {active && <Icon name="check-circle" size={20} color="var(--primary)" />}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}

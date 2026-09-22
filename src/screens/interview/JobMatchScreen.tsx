import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResumes } from '@/state/ResumeContext';
import { useToast } from '@/components/ui/Toast';
import { Ambient } from '@/components/layout/Ambient';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField, TextArea } from '@/components/ui/TextField';
import { SemiCircleGauge } from '@/components/charts/SemiCircleGauge';
import { Icon } from '@/components/Icon';
import { api } from '@/lib/apiClient';
import { Api } from '@/config/env';
import axios from 'axios';
import { cx } from '@/lib/utils';
import type { Resume } from '@/types/resume';

type Source = 'link' | 'pdf' | 'paste';

interface MatchResult {
  matchScore?: number;
  threshold?: number;
  eligible?: boolean;
  roleTitle?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  verdict?: string;
}

function scoreColor(v: number): string {
  if (v >= 75) return '#34c759';
  if (v >= 50) return '#ff9500';
  return '#ff3b30';
}

export function JobMatchScreen() {
  const navigate = useNavigate();
  const { resumes, activeResume, fetchResumes } = useResumes();
  const toast = useToast();

  const [source, setSource] = useState<Source>('link');
  const [url, setUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumes().then(() => {
      // default selection handled by effect below
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected && resumes.length) setSelected(activeResume ?? resumes[0]);
  }, [resumes, activeResume, selected]);

  const onPickPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error('PDF is too large (max 10 MB).');
      return;
    }
    setPdf(f);
  };

  const uploadPdf = async (file: File): Promise<string | null> => {
    const res = await api().post(Api.jdUploadUrl, { fileName: file.name, fileSize: file.size });
    const data = res.data?.data ?? res.data;
    const uploadUrl = data?.uploadUrl as string | undefined;
    const jobPdfKey = data?.jobPdfKey as string | undefined;
    if (!uploadUrl || !jobPdfKey) throw new Error('Upload URL missing');
    await axios.put(uploadUrl, await file.arrayBuffer(), {
      headers: { 'Content-Type': 'application/pdf' },
      transformRequest: [(d) => d],
    });
    return jobPdfKey;
  };

  const analyze = async () => {
    if (!selected) {
      toast.error('Select a resume first.');
      return;
    }
    const body: Record<string, unknown> = { resumeId: selected.resumeId };
    if (source === 'paste') {
      if (pasteText.trim().length < 100) {
        toast.error('Paste the full job description (at least 100 characters).');
        return;
      }
      body.jobText = pasteText.trim();
    } else if (source === 'pdf') {
      if (!pdf) {
        toast.error('Choose a PDF first.');
        return;
      }
    } else {
      let ok = false;
      try {
        const u = new URL(url.trim());
        ok = !!u.protocol && !!u.host;
      } catch {
        ok = false;
      }
      if (!ok) {
        toast.error('Enter a valid job posting link.');
        return;
      }
      body.jobUrl = url.trim();
    }

    setAnalyzing(true);
    setResult(null);
    try {
      if (source === 'pdf' && pdf) {
        const key = await uploadPdf(pdf);
        if (!key) {
          toast.error('Upload failed. Try again.');
          return;
        }
        body.jobPdfKey = key;
      }
      const res = await api().post(Api.jdAnalyze, body);
      const r = res.data?.data ?? res.data;
      if (r?.analyzed !== true) {
        if (r?.canPasteText === true && source !== 'paste') {
          setSource('paste');
          toast.error(r?.reason ?? 'That source could not be read — paste the description instead.');
        } else {
          toast.error(r?.reason ?? 'Could not analyze this job posting.');
        }
        return;
      }
      setResult(r as MatchResult);
    } catch {
      toast.error('Network error during job match analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Ambient />
      <TopBar title="Job Match" showBack />
      <div className="page page-narrow" style={{ paddingTop: 'var(--sp-5)' }}>
        <GlassCard pad="lg">
          <SegmentedControl<Source>
            options={[
              { value: 'link', label: 'Link' },
              { value: 'pdf', label: 'PDF' },
              { value: 'paste', label: 'Paste' },
            ]}
            value={source}
            onChange={setSource}
          />

          <div style={{ marginTop: 'var(--sp-4)' }}>
            {source === 'link' && (
              <TextField
                placeholder="https://company.com/careers/job-id"
                leading={<Icon name="link" size={18} />}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
              />
            )}
            {source === 'paste' && (
              <TextArea
                placeholder="Paste the full job description here…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={7}
              />
            )}
            {source === 'pdf' && (
              <>
                <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPickPdf} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="stack gap-2"
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    padding: 'var(--sp-6)',
                    borderRadius: 'var(--r-md)',
                    border: `1.5px ${pdf ? 'solid var(--primary)' : 'dashed var(--border)'}`,
                    background: 'var(--bg-secondary)',
                    color: pdf ? 'var(--text)' : 'var(--text-tertiary)',
                  }}
                >
                  <Icon name={pdf ? 'file-text' : 'upload-cloud'} size={26} color={pdf ? 'var(--primary)' : 'var(--text-tertiary)'} />
                  <span style={{ fontWeight: pdf ? 700 : 500, fontSize: '0.9rem' }}>
                    {pdf ? pdf.name : 'Tap to choose a job description PDF'}
                  </span>
                  {pdf && <span className="caption" style={{ color: 'var(--primary)' }}>Tap to change</span>}
                </button>
              </>
            )}
          </div>

          <div className="pf__section-title" style={{ marginTop: 'var(--sp-5)' }}>Resume</div>
          {resumes.length === 0 ? (
            <button className="text-primary" style={{ fontWeight: 600 }} onClick={() => navigate('/resume/upload')}>
              No resumes yet — tap to upload one
            </button>
          ) : (
            <div className="row wrap gap-2">
              {resumes.map((r) => {
                const sel = selected?.resumeId === r.resumeId;
                return (
                  <button
                    key={r.resumeId}
                    className={cx('module-card__chip', sel && 'resume-pick--active')}
                    style={sel ? { borderColor: 'var(--primary)', background: 'var(--primary-tint-weak)' } : undefined}
                    onClick={() => setSelected(r)}
                  >
                    <Icon name="file-text" size={14} color={sel ? 'var(--primary)' : 'var(--text-tertiary)'} />
                    <span style={{ maxWidth: 160 }}>{r.fileName}</span>
                  </button>
                );
              })}
            </div>
          )}

          <Button block loading={analyzing} onClick={analyze} style={{ marginTop: 'var(--sp-5)' }}>
            Analyze match
          </Button>
        </GlassCard>

        {result && (
          <GlassCard pad="lg" style={{ marginTop: 'var(--sp-5)' }}>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <SemiCircleGauge
                progress={(result.matchScore ?? 0) / 100}
                color={scoreColor(result.matchScore ?? 0)}
                size={200}
                center={
                  <>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: scoreColor(result.matchScore ?? 0), lineHeight: 1 }}>
                      {result.matchScore ?? 0}%
                    </span>
                    <span className="caption">Profile match</span>
                  </>
                }
              />
            </div>
            <div className="text-center headline" style={{ marginTop: 'var(--sp-2)' }}>
              {result.roleTitle ?? 'Unknown role'}
            </div>
            {result.verdict && (
              <p className="body text-center" style={{ marginTop: 'var(--sp-3)' }}>
                {result.verdict}
              </p>
            )}

            {result.matchedSkills && result.matchedSkills.length > 0 && (
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <div className="pf__section-title" style={{ color: 'var(--success)' }}>You match</div>
                <div className="stack gap-2">
                  {result.matchedSkills.map((s, i) => (
                    <div key={i} className="row gap-2">
                      <Icon name="check" size={14} color="var(--success)" />
                      <span style={{ fontSize: '0.9rem' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.missingSkills && result.missingSkills.length > 0 && (
              <div style={{ marginTop: 'var(--sp-5)' }}>
                <div className="pf__section-title" style={{ color: 'var(--warning)' }}>Gaps to prepare for</div>
                <div className="stack gap-2">
                  {result.missingSkills.map((s, i) => (
                    <div key={i} className="row gap-2">
                      <Icon name="alert-circle" size={14} color="var(--warning)" />
                      <span style={{ fontSize: '0.9rem' }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'var(--sp-5)' }}>
              {result.eligible ? (
                <Button
                  block
                  leading={<Icon name="play" size={18} />}
                  onClick={() =>
                    navigate(`/interview/session/new?moduleType=JD&resumeId=${selected?.resumeId}`)
                  }
                >
                  Start practice interview
                </Button>
              ) : (
                <div
                  style={{
                    padding: 'var(--sp-4)',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--warning-tint)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                  }}
                >
                  This job doesn’t match your profile yet — you need {result.threshold ?? 60}% or more to
                  unlock a tailored practice interview. Strengthen the gaps above or try a closer-fitting role.
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </>
  );
}

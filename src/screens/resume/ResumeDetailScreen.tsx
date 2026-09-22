import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResumes } from '@/state/ResumeContext';
import { Ambient } from '@/components/layout/Ambient';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/Icon';
import { formatBytes, cx } from '@/lib/utils';
import { ParsedResumeView } from './ParsedResumeView';
import type { Resume, ResumeStatus } from '@/types/resume';
import './resume.css';

const STATUS_META: Record<ResumeStatus, { label: string; cls: string }> = {
  parsed: { label: 'Ready to use', cls: 'status-pill--parsed' },
  parsing: { label: 'Parsing…', cls: 'status-pill--parsing' },
  uploading: { label: 'Uploading…', cls: 'status-pill--parsing' },
  pending: { label: 'Pending', cls: 'status-pill--pending' },
  failed: { label: 'Failed', cls: 'status-pill--failed' },
};

export function ResumeDetailScreen() {
  const { resumeId = '' } = useParams();
  const navigate = useNavigate();
  const { resumes, fetchResumeDetail, setActiveResume } = useResumes();
  const [resume, setResume] = useState<Resume | null>(
    () => resumes.find((r) => r.resumeId === resumeId) ?? null,
  );
  const [loading, setLoading] = useState(!resume);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await fetchResumeDetail(resumeId);
      if (active) {
        if (r) setResume(r);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  if (loading && !resume) {
    return (
      <>
        <Ambient />
        <TopBar title="Resume" showBack />
        <div className="loading-fill">
          <Spinner size={34} />
        </div>
      </>
    );
  }

  if (!resume) {
    return (
      <>
        <Ambient />
        <TopBar title="Resume" showBack />
        <div className="page">
          <EmptyState icon="file-text" title="Resume not found" body="This resume may have been deleted." />
        </div>
      </>
    );
  }

  const status = STATUS_META[resume.status];
  const isParsed = resume.status === 'parsed';

  return (
    <>
      <Ambient />
      <TopBar title="Resume" showBack titleAlign="left" />
      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>
        <GlassCard pad="lg" style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="row gap-4">
            <span
              className="resume-item__icon"
              style={{ width: 56, height: 56, background: 'var(--error-tint)', color: 'var(--error)' }}
            >
              <Icon name="file-text" size={24} />
            </span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="headline" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resume.fileName}
              </div>
              <div className="row gap-2" style={{ marginTop: 6 }}>
                <span className="caption">{formatBytes(resume.fileSize)} · PDF</span>
                <span className={cx('status-pill', status.cls)}>
                  {(resume.status === 'parsing' || resume.status === 'uploading') && <Spinner size={10} />}
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {resume.isActive && (
            <div className="pill" style={{ marginTop: 'var(--sp-4)', background: 'var(--primary-tint)', color: 'var(--primary)' }}>
              <Icon name="check-circle" size={14} /> Active resume
            </div>
          )}

          <div className="row gap-3" style={{ marginTop: 'var(--sp-5)' }}>
            {!resume.isActive && isParsed && (
              <Button variant="secondary" block onClick={() => setActiveResume(resume.resumeId)}>
                Set active
              </Button>
            )}
            <Button
              block
              disabled={!isParsed}
              leading={<Icon name="play" size={18} />}
              onClick={() =>
                navigate(`/interview/session/new?moduleType=RESUME&resumeId=${resume.resumeId}`)
              }
            >
              Start resume interview
            </Button>
          </div>
        </GlassCard>

        {resume.status === 'failed' ? (
          <GlassCard pad="lg">
            <EmptyState
              icon="alert-circle"
              title="Parsing failed"
              body={resume.failReason ?? 'We couldn’t read this file. Try uploading a text-based PDF.'}
            />
          </GlassCard>
        ) : resume.status !== 'parsed' ? (
          <GlassCard pad="lg">
            <div className="loading-fill" style={{ minHeight: '24vh' }}>
              <div className="stack gap-3" style={{ alignItems: 'center' }}>
                <Spinner size={30} />
                <span className="caption">Extracting your profile…</span>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard pad="lg">
            <ParsedResumeView data={resume.parsedData} />
          </GlassCard>
        )}
      </div>
    </>
  );
}

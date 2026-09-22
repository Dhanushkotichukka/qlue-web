import { useEffect, useRef, useState } from 'react';
import { useResumes } from '@/state/ResumeContext';
import { useToast } from '@/components/ui/Toast';
import { Ambient } from '@/components/layout/Ambient';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/Icon';
import { formatBytes, cx } from '@/lib/utils';
import { ParsedResumeView } from './ParsedResumeView';
import type { Resume, ResumeStatus } from '@/types/resume';
import './resume.css';

const STATUS_LABEL: Record<ResumeStatus, string> = {
  pending: 'Pending',
  uploading: 'Uploading',
  parsing: 'Parsing',
  parsed: 'Ready',
  failed: 'Failed',
};

export function ResumeUploadScreen() {
  const { resumes, maxAllowed, isLoading, error, uploadResume, deleteResume, fetchResumes } =
    useResumes();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Resume | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFile = () => {
    if (resumes.length >= maxAllowed) {
      toast.error(`Maximum of ${maxAllowed} resumes allowed.`);
      return;
    }
    inputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const ok = await uploadResume(file);
    setUploading(false);
    if (ok) toast.success('Resume uploaded and processing started.');
    else toast.error(error ?? 'Failed to upload resume.');
  };

  return (
    <>
      <Ambient />
      <TopBar title="Resumes" showBack titleAlign="left" />
      <div className="page" style={{ paddingTop: 'var(--sp-5)' }}>
        <div className="stack gap-4" style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="row between">
            <div>
              <div className="caption" style={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                MANAGEMENT CONSOLE
              </div>
              <div className="title">Your resumes</div>
            </div>
            <Button onClick={pickFile} loading={uploading} leading={<Icon name="plus" size={18} />}>
              Upload
            </Button>
          </div>
          <div className="caption">
            {resumes.length}/{maxAllowed} used · PDF only, up to 5 MB
          </div>
        </div>

        <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={onFile} />

        {uploading && (
          <GlassCard pad="md" style={{ marginBottom: 'var(--sp-4)' }}>
            <div className="row gap-4">
              <span className="resume-item__icon">
                <Spinner size={22} />
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>Analyzing resume…</div>
                <div className="caption">Extracting information and generating your profile</div>
              </div>
            </div>
          </GlassCard>
        )}

        {isLoading && resumes.length === 0 ? (
          <div className="loading-fill">
            <Spinner size={34} />
          </div>
        ) : resumes.length === 0 && !uploading ? (
          <GlassCard pad="lg" style={{ marginTop: 'var(--sp-4)' }}>
            <EmptyState
              icon="file-text"
              title="No resumes uploaded"
              body="Upload a PDF to build your interview profile."
              action={<Button onClick={pickFile}>Upload resume</Button>}
            />
          </GlassCard>
        ) : (
          <div className="stack gap-3">
            {resumes.map((r) => (
              <GlassCard key={r.resumeId} pad="none" className="resume-item" as="article">
                <button
                  className="row gap-4 grow"
                  style={{ textAlign: 'left', minWidth: 0 }}
                  onClick={() => setPreview(r)}
                >
                  <span className="resume-item__icon">
                    <Icon name="file-text" size={20} />
                  </span>
                  <span className="grow" style={{ minWidth: 0 }}>
                    <span className="resume-item__name" style={{ display: 'block' }}>
                      {r.fileName}
                    </span>
                    <span className="resume-item__meta row gap-2" style={{ display: 'flex' }}>
                      {formatBytes(r.fileSize)} · PDF
                      <span className={cx('status-pill', `status-pill--${r.status}`)}>
                        {r.status === 'parsing' && <Spinner size={10} />}
                        {STATUS_LABEL[r.status]}
                      </span>
                    </span>
                  </span>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setDeleteId(r.resumeId)}
                  aria-label="Delete resume"
                >
                  <Icon name="trash" size={18} color="var(--error)" />
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* parsed preview */}
      <Modal open={!!preview} onClose={() => setPreview(null)} sheet>
        {preview && (
          <>
            <div className="row gap-3" style={{ marginBottom: 'var(--sp-5)' }}>
              <span className="resume-item__icon">
                <Icon name="file-text" size={20} />
              </span>
              <div className="grow" style={{ minWidth: 0 }}>
                <h3 className="headline">Resume profile</h3>
                <div className="caption" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview.fileName}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setPreview(null)} aria-label="Close">
                <Icon name="x" size={22} />
              </button>
            </div>
            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {preview.status === 'parsing' ? (
                <div className="loading-fill" style={{ minHeight: '30vh' }}>
                  <div className="stack gap-3" style={{ alignItems: 'center' }}>
                    <Spinner size={30} />
                    <span className="caption">Still parsing this resume…</span>
                  </div>
                </div>
              ) : (
                <ParsedResumeView data={preview.parsedData} />
              )}
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete resume?"
        message="This will permanently remove your document."
        confirmLabel="Delete"
        destructive
        icon="trash"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteResume(deleteId);
          setDeleteId(null);
        }}
      />
    </>
  );
}

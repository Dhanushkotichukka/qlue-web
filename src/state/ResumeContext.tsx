import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { resumeApi } from '@/services/resumeApi';
import { sha256Hex } from '@/lib/utils';
import type { Resume } from '@/types/resume';

interface ResumeCtx {
  resumes: Resume[];
  activeResume: Resume | null;
  isLoading: boolean;
  error: string | null;
  maxAllowed: number;
  fetchResumes: () => Promise<void>;
  fetchResumeDetail: (id: string) => Promise<Resume | null>;
  uploadResume: (file: File) => Promise<boolean>;
  deleteResume: (id: string) => Promise<void>;
  setActiveResume: (id: string) => Promise<void>;
  clearError: () => void;
}

const Ctx = createContext<ResumeCtx | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActive] = useState<Resume | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxAllowed, setMaxAllowed] = useState(5);
  const timers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const clearTimers = () => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current.clear();
  };
  useEffect(() => () => clearTimers(), []);

  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resumeApi.list();
      setResumes(data.resumes);
      setMaxAllowed(data.maxAllowed);
      setActive(data.resumes.find((r) => r.isActive) ?? null);
      // resume polling for anything still parsing
      for (const r of data.resumes) {
        if (r.status === 'parsing') startPolling(r.resumeId);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResumeDetail = useCallback(async (id: string): Promise<Resume | null> => {
    try {
      setError(null);
      const resume = await resumeApi.detail(id);
      setResumes((prev) => prev.map((r) => (r.resumeId === id ? resume : r)));
      return resume;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      if (timers.current.has(id)) return;
      const t = setInterval(async () => {
        const resume = await fetchResumeDetail(id);
        if (resume) {
          if (resume.status === 'parsed' || resume.status === 'failed') {
            clearInterval(t);
            timers.current.delete(id);
            fetchResumes();
          }
        } else {
          clearInterval(t);
          timers.current.delete(id);
        }
      }, 2000);
      timers.current.set(id, t);
    },
    [fetchResumeDetail, fetchResumes],
  );

  const uploadResume = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const buffer = await file.arrayBuffer();
        const hash = await sha256Hex(buffer);

        const validation = await resumeApi.validateHash(hash);
        if (validation.isDuplicate === true) {
          setError('Duplicate file detected. This resume has already been uploaded.');
          return false;
        }

        const urlData = await resumeApi.generatePresignedUrl({
          fileName: file.name,
          fileSize: file.size,
          fileHash: hash,
        });

        await resumeApi.uploadToS3(urlData.uploadUrl, buffer);
        await resumeApi.process(urlData.resumeId);
        await fetchResumes();
        startPolling(urlData.resumeId);
        return true;
      } catch (e) {
        setError(String(e));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchResumes, startPolling],
  );

  const deleteResume = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        await resumeApi.delete(id);
        const t = timers.current.get(id);
        if (t) {
          clearInterval(t);
          timers.current.delete(id);
        }
        await fetchResumes();
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [fetchResumes],
  );

  const setActiveResume = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        await resumeApi.setActive(id);
        await fetchResumes();
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    },
    [fetchResumes],
  );

  const value: ResumeCtx = {
    resumes,
    activeResume,
    isLoading,
    error,
    maxAllowed,
    fetchResumes,
    fetchResumeDetail,
    uploadResume,
    deleteResume,
    setActiveResume,
    clearError: () => setError(null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useResumes(): ResumeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useResumes must be used within ResumeProvider');
  return ctx;
}

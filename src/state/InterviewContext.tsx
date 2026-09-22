import {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { InterviewController, type InterviewSnapshot } from '@/lib/interviewController';

interface InterviewCtx {
  state: InterviewSnapshot;
  controller: InterviewController;
}

const Ctx = createContext<InterviewCtx | null>(null);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const ref = useRef<InterviewController>();
  if (!ref.current) ref.current = new InterviewController();
  const controller = ref.current;

  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);

  return <Ctx.Provider value={{ state, controller }}>{children}</Ctx.Provider>;
}

export function useInterview(): InterviewCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
}

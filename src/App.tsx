import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './state/AuthContext';
import { isEnvConfigured } from './config/env';
import { SplashScreen } from './screens/SplashScreen';
import { ConfigErrorScreen } from './screens/ConfigErrorScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { TabsLayout } from './components/layout/TabsLayout';
import { DashboardScreen } from './screens/tabs/DashboardScreen';
import { PracticeScreen } from './screens/tabs/PracticeScreen';
import { HistoryScreen } from './screens/tabs/HistoryScreen';
import { ProfileScreen } from './screens/tabs/ProfileScreen';
import { ResumeUploadScreen } from './screens/resume/ResumeUploadScreen';
import { ResumeDetailScreen } from './screens/resume/ResumeDetailScreen';
import { InterviewSessionScreen } from './screens/interview/InterviewSessionScreen';
import { FeedbackReportScreen } from './screens/interview/FeedbackReportScreen';
import { JobMatchScreen } from './screens/interview/JobMatchScreen';
import { HelpSupportScreen } from './screens/profile/HelpSupportScreen';
import { type ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function App() {
  const { isInitializing } = useAuth();

  if (!isEnvConfigured()) return <ConfigErrorScreen />;
  if (isInitializing) return <SplashScreen />;

  return (
    <Routes>
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/login" element={<RedirectIfAuthed><LoginScreen /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><RegisterScreen /></RedirectIfAuthed>} />

      <Route
        element={
          <RequireAuth>
            <TabsLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/practice" element={<PracticeScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>

      <Route path="/profile/help" element={<RequireAuth><HelpSupportScreen /></RequireAuth>} />
      <Route path="/job-match" element={<RequireAuth><JobMatchScreen /></RequireAuth>} />
      <Route path="/resume/upload" element={<RequireAuth><ResumeUploadScreen /></RequireAuth>} />
      <Route path="/resume/:resumeId" element={<RequireAuth><ResumeDetailScreen /></RequireAuth>} />
      <Route
        path="/interview/session/:sessionId"
        element={<RequireAuth><InterviewSessionScreen /></RequireAuth>}
      />
      <Route path="/feedback/:sessionId" element={<RequireAuth><FeedbackReportScreen /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

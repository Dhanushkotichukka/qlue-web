import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import { App } from './App';
import { initFirebase } from './lib/firebase';
import { ThemeProvider } from './state/ThemeContext';
import { AppearanceProvider } from './state/AppearanceContext';
import { AuthProvider } from './state/AuthContext';
import { ResumeProvider } from './state/ResumeContext';
import { DashboardProvider } from './state/DashboardContext';
import { InterviewProvider } from './state/InterviewContext';
import { ToastProvider } from './components/ui/Toast';

initFirebase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppearanceProvider>
          <ToastProvider>
            <AuthProvider>
              <ResumeProvider>
                <DashboardProvider>
                  <InterviewProvider>
                    <App />
                  </InterviewProvider>
                </DashboardProvider>
              </ResumeProvider>
            </AuthProvider>
          </ToastProvider>
        </AppearanceProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

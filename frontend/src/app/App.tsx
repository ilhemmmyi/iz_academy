import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { FloatingChatWidget } from './components/FloatingChatWidget';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { settingsApi } from '../api/settings.api';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: 'red', fontFamily: 'monospace' }}>
          <h1>Erreur</h1>
          <pre>{this.state.error.message}</pre>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-pink-50 px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/iz-logo.png" alt="IZ Academy" className="h-8 w-auto" />
            <span className="font-semibold text-xl">IZ Academy</span>
        </div>
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Site en maintenance</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          IZ Academy est temporairement indisponible. Nous effectuons une maintenance pour améliorer votre expérience. Nous revenons très bientôt !
        </p>
        <div className="bg-white rounded-xl border border-border px-6 py-4 text-sm text-muted-foreground">
          Pour toute urgence, contactez-nous :{' '}
          <a href="mailto:imenzarai@iz-academy.com" className="text-primary hover:underline font-medium">
            imenzarai@iz-academy.com
          </a>
        </div>
      </div>
    </div>
  );
}

function MaintenanceGate({ children }: { children: ReactNode }) {
  const [maintenance, setMaintenance] = useState(false);
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    settingsApi.getAll()
      .then(s => setMaintenance(s.maintenanceMode === 'true'))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (maintenance && user?.role !== 'ADMIN') {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MaintenanceGate>
          <RouterProvider router={router} />
          <ForcePasswordChangeModal />
          <FloatingChatWidget />
        </MaintenanceGate>
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}

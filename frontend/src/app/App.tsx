import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from '../context/AuthContext';
import { FloatingChatWidget } from './components/FloatingChatWidget';
<<<<<<< HEAD
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
=======
>>>>>>> ba8db72789a1b6c442bcd55d3869e6465139c9a4
import { Component, ErrorInfo, ReactNode } from 'react';

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

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
<<<<<<< HEAD
        <ForcePasswordChangeModal />
=======
>>>>>>> ba8db72789a1b6c442bcd55d3869e6465139c9a4
        <FloatingChatWidget />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
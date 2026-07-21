import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppErrorBoundary } from '@/app/error-boundary/AppErrorBoundary';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ThemeController } from '@/app/providers/ThemeController';
import { ToastProvider } from '@/ui/Toast/ToastProvider';
import { AppRouter } from '@/app/router/AppRouter';
import { createQueryClient } from '@/app/providers/queryClient';
import { env } from '@/lib/config/env';

const queryClient = createQueryClient();

const basename = env.basePath && env.basePath !== '/' ? env.basePath : undefined;

/** Application root: providers, theme, routing. */
export function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <AuthProvider>
            <ThemeController />
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

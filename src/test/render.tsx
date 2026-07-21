import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/ui/Toast/ToastProvider';

/** Create a QueryClient with retries disabled for deterministic tests. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface Options {
  route?: string;
  withToast?: boolean;
  queryClient?: QueryClient;
}

/** Render a component inside the router + query + toast providers. */
export function renderWithProviders(ui: ReactElement, options: Options = {}): RenderResult {
  const client = options.queryClient ?? createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[options.route ?? '/']}>
        {options.withToast ? <ToastProvider>{children}</ToastProvider> : children}
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper });
}

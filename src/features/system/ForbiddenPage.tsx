import { useNavigate } from 'react-router-dom';
import { ErrorFallback } from '@/app/error-boundary/ErrorFallback';
import { paths } from '@/app/router/routes';
import { useDocumentTitle } from '@/app/hooks/useDocumentTitle';

export function ForbiddenPage(): React.JSX.Element {
  useDocumentTitle('Kein Zugriff');
  const navigate = useNavigate();
  return (
    <main id="main-content">
      <ErrorFallback
        title="Kein Zugriff"
        description="Diese Ansicht gehört zu einem anderen Household."
        onRetry={() => navigate(paths.today, { replace: true })}
        retryLabel="Zur Startseite"
      />
    </main>
  );
}

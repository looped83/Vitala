import { useNavigate } from 'react-router-dom';
import { ErrorFallback } from '@/app/error-boundary/ErrorFallback';
import { paths } from '@/app/router/routes';
import { useDocumentTitle } from '@/app/hooks/useDocumentTitle';

export function NotFoundPage(): React.JSX.Element {
  useDocumentTitle('Seite nicht gefunden');
  const navigate = useNavigate();
  return (
    <main id="main-content">
      <ErrorFallback
        title="Diese Seite gibt es nicht"
        description="Der aufgerufene Bereich existiert nicht oder wurde verschoben."
        onRetry={() => navigate(paths.today, { replace: true })}
        retryLabel="Zur Startseite"
      />
    </main>
  );
}

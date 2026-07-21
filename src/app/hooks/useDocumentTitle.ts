import { useEffect } from 'react';

/** Set a unique document title (accessibility §19.1). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Vitala`;
  }, [title]);
}

import { useMemo, useState } from 'react';
import { Page } from '@/app/layout/Page';
import { Button } from '@/ui/Button/Button';
import { Spinner } from '@/ui/Spinner/Spinner';
import { Alert } from '@/ui/Alert/Alert';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { Icon } from '@/ui/Icon/Icon';
import { useAuth } from '@/app/providers/AuthProvider';
import { useCurrentHousehold, useHouseholdMembers } from '@/features/household/queries';
import { useCatalog, useHistory } from '@/features/capture/queries';
import { EMPTY_FILTER, filterEntries, groupByDay, isFilterActive } from '@/domain/activity/history';
import type { HistoryFilter } from '@/domain/activity/history';
import type { HistoryEntry } from '@/domain/activity/types';
import { CaptureDialog } from '@/features/capture/CaptureDialog';
import { EntryCard } from './EntryCard';
import { EntryDetailDialog } from './EntryDetailDialog';
import { DeleteEntryDialog } from './DeleteEntryDialog';
import { HistoryFilters } from './HistoryFilters';
import styles from './HistoryPage.module.css';

export function HistoryPage(): React.JSX.Element {
  const { user } = useAuth();
  const { data: current } = useCurrentHousehold();
  const householdId = current?.household.id;
  const { data: members = [] } = useHouseholdMembers(householdId);
  const catalog = useCatalog();
  const history = useHistory(householdId, catalog, !catalog.isLoading);

  const [filter, setFilter] = useState<HistoryFilter>(EMPTY_FILTER);
  const [detail, setDetail] = useState<HistoryEntry | null>(null);
  const [editing, setEditing] = useState<HistoryEntry | null>(null);
  const [deleting, setDeleting] = useState<HistoryEntry | null>(null);

  const names = useMemo(
    () => new Map(members.map((m) => [m.userId, m.displayName || 'Person'])),
    [members],
  );
  const partner = useMemo(
    () => members.find((m) => m.userId !== user?.id && m.status === 'active') ?? null,
    [members, user?.id],
  );

  const allEntries = useMemo(
    () => history.data?.pages.flatMap((page) => page.entries) ?? [],
    [history.data],
  );
  const filtered = useMemo(() => filterEntries(allEntries, filter), [allEntries, filter]);
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const loading = catalog.isLoading || history.isLoading;

  return (
    <Page
      documentTitle="Historie"
      heading="Historie"
      intro="Alle erfassten Aktivitäten und Handlungen – gemeinsam und chronologisch."
    >
      <div className={styles.wrap}>
        <HistoryFilters filter={filter} onChange={setFilter} members={members} />

        {catalog.isError || history.isError ? (
          <Alert tone="attention" role="alert">
            Die Historie konnte nicht geladen werden. Bitte prüfe deine Verbindung und versuche es
            erneut.
          </Alert>
        ) : null}

        {loading ? (
          <div className={styles.center}>
            <Spinner size="lg" label="Historie wird geladen" />
          </div>
        ) : allEntries.length === 0 ? (
          <EmptyState
            icon={<Icon name="review" size={32} />}
            title="Noch keine Einträge"
            description="Sobald ihr etwas erfasst, erscheint es hier in eurer gemeinsamen Historie."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={32} />}
            title="Keine Treffer"
            description="Für diese Filter wurden keine Einträge gefunden."
            action={
              isFilterActive(filter) ? (
                <Button variant="secondary" onClick={() => setFilter(EMPTY_FILTER)}>
                  Filter zurücksetzen
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className={styles.groups}>
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`day-${group.key}`}>
                <h2 id={`day-${group.key}`} className={styles.dayHeading}>
                  {group.label}
                </h2>
                <ul className={styles.list}>
                  {group.entries.map((entry) => (
                    <li key={`${entry.kind}:${entry.id}`}>
                      <EntryCard
                        entry={entry}
                        names={names}
                        onOpen={setDetail}
                        onEdit={setEditing}
                        onDelete={setDeleting}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {history.hasNextPage ? (
              <div className={styles.center}>
                <Button
                  variant="secondary"
                  loading={history.isFetchingNextPage}
                  onClick={() => void history.fetchNextPage()}
                >
                  Mehr laden
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <EntryDetailDialog
        entry={detail}
        names={names}
        onClose={() => setDetail(null)}
        onEdit={(entry) => {
          setDetail(null);
          setEditing(entry);
        }}
        onDelete={(entry) => {
          setDetail(null);
          setDeleting(entry);
        }}
      />

      {editing ? (
        <CaptureDialog
          open
          area={editing.area}
          types={catalog.types}
          definitions={catalog.definitions}
          partner={partner}
          currentUserId={user?.id ?? ''}
          existingEntries={allEntries}
          initial={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <DeleteEntryDialog entry={deleting} onClose={() => setDeleting(null)} />
    </Page>
  );
}

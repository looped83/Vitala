import { useMemo, useState } from 'react';
import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { Button } from '@/ui/Button/Button';
import { Chip } from '@/ui/Chip/Chip';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Card } from '@/ui/Card/Card';
import { Icon } from '@/ui/Icon/Icon';
import { Spinner } from '@/ui/Spinner/Spinner';
import { Alert } from '@/ui/Alert/Alert';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import { useAuth } from '@/app/providers/AuthProvider';
import { useCurrentHousehold, useHouseholdMembers } from '@/features/household/queries';
import { useCatalog } from '@/features/capture/queries';
import type { Goal, GoalTemplate } from '@/domain/goals/types';
import { OWNER_TYPE_LABEL } from '@/domain/goals/types';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { GoalDetail } from './GoalDetail';
import { goalOwnerLabel } from './ownerLabel';
import { useGoalsOverview, useGoalTemplates } from './queries';
import styles from './GoalsPage.module.css';

type Scope = 'all' | 'personal' | 'shared';

export function GoalsPage(): React.JSX.Element {
  const { user } = useAuth();
  const { data: household } = useCurrentHousehold();
  const householdId = household?.household.id;
  const { data: members } = useHouseholdMembers(householdId);
  const catalog = useCatalog();
  const goalsQuery = useGoalsOverview(householdId);
  const templatesQuery = useGoalTemplates();

  const [scope, setScope] = useState<Scope>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [pickedTemplate, setPickedTemplate] = useState<GoalTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [detail, setDetail] = useState<Goal | null>(null);

  const namesById = useMemo(
    () => new Map((members ?? []).map((m) => [m.userId, m.displayName])),
    [members],
  );
  const formMembers = useMemo(
    () =>
      (members ?? [])
        .filter((m) => m.status === 'active')
        .map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members],
  );

  const goals = goalsQuery.data ?? [];
  const active = goals.filter(
    (g) => g.status === 'active' && (scope === 'all' || g.ownerType === scope),
  );
  const paused = goals.filter((g) => g.status === 'paused');
  const finished = goals.filter((g) => g.status === 'completed' || g.status === 'expired');
  const archived = goals.filter((g) => g.status === 'archived');

  function openCreate(): void {
    setEditing(null);
    setPickedTemplate(null);
    setShowForm(false);
    setCreateOpen(true);
  }

  function closeDialog(): void {
    setCreateOpen(false);
    setEditing(null);
    setPickedTemplate(null);
    setShowForm(false);
  }

  const dialogOpen = createOpen || Boolean(editing);
  const showingForm = showForm || Boolean(editing) || Boolean(pickedTemplate);

  function renderGoals(list: Goal[], compact = false): React.JSX.Element {
    return (
      <div className={styles.grid}>
        {list.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            compact={compact}
            ownerLabel={goalOwnerLabel(g, namesById)}
            onEdit={(goal) => setEditing(goal)}
            onOpenDetail={(goal) => setDetail(goal)}
          />
        ))}
      </div>
    );
  }

  return (
    <Page
      documentTitle="Ziele"
      heading="Ziele"
      intro="Ziele sind freiwillig – persönlich oder gemeinsam. Kein Druck, keine Strafe."
      actions={
        <Button leadingIcon={<Icon name="plus" size={18} />} onClick={openCreate}>
          Neues Ziel
        </Button>
      }
    >
      {goalsQuery.isError ? (
        <Alert tone="attention">Die Ziele konnten nicht geladen werden.</Alert>
      ) : null}

      {goalsQuery.isLoading ? (
        <div className={styles.loading}>
          <Spinner label="Ziele werden geladen" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Icon name="goals" size={32} />}
          title="Noch keine Ziele"
          description="Lege dein erstes persönliches oder gemeinsames Ziel an – aus einer Vorlage oder ganz frei."
          action={<Button onClick={openCreate}>Erstes Ziel anlegen</Button>}
        />
      ) : (
        <div className={styles.sections}>
          <Section
            title="Aktive Ziele"
            description="Was gerade läuft."
            action={
              <div className={styles.scope} role="group" aria-label="Ziele filtern">
                {(['all', 'personal', 'shared'] as Scope[]).map((s) => (
                  <Chip key={s} pressed={scope === s} onClick={() => setScope(s)}>
                    {s === 'all' ? 'Alle' : OWNER_TYPE_LABEL[s]}
                  </Chip>
                ))}
              </div>
            }
          >
            {active.length > 0 ? (
              renderGoals(active)
            ) : (
              <p className={styles.hint}>Keine aktiven Ziele in dieser Ansicht.</p>
            )}
          </Section>

          {paused.length > 0 ? (
            <Section title="Pausierte Ziele" description="Ohne Verlust – jederzeit fortsetzbar.">
              {renderGoals(paused)}
            </Section>
          ) : null}

          {finished.length > 0 ? (
            <Section title="Abgeschlossene Ziele">{renderGoals(finished)}</Section>
          ) : null}

          {archived.length > 0 ? (
            <Section title="Archivierte Ziele" description="Verlauf bleibt erhalten.">
              {renderGoals(archived, true)}
            </Section>
          ) : null}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? 'Ziel bearbeiten' : showingForm ? 'Neues Ziel' : 'Ziel aus Vorlage'}
      >
        {showingForm ? (
          <GoalForm
            goal={editing}
            template={pickedTemplate}
            members={formMembers}
            currentUserId={user?.id ?? ''}
            catalog={catalog}
            onSaved={closeDialog}
            onCancel={closeDialog}
          />
        ) : (
          <div className={styles.picker}>
            <p className={styles.pickerIntro}>
              Aus einer Vorlage starten oder ein eigenes Ziel anlegen.
            </p>
            <Button variant="secondary" fullWidth onClick={() => setShowForm(true)}>
              Eigenes Ziel erstellen
            </Button>
            <div className={styles.templateGrid}>
              {(templatesQuery.data ?? []).map((t) => (
                <Card key={t.key} className={styles.templateCard} padding="none">
                  <button
                    type="button"
                    className={styles.templateButton}
                    onClick={() => setPickedTemplate(t)}
                  >
                    <span className={styles.templateHead}>
                      <LifeAreaBadge area={t.lifeArea} iconOnly size={16} />
                      <span className={styles.templateTitle}>{t.title}</span>
                    </span>
                    {t.description ? (
                      <span className={styles.templateDesc}>{t.description}</span>
                    ) : null}
                    <span className={styles.templateOwner}>{OWNER_TYPE_LABEL[t.ownerType]}</span>
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      {detail && householdId ? (
        <GoalDetail
          goal={detail}
          householdId={householdId}
          ownerLabel={goalOwnerLabel(detail, namesById)}
          open={Boolean(detail)}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </Page>
  );
}

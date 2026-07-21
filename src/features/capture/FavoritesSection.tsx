import { useState } from 'react';
import { Section } from '@/ui/Section/Section';
import { Button } from '@/ui/Button/Button';
import { Icon } from '@/ui/Icon/Icon';
import { IconButton } from '@/ui/Button/IconButton';
import { DropdownMenu } from '@/ui/Menu/DropdownMenu';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { useToast } from '@/ui/Toast/ToastProvider';
import { LifeAreaBadge } from './LifeAreaBadge';
import { FavoriteDialog } from './FavoriteDialog';
import { useDeleteFavorite } from './queries';
import type { ActivityType, Favorite, RitualDefinition } from '@/domain/activity/types';
import styles from './FavoritesSection.module.css';

export interface FavoritesSectionProps {
  favorites: Favorite[];
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] };
  householdId: string | undefined;
  canManage: boolean;
  onRun: (favorite: Favorite) => void;
}

/** Quick-action favourites: run, create, edit, delete (spec §18). */
export function FavoritesSection({
  favorites,
  catalog,
  householdId,
  canManage,
  onRun,
}: FavoritesSectionProps): React.JSX.Element {
  const toast = useToast();
  const deleteFavorite = useDeleteFavorite();
  const [editing, setEditing] = useState<Favorite | 'new' | null>(null);

  async function remove(favorite: Favorite): Promise<void> {
    try {
      await deleteFavorite.mutateAsync(favorite.id);
      toast.show('Favorit gelöscht.', 'success');
    } catch {
      toast.show('Der Favorit konnte nicht gelöscht werden.', 'attention');
    }
  }

  return (
    <Section
      title="Schnellaktionen"
      description="Häufige Einträge mit einem Tipp – vor dem Speichern anpassbar."
      headingLevel={2}
      action={
        canManage ? (
          <Button
            variant="secondary"
            leadingIcon={<Icon name="star" size={18} />}
            onClick={() => setEditing('new')}
          >
            Neuer Favorit
          </Button>
        ) : undefined
      }
    >
      {favorites.length === 0 ? (
        <EmptyState
          icon={<Icon name="star" size={28} />}
          title="Noch keine Favoriten"
          description="Lege häufige Aktivitäten als Schnellaktion an, um sie mit einem Tipp zu erfassen."
        />
      ) : (
        <ul className={styles.list}>
          {favorites.map((favorite) => (
            <li key={favorite.id} className={styles.item}>
              <button type="button" className={styles.run} onClick={() => onRun(favorite)}>
                <LifeAreaBadge area={favorite.area} iconOnly size={18} />
                <span className={styles.label}>{favorite.label}</span>
                {favorite.isShared ? (
                  <span className={styles.shared} aria-label="Gemeinsam">
                    <Icon name="shared" size={14} />
                  </span>
                ) : null}
              </button>
              <DropdownMenu
                label={`Favorit ${favorite.label} verwalten`}
                trigger={({ ref, ...props }) => (
                  <IconButton
                    ref={ref}
                    label={`Favorit ${favorite.label} verwalten`}
                    icon={<Icon name="menu" size={18} />}
                    variant="quiet"
                    {...props}
                  />
                )}
                items={[
                  {
                    id: 'edit',
                    label: 'Bearbeiten',
                    icon: <Icon name="edit" size={16} />,
                    onSelect: () => setEditing(favorite),
                  },
                  {
                    id: 'delete',
                    label: 'Löschen',
                    icon: <Icon name="trash" size={16} />,
                    tone: 'danger',
                    onSelect: () => void remove(favorite),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <FavoriteDialog
          catalog={catalog}
          householdId={householdId}
          favorite={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Section>
  );
}

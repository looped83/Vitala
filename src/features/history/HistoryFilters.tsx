import { useState } from 'react';
import { Chip } from '@/ui/Chip/Chip';
import { Button } from '@/ui/Button/Button';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { Drawer } from '@/ui/Drawer/Drawer';
import { Badge } from '@/ui/Badge/Badge';
import { Icon } from '@/ui/Icon/Icon';
import { FormField } from '@/ui/Form/FormField';
import { LIFE_AREAS, LIFE_AREA_META } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import { EMPTY_FILTER, isFilterActive } from '@/domain/activity/history';
import type { HistoryFilter } from '@/domain/activity/history';
import { INTENSITIES, INTENSITY_LABEL } from '@/domain/activity/types';
import type { HouseholdMemberWithProfile } from '@/data/repositories/household';
import styles from './HistoryFilters.module.css';

export interface HistoryFiltersProps {
  filter: HistoryFilter;
  onChange: (filter: HistoryFilter) => void;
  members: HouseholdMemberWithProfile[];
}

function countAdvanced(filter: HistoryFilter): number {
  let n = 0;
  if (filter.userId) n += 1;
  if (filter.participation !== 'all') n += 1;
  if (filter.intensity) n += 1;
  if (filter.from) n += 1;
  if (filter.to) n += 1;
  return n;
}

export function HistoryFilters({
  filter,
  onChange,
  members,
}: HistoryFiltersProps): React.JSX.Element {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const advancedCount = countAdvanced(filter);

  function toggleArea(area: LifeArea): void {
    const areas = filter.areas.includes(area)
      ? filter.areas.filter((a) => a !== area)
      : [...filter.areas, area];
    onChange({ ...filter, areas });
  }

  const personOptions = [
    { value: '', label: 'Alle Personen' },
    ...members.map((m) => ({ value: m.userId, label: m.displayName || 'Person' })),
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.searchRow}>
        <FormField label="Historie durchsuchen" hideLabel className={styles.searchField}>
          <div className={styles.searchInner}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Icon name="search" size={18} />
            </span>
            <Input
              type="search"
              placeholder="In Typ, Bezeichnung und Notiz suchen"
              value={filter.query}
              onChange={(e) => onChange({ ...filter, query: e.target.value })}
            />
          </div>
        </FormField>
        <Button
          variant="secondary"
          leadingIcon={<Icon name="filter" size={18} />}
          onClick={() => setDrawerOpen(true)}
        >
          Filter
          {advancedCount > 0 ? (
            <>
              {' '}
              <Badge tone="primary">{advancedCount}</Badge>
            </>
          ) : null}
        </Button>
      </div>

      <div className={styles.areaChips} role="group" aria-label="Nach Lebensbereich filtern">
        {LIFE_AREAS.map((area) => (
          <Chip key={area} pressed={filter.areas.includes(area)} onClick={() => toggleArea(area)}>
            {LIFE_AREA_META[area].label}
          </Chip>
        ))}
      </div>

      {isFilterActive(filter) ? (
        <div>
          <Button variant="quiet" onClick={() => onChange(EMPTY_FILTER)}>
            Filter zurücksetzen
          </Button>
        </div>
      ) : null}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filter" side="bottom">
        <div className={styles.drawerBody}>
          <FormField label="Person">
            <Select
              options={personOptions}
              value={filter.userId}
              onChange={(e) => onChange({ ...filter, userId: e.target.value })}
            />
          </FormField>
          <FormField label="Beteiligung">
            <Select
              options={[
                { value: 'all', label: 'Alle Einträge' },
                { value: 'shared', label: 'Nur gemeinsame' },
                { value: 'personal', label: 'Nur persönliche' },
              ]}
              value={filter.participation}
              onChange={(e) =>
                onChange({
                  ...filter,
                  participation: e.target.value as HistoryFilter['participation'],
                })
              }
            />
          </FormField>
          <FormField label="Intensität (Bewegung)">
            <Select
              options={[
                { value: '', label: 'Alle' },
                ...INTENSITIES.map((i) => ({ value: i, label: INTENSITY_LABEL[i] })),
              ]}
              value={filter.intensity}
              onChange={(e) =>
                onChange({ ...filter, intensity: e.target.value as HistoryFilter['intensity'] })
              }
            />
          </FormField>
          <div className={styles.dateRow}>
            <FormField label="Von">
              <Input
                type="date"
                value={filter.from}
                onChange={(e) => onChange({ ...filter, from: e.target.value })}
              />
            </FormField>
            <FormField label="Bis">
              <Input
                type="date"
                value={filter.to}
                onChange={(e) => onChange({ ...filter, to: e.target.value })}
              />
            </FormField>
          </div>
          <div className={styles.drawerActions}>
            <Button variant="quiet" onClick={() => onChange(EMPTY_FILTER)}>
              Zurücksetzen
            </Button>
            <Button onClick={() => setDrawerOpen(false)}>Fertig</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

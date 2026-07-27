import { useCallback } from 'react';
import { CITY_CANVAS } from '@/domain/city/layout';
import { SLOT_STATUS_LABEL } from '@/domain/city/display';
import { regionA11yLabel, slotA11yLabel } from '@/domain/city/a11y';
import type { CityModel } from '@/domain/city/model';
import type { RegionTheme, RegionView, SlotView } from '@/domain/city/types';
import { isRegionSelected, isSlotSelected } from './selection';
import type { CitySelection } from './selection';
import styles from './city.module.css';

const THEME_CLASS: Record<RegionTheme, string | undefined> = {
  center: styles.themeCenter,
  residential: styles.themeResidential,
  movement: styles.themeMovement,
  nutrition: styles.themeNutrition,
  sustainability: styles.themeSustainability,
  nature: styles.themeNature,
  community: styles.themeCommunity,
  water: styles.themeWater,
  expansion: styles.themeExpansion,
};

/** Radius of a slot marker by size category. */
const SLOT_RADIUS: Record<SlotView['definition']['size'], number> = {
  small: 14,
  medium: 18,
  large: 24,
  nature_project: 20,
  infrastructure: 20,
  community: 22,
};

/**
 * Split a label into at most two wrapped lines of `max` characters. Words longer
 * than `max` (e.g. "Nachhaltigkeitsinfrastruktur") are hard-broken with a hyphen
 * so a title can never overflow its region rectangle.
 */
function wrapLabel(text: string, max = 18, maxLines = 3): string[] {
  const words: string[] = [];
  for (const word of text.split(' ')) {
    let rest = word;
    while (rest.length > max) {
      words.push(`${rest.slice(0, max - 1)}-`);
      rest = rest.slice(max - 1);
    }
    if (rest) words.push(rest);
  }

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) current = word;
    else if (`${current} ${word}`.length <= max) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  // Keep the layout stable: truncate the last visible line with an ellipsis.
  const visible = lines.slice(0, maxLines);
  const last = visible[maxLines - 1] ?? '';
  visible[maxLines - 1] = `${last.slice(0, Math.max(0, max - 1))}…`;
  return visible;
}

export interface CityMapProps {
  model: CityModel;
  selection: CitySelection;
  onSelectRegion: (regionId: RegionView['definition']['id']) => void;
  onSelectSlot: (slotId: string) => void;
  /** Zoom factor; the SVG grows and the viewport scrolls (§26). */
  zoom: number;
}

/**
 * The interactive top-down city map (ADR-0001). Regions and unlocked building
 * slots are real, focusable, keyboard-operable SVG buttons with full aria-labels
 * — no information lives in hover alone (§24). Decorative scenery is grouped and
 * aria-hidden so the DOM stays light (§37/§55).
 */
export function CityMap({
  model,
  selection,
  onSelectRegion,
  onSelectSlot,
  zoom,
}: CityMapProps): React.JSX.Element {
  const keyActivate = useCallback((event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      action();
    }
  }, []);

  const onFocusScroll = useCallback((event: React.FocusEvent<SVGGElement>) => {
    // Keep the focused element visible when zoomed in (§26 — no lost focus).
    const el = event.currentTarget as unknown as { scrollIntoView?: (opt: object) => void };
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, []);

  return (
    <div className={styles.mapViewport}>
      <svg
        className={styles.map}
        viewBox={`0 0 ${CITY_CANVAS.width} ${CITY_CANVAS.height}`}
        style={{ width: `${zoom * 100}%` }}
        role="group"
        aria-label={model.summary}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Decorative base scenery: paths + water accent, never interactive. */}
        <g className={styles.decor} aria-hidden="true">
          <line
            x1={175}
            y1={130}
            x2={825}
            y2={570}
            stroke="var(--map-slot-stroke)"
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.35}
          />
          <line
            x1={500}
            y1={40}
            x2={500}
            y2={660}
            stroke="var(--map-slot-stroke)"
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.25}
          />
        </g>

        {model.regions.map((region) => (
          <CityRegion
            key={region.definition.id}
            region={region}
            selected={isRegionSelected(selection, region.definition.id)}
            onSelect={() => onSelectRegion(region.definition.id)}
            onKeyActivate={keyActivate}
            onFocusScroll={onFocusScroll}
          />
        ))}

        {model.regions.flatMap((region) =>
          region.slots
            .filter((slot) => slot.status !== 'locked')
            .map((slot) => (
              <CitySlot
                key={slot.definition.id}
                slot={slot}
                regionTitle={region.definition.title}
                selected={isSlotSelected(selection, slot.definition.id)}
                onSelect={() => onSelectSlot(slot.definition.id)}
                onKeyActivate={keyActivate}
                onFocusScroll={onFocusScroll}
              />
            )),
        )}
      </svg>
    </div>
  );
}

interface RegionProps {
  region: RegionView;
  selected: boolean;
  onSelect: () => void;
  onKeyActivate: (event: React.KeyboardEvent, action: () => void) => void;
  onFocusScroll: (event: React.FocusEvent<SVGGElement>) => void;
}

function CityRegion({
  region,
  selected,
  onSelect,
  onKeyActivate,
  onFocusScroll,
}: RegionProps): React.JSX.Element {
  const { definition, status } = region;
  const { rect } = definition;
  const locked = status === 'locked';
  const cls = [
    styles.region,
    THEME_CLASS[definition.theme],
    locked ? styles.regionLocked : '',
    status === 'newly_unlocked' ? styles.regionNew : '',
  ]
    .filter(Boolean)
    .join(' ');
  const titleLines = wrapLabel(definition.title);
  const cx = rect.x + rect.width / 2;

  return (
    <g
      className={cls}
      role="button"
      tabIndex={0}
      aria-label={regionA11yLabel(region)}
      data-selected={selected ? 'true' : undefined}
      data-region-id={definition.id}
      onClick={onSelect}
      onKeyDown={(e) => onKeyActivate(e, onSelect)}
      onFocus={onFocusScroll}
    >
      <rect
        className={styles.regionRect}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx={14}
      />
      <text className={styles.regionLabel} x={cx} y={rect.y + 40} textAnchor="middle">
        {titleLines.map((line, i) => (
          <tspan key={line} x={cx} dy={i === 0 ? 0 : 26}>
            {line}
          </tspan>
        ))}
      </text>
      {locked ? (
        <text className={styles.lockBadge} x={cx} y={rect.y + rect.height - 24} textAnchor="middle">
          🔒 Ab Stadtlevel {definition.unlockLevel}
        </text>
      ) : (
        <text className={styles.regionSub} x={cx} y={rect.y + rect.height - 22} textAnchor="middle">
          {region.availableSlots === 0
            ? 'Landschaft'
            : `${region.availableSlots} freie ${
                region.availableSlots === 1 ? 'Baufläche' : 'Bauflächen'
              }`}
        </text>
      )}
    </g>
  );
}

interface SlotProps {
  slot: SlotView;
  regionTitle: string;
  selected: boolean;
  onSelect: () => void;
  onKeyActivate: (event: React.KeyboardEvent, action: () => void) => void;
  onFocusScroll: (event: React.FocusEvent<SVGGElement>) => void;
}

function CitySlot({
  slot,
  regionTitle,
  selected,
  onSelect,
  onKeyActivate,
  onFocusScroll,
}: SlotProps): React.JSX.Element {
  const { definition, status } = slot;
  const r = SLOT_RADIUS[definition.size];
  const cls = [styles.slot, status === 'reserved' ? styles.slotReserved : '']
    .filter(Boolean)
    .join(' ');
  return (
    <g
      className={cls}
      role="button"
      tabIndex={0}
      aria-label={slotA11yLabel(slot, regionTitle)}
      data-selected={selected ? 'true' : undefined}
      data-slot-id={definition.id}
      onClick={onSelect}
      onKeyDown={(e) => onKeyActivate(e, onSelect)}
      onFocus={onFocusScroll}
    >
      <rect
        className={styles.slotShape}
        x={definition.position.x - r}
        y={definition.position.y - r}
        width={r * 2}
        height={r * 2}
        rx={6}
      />
      <text className={styles.slotIcon} x={definition.position.x} y={definition.position.y}>
        {status === 'reserved' ? '◇' : '▢'}
      </text>
      <title>{`${SLOT_STATUS_LABEL[status]}`}</title>
    </g>
  );
}

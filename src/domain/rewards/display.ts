import type { ResourceKey, XpReason, ResourceReason } from './constants';
import type { ResourceGrant } from './xp';
import type { RewardBreakdown } from './preview';

/** Display metadata for the five resources (resources-and-xp §5). Icon + text
 *  always accompany each other — never colour or symbol alone (§58). */
export interface ResourceMeta {
  key: ResourceKey;
  label: string;
  symbol: string;
  /** One-line "what it will build later" note (§10, §53). */
  future: string;
}

export const RESOURCE_META: Record<ResourceKey, ResourceMeta> = {
  energy: {
    key: 'energy',
    label: 'Energie',
    symbol: '⚡',
    future: 'Später für Sport- und Bewegungsgebäude.',
  },
  food: {
    key: 'food',
    label: 'Nahrung',
    symbol: '🌱',
    future: 'Später für Garten- und Versorgungsgebäude.',
  },
  nature: {
    key: 'nature',
    label: 'Natur',
    symbol: '🌿',
    future: 'Später für Parks, Biotope und Tierlebensräume.',
  },
  community: {
    key: 'community',
    label: 'Gemeinschaft',
    symbol: '🤝',
    future: 'Später für Gemeinschafts- und Kulturgebäude.',
  },
  building_material: {
    key: 'building_material',
    label: 'Baumaterial',
    symbol: '🧱',
    future: 'Entsteht aus ausgewogenen Wochen und baut alle Projekte.',
  },
};

/** Resource keys in canonical display order. */
export const RESOURCE_DISPLAY_ORDER: readonly ResourceKey[] = [
  'energy',
  'food',
  'nature',
  'community',
  'building_material',
];

export function resourceLabel(key: ResourceKey): string {
  return RESOURCE_META[key].label;
}

/** "2 Energie, 1 Gemeinschaft" — screen-reader friendly, no colour reliance. */
export function formatResourceGrants(grants: ResourceGrant[]): string {
  const parts = grants
    .filter((g) => g.amount !== 0)
    .map((g) => `${g.amount > 0 ? g.amount : g.amount} ${resourceLabel(g.key)}`);
  return parts.join(', ');
}

const XP_REASON_LABEL: Record<XpReason, string> = {
  activity: 'Bewegung',
  ritual: 'Ritual',
  checkin: 'Check-in',
  goal: 'Ziel abgeschlossen',
  mission: 'Mission abgeschlossen',
  balance_bonus: 'Balance-Bonus',
  week_bonus: 'Wochenbonus',
  correction: 'Korrektur',
};

export function xpReasonLabel(reason: XpReason): string {
  return XP_REASON_LABEL[reason];
}

const RESOURCE_REASON_LABEL: Record<ResourceReason, string> = {
  grant: 'Erhalten',
  balance_bonus: 'Balance-Bonus',
  week_material: 'Wochen-Baumaterial',
  mission: 'Mission',
  goal: 'Ziel',
  refund: 'Rückerstattung',
  spend_build: 'Für Bau verwendet',
  correction: 'Korrektur',
};

export function resourceReasonLabel(reason: ResourceReason): string {
  return RESOURCE_REASON_LABEL[reason];
}

/** Neutral, transparent explanation of a per-entry reward (§54). Every element
 *  states *why* the value arose — no black box, no hype. */
export function describeReward(breakdown: RewardBreakdown): string[] {
  const lines: string[] = [];
  if (breakdown.personalXp > 0) lines.push(`${breakdown.personalXp} persönliche XP`);
  if (breakdown.cityXp > 0) lines.push(`${breakdown.cityXp} Stadt-XP`);
  const res = formatResourceGrants(breakdown.resources);
  if (res) lines.push(res);
  if (breakdown.sharedBonus) lines.push('Gemeinsamer Beitrag zur Stadt');
  if (breakdown.capped) {
    lines.push('Das tägliche XP-Limit für diesen Bereich wurde erreicht. Der Eintrag bleibt vollständig dokumentiert.');
  }
  return lines;
}

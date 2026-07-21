import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { renderWithProviders } from '@/test/render';
import { RitualForm } from './RitualForm';
import type { RitualDefinition } from '@/domain/activity/types';

expect.extend(axeMatchers);

const saveRitualCheckin = vi.fn<(args: unknown) => Promise<string>>();
vi.mock('@/data/repositories/entries', () => ({
  saveRitualCheckin: (args: unknown) => saveRitualCheckin(args),
  saveActivity: vi.fn(),
  deleteEntry: vi.fn(),
  getHistoryPage: vi.fn(),
  getEntryDetail: vi.fn(),
}));

const VEG = '11111111-1111-1111-1111-111111111111';
const MEAL = '22222222-2222-2222-2222-222222222222';
const definitions: RitualDefinition[] = [
  {
    id: MEAL,
    key: 'balanced_vegan_meal',
    area: 'nutrition',
    kind: 'daily_block',
    name: 'Ausgewogene vegane Hauptmahlzeit',
    icon: null,
    sortOrder: 10,
  },
  {
    id: VEG,
    key: 'vegetables',
    area: 'nutrition',
    kind: 'daily_block',
    name: 'Gemüse',
    icon: null,
    sortOrder: 30,
  },
];

function setup() {
  const onSaved = vi.fn();
  const result = renderWithProviders(
    <RitualForm
      area="nutrition"
      definitions={definitions}
      partner={null}
      currentUserId="u1"
      existingEntries={[]}
      onSaved={onSaved}
    />,
    { withToast: true },
  );
  return { onSaved, ...result };
}

describe('RitualForm', () => {
  beforeEach(() => saveRitualCheckin.mockReset());

  it('renders building blocks as accessible toggle chips', () => {
    setup();
    const chip = screen.getByRole('button', { name: 'Gemüse' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('has no accessibility violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('blocks an empty selection with a message', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByText(/mindestens einen Eintrag/i)).toBeInTheDocument();
    expect(saveRitualCheckin).not.toHaveBeenCalled();
  });

  it('saves the selected blocks as one check-in', async () => {
    saveRitualCheckin.mockResolvedValue('group-1');
    const { onSaved } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Gemüse' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ausgewogene vegane Hauptmahlzeit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(saveRitualCheckin).toHaveBeenCalledTimes(1));
    const call = saveRitualCheckin.mock.calls[0]?.[0] as { area: string; definitionIds: string[] };
    expect(call.area).toBe('nutrition');
    expect(call.definitionIds.sort()).toEqual([VEG, MEAL].sort());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});

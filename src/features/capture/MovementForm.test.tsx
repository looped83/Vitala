import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { renderWithProviders } from '@/test/render';
import { MovementForm } from './MovementForm';
import type { ActivityType } from '@/domain/activity/types';
import { todayInZone } from '@/lib/dates/day';

expect.extend(axeMatchers);

const saveActivity = vi.fn<(args: unknown) => Promise<string>>();
vi.mock('@/data/repositories/entries', () => ({
  saveActivity: (args: unknown) => saveActivity(args),
  saveRitualCheckin: vi.fn(),
  deleteEntry: vi.fn(),
  getHistoryPage: vi.fn(),
  getEntryDetail: vi.fn(),
}));

const STRENGTH_ID = '11111111-1111-1111-1111-111111111111';
const YOGA_ID = '22222222-2222-2222-2222-222222222222';
const types: ActivityType[] = [
  {
    id: STRENGTH_ID,
    key: 'strength',
    name: 'Krafttraining',
    category: 'strength',
    icon: null,
    sortOrder: 10,
  },
  { id: YOGA_ID, key: 'yoga', name: 'Yoga', category: 'mobility', icon: null, sortOrder: 90 },
];

function setup() {
  const onSaved = vi.fn();
  const result = renderWithProviders(
    <MovementForm
      types={types}
      partner={null}
      currentUserId="u1"
      existingEntries={[]}
      onSaved={onSaved}
    />,
    { withToast: true },
  );
  return { onSaved, ...result };
}

describe('MovementForm', () => {
  beforeEach(() => saveActivity.mockReset());

  it('renders the required fields with accessible labels', () => {
    setup();
    expect(screen.getByLabelText(/Aktivitätstyp/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Datum/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dauer/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Intensität/ })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('rejects an out-of-range duration without calling the server', async () => {
    setup();
    const duration = screen.getByLabelText(/Dauer/);
    await userEvent.clear(duration);
    await userEvent.type(duration, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(await screen.findByText(/Mindestens 5 Minuten/)).toBeInTheDocument();
    expect(saveActivity).not.toHaveBeenCalled();
  });

  it('submits a valid entry to the RPC wrapper and reports success', async () => {
    saveActivity.mockResolvedValue('new-id');
    const { onSaved } = setup();
    await userEvent.selectOptions(screen.getByLabelText(/Aktivitätstyp/), YOGA_ID);
    const duration = screen.getByLabelText(/Dauer/);
    await userEvent.clear(duration);
    await userEvent.type(duration, '40');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(saveActivity).toHaveBeenCalledTimes(1));
    expect(saveActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        activityTypeId: YOGA_ID,
        durationMin: 40,
        occurredOn: todayInZone(),
        isShared: false,
      }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});

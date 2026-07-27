import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CityHeader } from './CityHeader';
import { UnlockBanner } from './UnlockBanner';
import { RenameCityDialog } from './RenameCityDialog';
import { buildCityModel } from '@/domain/city/model';
import { getRegionDefinition } from '@/domain/city/layout';
import type { CityState } from '@/domain/city/types';

function state(level: number, cityXp = 0): CityState {
  return {
    householdId: 'hh',
    name: 'Grünmühle',
    layoutVersion: 1,
    currentLevel: level,
    highestLevel: level,
    cityXp,
    xpToNext: 100,
  };
}

describe('CityHeader', () => {
  it('shows the level, stage and next unlock, and reflects the active view', () => {
    const model = buildCityModel(state(1), 10);
    render(<CityHeader model={model} view="map" onChangeView={vi.fn()} onRename={vi.fn()} />);
    expect(screen.getByText(/Stadtlevel 1 · Keimzelle/)).toBeInTheDocument();
    expect(screen.getByText(/Als Nächstes: Sportviertel ab Stadtlevel 2/)).toBeInTheDocument();
    const mapBtn = screen.getByRole('button', { name: 'Karte' });
    expect(mapBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches view on toggle', async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();
    const model = buildCityModel(state(1), 10);
    render(<CityHeader model={model} view="map" onChangeView={onChangeView} onRename={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Liste' }));
    expect(onChangeView).toHaveBeenCalledWith('list');
  });
});

describe('UnlockBanner', () => {
  it('renders nothing when nothing is new', () => {
    const { container } = render(<UnlockBanner regions={[]} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names newly unlocked regions and dismisses calmly', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <UnlockBanner regions={[getRegionDefinition('movement_quarter')!]} onDismiss={onDismiss} />,
    );
    expect(screen.getByText(/Sportviertel/)).toBeInTheDocument();
    // No urgency language.
    expect(screen.queryByText(/jetzt/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Verstanden' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('RenameCityDialog', () => {
  it('rejects markup client-side before submitting (§69)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RenameCityDialog open currentName="Grünmühle" onClose={vi.fn()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Stadtname');
    await user.clear(input);
    await user.type(input, '<script>');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/spitzen Klammern/i)).toBeInTheDocument();
  });

  it('submits a valid name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RenameCityDialog open currentName="Alt" onClose={vi.fn()} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('Stadtname');
    await user.clear(input);
    await user.type(input, 'Neustadt');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(onSubmit).toHaveBeenCalledWith('Neustadt');
  });
});

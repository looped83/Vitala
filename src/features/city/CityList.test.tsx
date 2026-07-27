import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { CityList } from './CityList';
import { CityDetail } from './CityDetail';
import { buildCityModel } from '@/domain/city/model';
import type { CityState } from '@/domain/city/types';

expect.extend(axeMatchers);

function state(level: number): CityState {
  return {
    householdId: 'hh',
    name: 'Unsere Stadt',
    layoutVersion: 1,
    currentLevel: level,
    highestLevel: level,
    cityXp: 0,
    xpToNext: 100,
  };
}

describe('CityList', () => {
  it('lists every region with unlock status and level (map/list equivalence)', () => {
    const model = buildCityModel(state(3), 3);
    render(<CityList model={model} onSelectRegion={vi.fn()} onSelectSlot={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Stadtzentrum' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Naturschutzgebiet' })).toBeInTheDocument();
    // Locked region names its unlock level in text.
    expect(screen.getByText(/wird auf Stadtlevel 5 freigeschaltet/i)).toBeInTheDocument();
  });

  it('selects a region and a slot via the list', async () => {
    const user = userEvent.setup();
    const onSelectRegion = vi.fn();
    const onSelectSlot = vi.fn();
    const model = buildCityModel(state(3), 3);
    render(<CityList model={model} onSelectRegion={onSelectRegion} onSelectSlot={onSelectSlot} />);
    await user.click(screen.getAllByRole('button', { name: 'Details' })[0]!);
    expect(onSelectRegion).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Details: Gemeinschaftsfläche, frei/i }));
    expect(onSelectSlot).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const model = buildCityModel(state(3), 3);
    const { container } = render(
      <CityList model={model} onSelectRegion={vi.fn()} onSelectSlot={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('CityDetail', () => {
  it('shows a region resource, areas and later options', () => {
    const model = buildCityModel(state(5), 5);
    render(<CityDetail model={model} selection={{ kind: 'region', regionId: 'nature_reserve' }} />);
    expect(screen.getByRole('heading', { name: 'Naturschutzgebiet' })).toBeInTheDocument();
    expect(screen.getByText('Tierwohl')).toBeInTheDocument();
    expect(screen.getByText(/Vorschau/i)).toBeInTheDocument();
  });

  it('states that building begins in Phase 7 for an available slot (no fake buildings)', () => {
    const model = buildCityModel(state(1), 1);
    render(<CityDetail model={model} selection={{ kind: 'slot', slotId: 'center_community_1' }} />);
    expect(screen.getByText(/Phase 7/i)).toBeInTheDocument();
  });

  it('explains a locked region with its required level (§32)', () => {
    const model = buildCityModel(state(1), 1);
    render(<CityDetail model={model} selection={{ kind: 'region', regionId: 'nature_reserve' }} />);
    expect(screen.getByText(/wird auf Stadtlevel 5 freigeschaltet/i)).toBeInTheDocument();
    // No urgency / purchase language.
    expect(screen.queryByText(/jetzt freischalten/i)).not.toBeInTheDocument();
  });
});

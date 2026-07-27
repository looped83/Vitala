import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CityMap } from './CityMap';
import { buildCityModel } from '@/domain/city/model';
import type { CityState } from '@/domain/city/types';

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

describe('CityMap', () => {
  it('renders each region as a labelled button', () => {
    const model = buildCityModel(state(1), 1);
    render(
      <CityMap
        model={model}
        selection={null}
        onSelectRegion={vi.fn()}
        onSelectSlot={vi.fn()}
        zoom={1}
      />,
    );
    // City centre is available and focusable.
    expect(screen.getByRole('button', { name: /Stadtzentrum, verfügbar/i })).toBeInTheDocument();
  });

  it('marks a locked region with its unlock level (not colour alone)', () => {
    const model = buildCityModel(state(1), 1);
    render(
      <CityMap
        model={model}
        selection={null}
        onSelectRegion={vi.fn()}
        onSelectSlot={vi.fn()}
        zoom={1}
      />,
    );
    expect(
      screen.getByRole('button', {
        name: /Naturschutzgebiet, gesperrt, Freischaltung auf Stadtlevel 5/i,
      }),
    ).toBeInTheDocument();
  });

  it('selects a region on click and on keyboard activation', async () => {
    const user = userEvent.setup();
    const onSelectRegion = vi.fn();
    const model = buildCityModel(state(1), 1);
    render(
      <CityMap
        model={model}
        selection={null}
        onSelectRegion={onSelectRegion}
        onSelectSlot={vi.fn()}
        zoom={1}
      />,
    );
    const center = screen.getByRole('button', { name: /Stadtzentrum, verfügbar/i });
    await user.click(center);
    expect(onSelectRegion).toHaveBeenCalledWith('city_center');

    center.focus();
    await user.keyboard('{Enter}');
    expect(onSelectRegion).toHaveBeenCalledTimes(2);
  });

  it('renders interactive slots only for unlocked regions', () => {
    const model = buildCityModel(state(1), 1);
    render(
      <CityMap
        model={model}
        selection={null}
        onSelectRegion={vi.fn()}
        onSelectSlot={vi.fn()}
        zoom={1}
      />,
    );
    // A city-centre slot is present…
    expect(
      screen.getByRole('button', { name: /Gemeinschaftsfläche, frei, Stadtzentrum/i }),
    ).toBeInTheDocument();
    // …but no nature slot (region locked at level 1).
    expect(screen.queryByRole('button', { name: /Naturprojektfläche/i })).not.toBeInTheDocument();
  });

  it('exposes the whole map with an accessible group name mentioning the list', () => {
    const model = buildCityModel(state(3), 3);
    render(
      <CityMap
        model={model}
        selection={null}
        onSelectRegion={vi.fn()}
        onSelectSlot={vi.fn()}
        zoom={1}
      />,
    );
    const group = screen.getByRole('group', { name: /Listenansicht/i });
    expect(within(group).getAllByRole('button').length).toBeGreaterThan(5);
  });
});

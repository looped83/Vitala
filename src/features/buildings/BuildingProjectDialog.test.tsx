/**
 * Building project dialog E2E tests (Phase 7, AP7).
 * Tests slot selection, cost confirmation, and project creation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BuildingProjectDialog } from './BuildingProjectDialog';
import * as queries from './queries';
import * as household from '@/features/household/queries';
import * as rewards from '@/features/rewards/queries';

vi.mock('./queries');
vi.mock('@/features/household/queries');
vi.mock('@/features/rewards/queries');

describe('BuildingProjectDialog', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  const mockBuilding = {
    id: 'def-1',
    title: 'Sports Hall',
    description: 'A place for movement',
    base_cost_energy: 100,
    base_cost_food: 50,
    base_cost_nature: 25,
    base_cost_community: 10,
    base_cost_building_material: 15,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockOnClose.mockClear();

    vi.mocked(household.useCurrentHousehold).mockReturnValue({
      data: {
        household: { id: 'hh-1', name: 'Test Household' },
      } as any,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(queries.useStartConstructionProject).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'proj-1' }),
      isPending: false,
      isError: false,
      error: null,
    } as any);
  });

  const renderDialog = (building = mockBuilding) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BuildingProjectDialog building={building} onClose={mockOnClose} />
      </QueryClientProvider>,
    );
  };

  it('displays building title in dialog', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 500, food: 300, nature: 200, community: 100, building_material: 50 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();
    expect(screen.getByText(/Build Sports Hall/i)).toBeInTheDocument();
  });

  it('shows cost breakdown for all resources', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 500, food: 300, nature: 200, community: 100, building_material: 50 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();

    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Building Material')).toBeInTheDocument();

    // Check cost values
    const rows = screen.getAllByText(/\d+/);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('allows slot ID input', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 500, food: 300, nature: 200, community: 100, building_material: 50 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();

    const input = screen.getByPlaceholderText(/Slot ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'slot-42' } });
    expect(input.value).toBe('slot-42');
  });

  it('disables start button when slot is empty', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 500, food: 300, nature: 200, community: 100, building_material: 50 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();

    const button = screen.getByRole('button', { name: /Start Project/i });
    expect(button).toBeDisabled();
  });

  it('disables start button when resources insufficient', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 50, food: 30, nature: 20, community: 5, building_material: 5 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();

    const input = screen.getByPlaceholderText(/Slot ID/i);
    fireEvent.change(input, { target: { value: 'slot-1' } });

    const button = screen.getByRole('button', { name: /Start Project/i });
    expect(button).toBeDisabled();
  });

  it('enables start button with valid slot and sufficient resources', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 500, food: 300, nature: 200, community: 100, building_material: 50 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();

    const input = screen.getByPlaceholderText(/Slot ID/i);
    fireEvent.change(input, { target: { value: 'slot-1' } });

    const button = screen.getByRole('button', { name: /Start Project/i });
    expect(button).not.toBeDisabled();
  });


  it('shows insufficient resources warning', () => {
    vi.mocked(rewards.useResourceBalances).mockReturnValue({
      data: { energy: 50, food: 30, nature: 20, community: 5, building_material: 5 },
      isLoading: false,
      error: null,
    } as any);

    renderDialog();

    expect(
      screen.getByText(/You don't have enough resources to build this/i),
    ).toBeInTheDocument();
  });
});

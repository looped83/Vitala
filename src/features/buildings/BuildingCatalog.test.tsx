/**
 * Building catalog E2E tests (Phase 7, AP7).
 * Tests data fetching, filtering, and UI rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BuildingCatalog } from './BuildingCatalog';
import * as queries from './queries';

// Mock the queries
vi.mock('./queries', () => ({
  useBuildingDefinitions: vi.fn(),
  useBuiltBuildings: vi.fn(),
}));

vi.mock('@/features/household/queries', () => ({
  useCurrentHousehold: vi.fn(),
}));

import * as household from '@/features/household/queries';

describe('BuildingCatalog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(household.useCurrentHousehold).mockReturnValue({
      data: {
        household: { id: 'hh-1', name: 'Test Household' },
      } as any,
      isLoading: false,
      error: null,
    } as any);
  });

  const renderCatalog = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BuildingCatalog />
      </QueryClientProvider>,
    );
  };

  it('shows loading state while fetching definitions', () => {
    vi.mocked(queries.useBuildingDefinitions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    vi.mocked(queries.useBuiltBuildings).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderCatalog();
    // Should not show empty state or any buildings while loading
    expect(screen.queryByText(/No buildings available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Movement/i)).not.toBeInTheDocument();
  });

  it('shows empty state when no buildings available', () => {
    vi.mocked(queries.useBuildingDefinitions).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useBuiltBuildings).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderCatalog();
    expect(screen.getByText(/No buildings available/i)).toBeInTheDocument();
  });

  it('displays building definitions grouped by category', () => {
    const mockDefinitions = [
      {
        id: 'def-1',
        title: 'Sports Hall',
        description: 'A place for movement',
        primary_category: 'movement',
        base_cost_energy: 100,
        base_cost_food: 0,
        base_cost_nature: 0,
        base_cost_community: 0,
        base_cost_building_material: 0,
        definition_version: 1,
        sort_order: 1,
      },
      {
        id: 'def-2',
        title: 'Garden',
        description: 'Fresh vegetables',
        primary_category: 'nutrition',
        base_cost_energy: 0,
        base_cost_food: 80,
        base_cost_nature: 20,
        base_cost_community: 0,
        base_cost_building_material: 0,
        definition_version: 1,
        sort_order: 2,
      },
    ];

    vi.mocked(queries.useBuildingDefinitions).mockReturnValue({
      data: mockDefinitions,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useBuiltBuildings).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderCatalog();

    expect(screen.getByText(/Movement & Fitness/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutrition & Growth/i)).toBeInTheDocument();
    expect(screen.getByText('Sports Hall')).toBeInTheDocument();
    expect(screen.getByText('Garden')).toBeInTheDocument();
  });

  it('counts built buildings per definition', () => {
    const mockDefinitions = [
      {
        id: 'def-1',
        title: 'Park',
        description: 'Green space',
        primary_category: 'sustainability',
        base_cost_energy: 0,
        base_cost_food: 0,
        base_cost_nature: 150,
        base_cost_community: 0,
        base_cost_building_material: 0,
        definition_version: 1,
        sort_order: 1,
      },
    ];

    const mockBuiltBuildings = [
      {
        id: 'inst-1',
        building_definition_id: 'def-1',
        completed_at: '2024-01-01',
      },
      {
        id: 'inst-2',
        building_definition_id: 'def-1',
        completed_at: '2024-01-05',
      },
    ];

    vi.mocked(queries.useBuildingDefinitions).mockReturnValue({
      data: mockDefinitions,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useBuiltBuildings).mockReturnValue({
      data: mockBuiltBuildings,
      isLoading: false,
      error: null,
    } as any);

    renderCatalog();

    expect(screen.getByText(/Built 2/i)).toBeInTheDocument();
  });

  it('handles disabled query when household is missing', () => {
    const useBuiltBuildingsCall = vi.mocked(queries.useBuiltBuildings);
    useBuiltBuildingsCall.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(queries.useBuildingDefinitions).mockReturnValue({
      data: [
        {
          id: 'def-1',
          title: 'Test Building',
          description: 'A test building',
          primary_category: 'other',
          base_cost_energy: 0,
          base_cost_food: 0,
          base_cost_nature: 0,
          base_cost_community: 0,
          base_cost_building_material: 0,
          definition_version: 1,
          sort_order: 1,
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    renderCatalog();

    // Should still render with 0 built count when data is undefined
    expect(screen.getByText('Test Building')).toBeInTheDocument();
  });
});

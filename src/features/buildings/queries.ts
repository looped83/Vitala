/**
 * Building system queries and mutations (Phase 7, AP6).
 * React Query hooks for catalog, projects, effects, and state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data/supabase/client';

/**
 * Fetch all building definitions for the catalog.
 */
export function useBuildingDefinitions() {
  return useQuery<any[]>({
    queryKey: ['buildings', 'definitions'],
    queryFn: async () => {
      const { data, error } = await ((supabase as any).from('building_definitions') as any).select('*');
      if (error) throw error;
      const filtered = (data || []).filter((d: any) => d.definition_version === 1);
      return filtered.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    staleTime: Infinity, // Definitions never change
  });
}

/**
 * Fetch built buildings for the household.
 */
export function useBuiltBuildings(householdId?: string) {
  return useQuery<any[]>({
    queryKey: ['buildings', 'instances', householdId],
    queryFn: async () => {
      const { data, error } = await ((supabase as any).from('city_building_instances') as any)
        .select('*');

      if (error) throw error;
      const filtered = (data || []).filter((d: any) => d.household_id === householdId);
      return filtered.sort((a: any, b: any) => {
        const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bDate - aDate;
      });
    },
    enabled: !!householdId,
  });
}

/**
 * Fetch active/completed construction projects.
 */
export function useConstructionProjects(householdId?: string) {
  return useQuery<any[]>({
    queryKey: ['buildings', 'projects', householdId],
    queryFn: async () => {
      const { data, error } = await ((supabase as any).from('construction_projects') as any)
        .select('*');

      if (error) throw error;
      const filtered = (data || []).filter((d: any) => d.household_id === householdId);
      return filtered.sort((a: any, b: any) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
    },
    enabled: !!householdId,
  });
}

/**
 * Fetch single project with progress.
 */
export function useConstructionProject(projectId?: string) {
  return useQuery<any>({
    queryKey: ['buildings', 'project', projectId],
    queryFn: async () => {
      const { data, error } = await ((supabase as any).from('construction_projects') as any)
        .select('*');

      if (error) throw error;
      return (data || []).find((d: any) => d.id === projectId) || null;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch project progress via RPC.
 */
export function useProjectProgress(projectId?: string) {
  return useQuery<any>({
    queryKey: ['buildings', 'progress', projectId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        'get_project_progress',
        {
          p_project_id: projectId,
        },
      );

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch refund preview for cancellation.
 */
export function useRefundPreview(projectId?: string) {
  return useQuery<any>({
    queryKey: ['buildings', 'refund_preview', projectId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        'get_project_refund_preview',
        {
          p_project_id: projectId,
        },
      );

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch available building effects.
 */
export function useBuildingEffects(buildingDefinitionId?: string) {
  return useQuery<any>({
    queryKey: ['buildings', 'effects', buildingDefinitionId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)(
        'get_building_effects',
        {
          p_building_definition_id: buildingDefinitionId,
        },
      );

      if (error) throw error;
      return data;
    },
    enabled: !!buildingDefinitionId,
  });
}

/**
 * Start a construction project (RPC mutation).
 */
export function useStartConstructionProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buildingId,
      slotId,
      idempotencyKey,
    }: {
      buildingId: string;
      slotId: string;
      idempotencyKey: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)(
        'start_construction_project',
        {
          p_building_id: buildingId,
          p_slot_id: slotId,
          p_idempotency_key: idempotencyKey,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['buildings', 'projects'],
      });
      queryClient.invalidateQueries({
        queryKey: ['buildings', 'instances'],
      });
      // Reward queries also need refresh (resources changed)
      queryClient.invalidateQueries({
        queryKey: ['rewards', 'resources'],
      });
    },
  });
}

/**
 * Cancel a construction project (RPC mutation).
 */
export function useCancelConstructionProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      idempotencyKey,
    }: {
      projectId: string;
      idempotencyKey: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)(
        'cancel_construction_project',
        {
          p_project_id: projectId,
          p_idempotency_key: idempotencyKey,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['buildings', 'projects'],
      });
      queryClient.invalidateQueries({
        queryKey: ['buildings', 'progress'],
      });
      queryClient.invalidateQueries({
        queryKey: ['rewards', 'resources'],
      });
    },
  });
}

/**
 * Add a contribution to a project (RPC mutation).
 */
export function useAddConstructionContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      sourceKind,
      sourceId,
      buildPoints,
      idempotencyKey,
    }: {
      projectId: string;
      sourceKind: string;
      sourceId: string;
      buildPoints: number;
      idempotencyKey: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)(
        'add_construction_contribution',
        {
          p_project_id: projectId,
          p_source_kind: sourceKind,
          p_source_id: sourceId,
          p_build_points: buildPoints,
          p_idempotency_key: idempotencyKey,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate the specific project
      queryClient.invalidateQueries({
        queryKey: ['buildings', 'progress', data.project_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['buildings', 'project', data.project_id],
      });
    },
  });
}

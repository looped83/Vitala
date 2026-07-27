/**
 * Building system features (Phase 7, AP6).
 * UI components, queries, and state management.
 */

export { BuildingsPage } from './BuildingsPage';
export { BuildingCatalog } from './BuildingCatalog';
export { BuildingCatalogItem } from './BuildingCatalogItem';
export { BuildingProjectDialog } from './BuildingProjectDialog';
export { ConstructionStatus } from './ConstructionStatus';

export {
  useBuildingDefinitions,
  useBuiltBuildings,
  useConstructionProjects,
  useConstructionProject,
  useProjectProgress,
  useRefundPreview,
  useBuildingEffects,
  useStartConstructionProject,
  useCancelConstructionProject,
  useAddConstructionContribution,
} from './queries';

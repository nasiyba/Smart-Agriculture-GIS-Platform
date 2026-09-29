import { useMemo } from "react";
import { calculateStatistics } from "@/services/statsService";
import type { CensusFilters, FarmBoundary, TreePoint, TreePolygon } from "@/types";

/**
 * Recomputes KPI + chart statistics whenever filters or the active map
 * selection change. Kept client-side and synchronous for the mock dataset;
 * in "arcgis" mode with very large datasets, prefer calling
 * services/gisQueries.getStatistics() (server-side outStatistics) instead
 * and treat this hook as the fallback for small/filtered subsets.
 */
export function useFilteredStatistics(
  farms: FarmBoundary[],
  treePoints: TreePoint[],
  treePolygons: TreePolygon[],
  filters: CensusFilters,
  selectedFarmIds: string[] | null
) {
  return useMemo(
    () =>
      calculateStatistics(
        farms,
        treePoints,
        treePolygons,
        filters,
        selectedFarmIds ?? undefined
      ),
    [farms, treePoints, treePolygons, filters, selectedFarmIds]
  );
}

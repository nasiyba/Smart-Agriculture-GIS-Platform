import { useEffect, useState } from "react";
import { getFarms, getFilterOptions, getTreePoints, getTreePolygons } from "@/services/gisQueries";
import { DATA_SOURCE_MODE } from "@/config/gisConfig";
import { loadLocalGeoJsonCensus } from "@/services/geojsonData";
import type { FarmBoundary, TreePoint, TreePolygon } from "@/types";

interface FilterOptions {
  governorates: string[];
  wilayatsByGovernorate: Map<string, string[]>;
  farmsByWilayat: Map<string, string[]>;
  treeTypes: string[];
}


function buildFilterOptions(
  farms: FarmBoundary[],
  treePoints: TreePoint[],
  treePolygons: TreePolygon[]
): FilterOptions {
  const governorates = [...new Set(farms.map((f) => f.governorate).filter(Boolean))].sort();
  const wilayatsByGovernorate = new Map<string, string[]>();
  for (const governorate of governorates) {
    wilayatsByGovernorate.set(
      governorate,
      [...new Set(farms.filter((f) => f.governorate === governorate).map((f) => f.wilayat).filter(Boolean))].sort()
    );
  }
  const farmsByWilayat = new Map<string, string[]>();
  for (const farm of farms) {
    if (!farm.wilayat) continue;
    const current = farmsByWilayat.get(farm.wilayat) ?? [];
    current.push(farm.farmId);
    farmsByWilayat.set(farm.wilayat, current);
  }
  for (const values of farmsByWilayat.values()) values.sort();
  const treeTypes = [
    ...new Set([...treePoints.map((p) => p.treeType), ...treePolygons.map((p) => p.treeType)].filter(Boolean)),
  ].sort();
  return { governorates, wilayatsByGovernorate, farmsByWilayat, treeTypes };
}

interface CensusDataState {
  loading: boolean;
  error: string | null;
  farms: FarmBoundary[];
  treePoints: TreePoint[];
  treePolygons: TreePolygon[];
  filterOptions: FilterOptions | null;
}

/**
 * Loads the base dataset once. In "arcgis" mode this issues the initial
 * FeatureLayer queries; in "mock" mode it reads the generated in-memory
 * dataset. Filtered views/statistics are derived separately (see
 * useFilteredStatistics) so this hook doesn't refetch on every filter change.
 */
export function useCensusData(): CensusDataState {
  const [state, setState] = useState<CensusDataState>({
    loading: true,
    error: null,
    farms: [],
    treePoints: [],
    treePolygons: [],
    filterOptions: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let farms: FarmBoundary[];
        let treePoints: TreePoint[];
        let treePolygons: TreePolygon[];
        let filterOptions: FilterOptions;

        if (DATA_SOURCE_MODE === "geojson") {
          // One startup read only. Previously the app requested the same large
          // GeoJSON datasets from four concurrent callers, which multiplied
          // network traffic and JSON parsing work.
          const local = await loadLocalGeoJsonCensus();
          farms = local.farms;
          treePoints = local.treePoints;
          treePolygons = local.treePolygons;
          filterOptions = buildFilterOptions(farms, treePoints, treePolygons);
        } else {
          [farms, treePoints, treePolygons, filterOptions] = await Promise.all([
            getFarms(),
            getTreePoints(),
            getTreePolygons(),
            getFilterOptions(),
          ]);
        }

        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          farms,
          treePoints,
          treePolygons,
          filterOptions,
        });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load census data.",
        }));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

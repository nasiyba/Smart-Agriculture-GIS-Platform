import type {
  CensusFilters,
  CensusStatistics,
  FarmBoundary,
  FarmSummary,
  TreePoint,
  TreePolygon,
  TreeTypeCount,
} from "@/types";

// ---------------------------------------------------------------------------
// All statistics logic lives here, independent of React and independent of
// whether the underlying data came from mock arrays or ArcGIS FeatureLayer
// query results. When DATA_SOURCE_MODE === "arcgis", the same shapes are
// produced server-side via outStatistics/groupByFieldsForStatistics
// (see gisQueries.ts) — these functions are the client-side equivalent used
// for the mock data path and for farm-level drill-downs.
// ---------------------------------------------------------------------------

function matchesFilters(
  filters: CensusFilters,
  governorate: string,
  wilayat: string,
  farmId: string,
  treeType?: string
): boolean {
  if (filters.governorate && filters.governorate !== governorate) return false;
  if (filters.wilayat && filters.wilayat !== wilayat) return false;
  if (filters.farmId && filters.farmId !== farmId) return false;
  if (filters.treeType && treeType && filters.treeType !== treeType) return false;
  return true;
}

/** Total tree KPI uses the actual individual-tree layer only. Tree-area polygon counts are shown separately. */
export function calculateTotalTrees(
  points: TreePoint[],
  _polygons: TreePolygon[]
): number {
  return points.length;
}

function groupPointCounts(
  points: TreePoint[],
  key: "treeType" | "wilayat" | "governorate"
): Map<string, number> {
  const map = new Map<string, number>();
  for (const pt of points) {
    const k = pt[key];
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export function calculateStatistics(
  allFarms: FarmBoundary[],
  allPoints: TreePoint[],
  allPolygons: TreePolygon[],
  filters: CensusFilters,
  /** Optional explicit farm-id subset, used for map selections/drawn areas. */
  farmIdSubset?: string[]
): CensusStatistics {
  const subsetSet = farmIdSubset ? new Set(farmIdSubset) : null;

  const farms = allFarms.filter((f) => {
    if (subsetSet && !subsetSet.has(f.farmId)) return false;
    return matchesFilters(filters, f.governorate, f.wilayat, f.farmId);
  });
  const farmIds = new Set(farms.map((f) => f.farmId));

  // The headline vegetation/tree total is driven by the vegetation point layer itself.
  // Points outside farm polygons remain valid census records and are included unless
  // the user explicitly filters to a farm or a farm subset/selection.
  const points = allPoints.filter((p) => {
    if (subsetSet && !farmIds.has(p.farmId)) return false;
    if (filters.farmId && p.farmId !== filters.farmId) return false;
    return matchesFilters({ ...filters, farmId: null }, p.governorate, p.wilayat, p.farmId, p.treeType);
  });
  const polygons = allPolygons.filter(
    (p) =>
      (!subsetSet || farmIds.has(p.farmId)) &&
      matchesFilters(filters, p.governorate, p.wilayat, p.farmId, p.treeType)
  );

  const totalTrees = calculateTotalTrees(points, polygons);

  const byType = groupPointCounts(points, "treeType");
  const byWilayat = groupPointCounts(points, "wilayat");
  const byGovernorate = groupPointCounts(points, "governorate");

  const treesByType: TreeTypeCount[] = [...byType.entries()]
    .map(([treeType, count]) => ({ treeType, count }))
    .sort((a, b) => b.count - a.count);

  const wilayatToGov = new Map(farms.map((f) => [f.wilayat, f.governorate]));
  const treesByWilayat = [...byWilayat.entries()]
    .map(([wilayat, count]) => ({
      wilayat,
      governorate: wilayatToGov.get(wilayat) ?? "",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const treesByGovernorate = [...byGovernorate.entries()]
    .map(([governorate, count]) => ({ governorate, count }))
    .sort((a, b) => b.count - a.count);

  const farmsByWilayatMap = new Map<string, number>();
  for (const f of farms) {
    farmsByWilayatMap.set(f.wilayat, (farmsByWilayatMap.get(f.wilayat) ?? 0) + 1);
  }
  const farmsByWilayat = [...farmsByWilayatMap.entries()]
    .map(([wilayat, count]) => ({
      wilayat,
      governorate: wilayatToGov.get(wilayat) ?? "",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalFarms: farms.length,
    totalTrees,
    treeTypeCount: byType.size,
    totalSurveyedAreaHa: Math.round(farms.reduce((s, f) => s + f.farmAreaHa, 0) * 10) / 10,
    governoratesCovered: new Set(farms.map((f) => f.governorate)).size,
    wilayatsCovered: new Set(farms.map((f) => f.wilayat)).size,
    treesByType,
    treesByWilayat,
    treesByGovernorate,
    farmsByWilayat,
  };
}

export function calculateFarmSummary(
  farm: FarmBoundary,
  allPoints: TreePoint[],
  allPolygons: TreePolygon[]
): FarmSummary {
  const points = allPoints.filter((p) => p.farmId === farm.farmId);
  const polygons = allPolygons.filter((p) => p.farmId === farm.farmId);
  const totalTrees = calculateTotalTrees(points, polygons);
  const byType = groupPointCounts(points, "treeType");

  const treeTypeBreakdown: TreeTypeCount[] = [...byType.entries()]
    .map(([treeType, count]) => ({ treeType, count }))
    .sort((a, b) => b.count - a.count);

  return {
    farmId: farm.farmId,
    governorate: farm.governorate,
    wilayat: farm.wilayat,
    farmAreaHa: farm.farmAreaHa,
    totalTrees,
    treeTypeCount: byType.size,
    dominantTreeType: treeTypeBreakdown[0]?.treeType ?? "—",
    treeTypeBreakdown,
  };
}

export function buildFarmSummaries(
  farms: FarmBoundary[],
  points: TreePoint[],
  polygons: TreePolygon[]
): FarmSummary[] {
  return farms.map((f) => calculateFarmSummary(f, points, polygons));
}


/** Statistics for the exact features intersecting a drawn map area. */
export function calculateAreaSelectionStatistics(
  allFarms: FarmBoundary[],
  allPoints: TreePoint[],
  allPolygons: TreePolygon[],
  filters: CensusFilters,
  selection: { farmIds: string[]; treeIds: string[]; areaIds: string[] }
): CensusStatistics {
  const farmSet = new Set(selection.farmIds);
  const treeSet = new Set(selection.treeIds);
  const areaSet = new Set(selection.areaIds);

  const farms = allFarms.filter((f) => farmSet.has(f.farmId) && matchesFilters(filters, f.governorate, f.wilayat, f.farmId));
  const points = allPoints.filter((p) => treeSet.has(p.treeId) && matchesFilters(filters, p.governorate, p.wilayat, p.farmId, p.treeType));
  const polygons = allPolygons.filter((p) => areaSet.has(p.areaId) && matchesFilters(filters, p.governorate, p.wilayat, p.farmId, p.treeType));

  const totalTrees = calculateTotalTrees(points, polygons);
  const byType = groupPointCounts(points, "treeType");
  const byWilayat = groupPointCounts(points, "wilayat");
  const byGovernorate = groupPointCounts(points, "governorate");

  const treesByType: TreeTypeCount[] = [...byType.entries()].map(([treeType, count]) => ({ treeType, count })).sort((a, b) => b.count - a.count);
  const wilayatToGov = new Map(farms.map((f) => [f.wilayat, f.governorate]));
  const treesByWilayat = [...byWilayat.entries()].map(([wilayat, count]) => ({ wilayat, governorate: wilayatToGov.get(wilayat) ?? "", count })).sort((a, b) => b.count - a.count);
  const treesByGovernorate = [...byGovernorate.entries()].map(([governorate, count]) => ({ governorate, count })).sort((a, b) => b.count - a.count);
  const farmsByWilayatMap = new Map<string, number>();
  for (const f of farms) farmsByWilayatMap.set(f.wilayat, (farmsByWilayatMap.get(f.wilayat) ?? 0) + 1);
  const farmsByWilayat = [...farmsByWilayatMap.entries()].map(([wilayat, count]) => ({ wilayat, governorate: wilayatToGov.get(wilayat) ?? "", count })).sort((a, b) => b.count - a.count);

  return {
    totalFarms: farms.length,
    totalTrees,
    treeTypeCount: byType.size,
    totalSurveyedAreaHa: Math.round(farms.reduce((s, f) => s + f.farmAreaHa, 0) * 10) / 10,
    governoratesCovered: new Set(farms.map((f) => f.governorate)).size,
    wilayatsCovered: new Set(farms.map((f) => f.wilayat)).size,
    treesByType,
    treesByWilayat,
    treesByGovernorate,
    farmsByWilayat,
  };
}

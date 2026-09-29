import {
  DATA_SOURCE_MODE,
  FIELD_NAMES,
  GIS_SERVICE_URLS,
} from "@/config/gisConfig";
import { generateMockCensus } from "@/services/mockData";
import { loadLocalGeoJsonCensus } from "@/services/geojsonData";
import { calculateStatistics, buildFarmSummaries } from "@/services/statsService";
import type {
  CensusFilters,
  CensusStatistics,
  FarmBoundary,
  FarmSummary,
  TreePoint,
  TreePolygon,
} from "@/types";

// ---------------------------------------------------------------------------
// Every function here has two code paths:
//   - "mock": reads from the in-memory generated dataset (default, works with
//     no backend at all).
//   - "arcgis": queries the FeatureLayers configured in gisConfig.ts using
//     ArcGIS REST query patterns (outFields, outStatistics,
//     groupByFieldsForStatistics, definitionExpression) so that large
//     datasets are aggregated server-side rather than pulled into the browser.
//
// Swapping DATA_SOURCE_MODE in gisConfig.ts is the only change needed —
// components call getFarms()/getStatistics()/etc. and never touch this
// branching directly.
// ---------------------------------------------------------------------------

let FeatureLayerCtor: any = null;
let QueryCtor: any = null;

/** Lazily loads @arcgis/core so the mock-only path never pays the bundle cost. */
async function loadArcgisModules() {
  if (!FeatureLayerCtor) {
    const [{ default: FeatureLayer }, { default: Query }] = await Promise.all([
      import("@arcgis/core/layers/FeatureLayer"),
      import("@arcgis/core/rest/support/Query"),
    ]);
    FeatureLayerCtor = FeatureLayer;
    QueryCtor = Query;
  }
  return { FeatureLayer: FeatureLayerCtor, Query: QueryCtor };
}

function definitionExpressionFor(filters: CensusFilters): string | undefined {
  const clauses: string[] = [];
  if (filters.governorate) clauses.push(`Governorate = '${filters.governorate}'`);
  if (filters.wilayat) clauses.push(`Wilayat = '${filters.wilayat}'`);
  if (filters.farmId) clauses.push(`Farm_ID = '${filters.farmId}'`);
  return clauses.length ? clauses.join(" AND ") : undefined;
}

// ------------------------------ FARMS -------------------------------------

export async function getFarms(filters?: CensusFilters): Promise<FarmBoundary[]> {
  if (DATA_SOURCE_MODE === "mock" || DATA_SOURCE_MODE === "geojson") {
    const { farms } =
      DATA_SOURCE_MODE === "mock" ? generateMockCensus() : await loadLocalGeoJsonCensus();
    if (!filters) return farms;
    return farms.filter(
      (f) =>
        (!filters.governorate || f.governorate === filters.governorate) &&
        (!filters.wilayat || f.wilayat === filters.wilayat) &&
        (!filters.farmId || f.farmId === filters.farmId)
    );
  }

  const { FeatureLayer } = await loadArcgisModules();
  const layer = new FeatureLayer({ url: GIS_SERVICE_URLS.FARM_BOUNDARY_SERVICE });
  const q = layer.createQuery();
  q.where = (filters && definitionExpressionFor(filters)) || "1=1";
  q.outFields = ["*"];
  q.returnGeometry = true;
  const result = await layer.queryFeatures(q);
  return result.features.map((f: any) => ({
    farmId: f.attributes[FIELD_NAMES.farm.farmId],
    governorate: f.attributes[FIELD_NAMES.farm.governorate],
    wilayat: f.attributes[FIELD_NAMES.farm.wilayat],
    farmAreaHa: f.attributes[FIELD_NAMES.farm.farmArea],
    rings: f.geometry?.rings ?? [],
    centroid: f.geometry?.centroid
      ? [f.geometry.centroid.longitude, f.geometry.centroid.latitude]
      : [0, 0],
  }));
}

// --------------------------- TREE POINTS -----------------------------------

export async function getTreePoints(filters?: CensusFilters): Promise<TreePoint[]> {
  if (DATA_SOURCE_MODE === "mock" || DATA_SOURCE_MODE === "geojson") {
    const { treePoints } =
      DATA_SOURCE_MODE === "mock" ? generateMockCensus() : await loadLocalGeoJsonCensus();
    if (!filters) return treePoints;
    return treePoints.filter(
      (p) =>
        (!filters.governorate || p.governorate === filters.governorate) &&
        (!filters.wilayat || p.wilayat === filters.wilayat) &&
        (!filters.farmId || p.farmId === filters.farmId) &&
        (!filters.treeType || p.treeType === filters.treeType)
    );
  }

  const { FeatureLayer } = await loadArcgisModules();
  const layer = new FeatureLayer({ url: GIS_SERVICE_URLS.TREE_POINT_SERVICE });
  const q = layer.createQuery();
  const clauses = definitionExpressionFor(filters ?? ({} as CensusFilters));
  q.where = filters?.treeType
    ? `${clauses ? clauses + " AND " : ""}Tree_Type = '${filters.treeType}'`
    : clauses || "1=1";
  q.outFields = ["*"];
  q.returnGeometry = true;
  const result = await layer.queryFeatures(q);
  return result.features.map((f: any) => ({
    treeId: f.attributes[FIELD_NAMES.treePoint.treeId],
    farmId: f.attributes[FIELD_NAMES.treePoint.farmId],
    treeType: f.attributes[FIELD_NAMES.treePoint.treeType],
    longitude: f.attributes[FIELD_NAMES.treePoint.longitude],
    latitude: f.attributes[FIELD_NAMES.treePoint.latitude],
    governorate: f.attributes[FIELD_NAMES.treePoint.governorate],
    wilayat: f.attributes[FIELD_NAMES.treePoint.wilayat],
  }));
}

// -------------------------- TREE POLYGONS -----------------------------------

export async function getTreePolygons(filters?: CensusFilters): Promise<TreePolygon[]> {
  if (DATA_SOURCE_MODE === "mock" || DATA_SOURCE_MODE === "geojson") {
    const { treePolygons } =
      DATA_SOURCE_MODE === "mock" ? generateMockCensus() : await loadLocalGeoJsonCensus();
    if (!filters) return treePolygons;
    return treePolygons.filter(
      (p) =>
        (!filters.governorate || p.governorate === filters.governorate) &&
        (!filters.wilayat || p.wilayat === filters.wilayat) &&
        (!filters.farmId || p.farmId === filters.farmId) &&
        (!filters.treeType || p.treeType === filters.treeType)
    );
  }

  const { FeatureLayer } = await loadArcgisModules();
  const layer = new FeatureLayer({ url: GIS_SERVICE_URLS.TREE_POLYGON_SERVICE });
  const q = layer.createQuery();
  const clauses = definitionExpressionFor(filters ?? ({} as CensusFilters));
  q.where = filters?.treeType
    ? `${clauses ? clauses + " AND " : ""}Tree_Type = '${filters.treeType}'`
    : clauses || "1=1";
  q.outFields = ["*"];
  q.returnGeometry = true;
  const result = await layer.queryFeatures(q);
  return result.features.map((f: any) => ({
    areaId: f.attributes[FIELD_NAMES.treePolygon.areaId],
    farmId: f.attributes[FIELD_NAMES.treePolygon.farmId],
    treeType: f.attributes[FIELD_NAMES.treePolygon.treeType],
    treeCount: f.attributes[FIELD_NAMES.treePolygon.treeCount] ?? 0,
    areaHa: f.attributes.Area_Ha ?? 0,
    governorate: f.attributes[FIELD_NAMES.treePolygon.governorate],
    wilayat: f.attributes[FIELD_NAMES.treePolygon.wilayat],
    rings: f.geometry?.rings ?? [],
    centroid: f.geometry?.centroid
      ? [f.geometry.centroid.longitude, f.geometry.centroid.latitude]
      : [0, 0],
  }));
}

// ------------------------- AGGREGATE STATISTICS -----------------------------
//
// In "arcgis" mode, prefer server-side aggregation via outStatistics +
// groupByFieldsForStatistics (shown below) instead of pulling every feature
// into the browser. In "mock" mode, the same result shape is produced from
// the in-memory arrays by statsService.calculateStatistics.

export async function getStatistics(
  filters: CensusFilters,
  farmIdSubset?: string[]
): Promise<CensusStatistics> {
  if (DATA_SOURCE_MODE === "mock" || DATA_SOURCE_MODE === "geojson") {
    const { farms, treePoints, treePolygons } =
      DATA_SOURCE_MODE === "mock" ? generateMockCensus() : await loadLocalGeoJsonCensus();
    return calculateStatistics(farms, treePoints, treePolygons, filters, farmIdSubset);
  }

  const { FeatureLayer, Query } = await loadArcgisModules();
  const pointLayer = new FeatureLayer({ url: GIS_SERVICE_URLS.TREE_POINT_SERVICE });
  const polygonLayer = new FeatureLayer({ url: GIS_SERVICE_URLS.TREE_POLYGON_SERVICE });
  const where = definitionExpressionFor(filters) || "1=1";

  // Server-side grouped counts for points, by Tree_Type.
  const pointStatsQuery = new Query({
    where,
    outStatistics: [
      {
        statisticType: "count",
        onStatisticField: "Tree_ID",
        outStatisticFieldName: "point_count",
      },
    ],
    groupByFieldsForStatistics: ["Tree_Type"],
  });

  // Server-side grouped SUM(Tree_Count) for polygons, by Tree_Type.
  const polygonStatsQuery = new Query({
    where,
    outStatistics: [
      {
        statisticType: "sum",
        onStatisticField: "Tree_Count",
        outStatisticFieldName: "polygon_tree_sum",
      },
    ],
    groupByFieldsForStatistics: ["Tree_Type"],
  });

  const [pointStats, polygonStats] = await Promise.all([
    pointLayer.queryFeatures(pointStatsQuery),
    polygonLayer.queryFeatures(polygonStatsQuery),
  ]);

  const byType = new Map<string, number>();
  for (const f of pointStats.features) {
    const t = f.attributes.Tree_Type;
    byType.set(t, (byType.get(t) ?? 0) + (f.attributes.point_count ?? 0));
  }
  for (const f of polygonStats.features) {
    const t = f.attributes.Tree_Type;
    byType.set(t, (byType.get(t) ?? 0) + (f.attributes.polygon_tree_sum ?? 0));
  }

  const treesByType = [...byType.entries()]
    .map(([treeType, count]) => ({ treeType, count }))
    .sort((a, b) => b.count - a.count);
  const totalTrees = treesByType.reduce((s, t) => s + t.count, 0);

  // Farm-level aggregates (count + sum of Farm_Area) still need the farm
  // layer's own outStatistics call — omitted here for brevity in mock mode,
  // but follows the identical pattern shown above.
  const farms = await getFarms(filters);

  return {
    totalFarms: farms.length,
    totalTrees,
    treeTypeCount: byType.size,
    totalSurveyedAreaHa: Math.round(farms.reduce((s, f) => s + f.farmAreaHa, 0) * 10) / 10,
    governoratesCovered: new Set(farms.map((f) => f.governorate)).size,
    wilayatsCovered: new Set(farms.map((f) => f.wilayat)).size,
    treesByType,
    treesByWilayat: [],
    treesByGovernorate: [],
    farmsByWilayat: [],
  };
}

export async function getFarmSummaries(filters?: CensusFilters): Promise<FarmSummary[]> {
  const [farms, points, polygons] = await Promise.all([
    getFarms(filters),
    getTreePoints(filters),
    getTreePolygons(filters),
  ]);
  return buildFarmSummaries(farms, points, polygons);
}

/** Distinct dropdown values, driven off the mock/real farm set (fast — small cardinality). */
export async function getFilterOptions() {
  const farms = await getFarms();
  const governorates = [...new Set(farms.map((f) => f.governorate))].sort();
  const wilayatsByGovernorate = new Map<string, string[]>();
  for (const g of governorates) {
    wilayatsByGovernorate.set(
      g,
      [...new Set(farms.filter((f) => f.governorate === g).map((f) => f.wilayat))].sort()
    );
  }
  const farmsByWilayat = new Map<string, string[]>();
  for (const f of farms) {
    const list = farmsByWilayat.get(f.wilayat) ?? [];
    list.push(f.farmId);
    farmsByWilayat.set(f.wilayat, list);
  }
  const points = await getTreePoints();
  const polygons = await getTreePolygons();
  const treeTypes = [
    ...new Set([...points.map((p) => p.treeType), ...polygons.map((p) => p.treeType)]),
  ].sort();

  return { governorates, wilayatsByGovernorate, farmsByWilayat, treeTypes };
}

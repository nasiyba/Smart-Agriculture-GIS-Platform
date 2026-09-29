// ---------------------------------------------------------------------------
// Domain types for the Agricultural Census GIS Platform.
// These mirror the attribute schema of the target File Geodatabase so that
// swapping mock data for real ArcGIS Feature Service queries requires no
// changes to component code.
// ---------------------------------------------------------------------------

export interface FarmBoundary {
  farmId: string;
  governorate: string;
  wilayat: string;
  farmAreaHa: number;
  /** Ring geometry as [lon, lat][] — populated from the FeatureLayer geometry. */
  rings: number[][][];
  centroid: [number, number];
}

export interface TreePoint {
  treeId: string;
  farmId: string;
  treeType: string;
  treeTypeAr?: string;
  vegetationHeight?: number | null;
  vegetationHealth?: string | null;
  canopyDiameter?: number | null;
  longitude: number;
  latitude: number;
  governorate: string;
  wilayat: string;
}

export interface TreePolygon {
  areaId: string;
  farmId: string;
  treeType: string;
  treeCount: number;
  /** Number of sampled grass points inside this grass polygon. Only populated for Grass. */
  grassPointCount?: number;
  areaHa: number;
  governorate: string;
  wilayat: string;
  rings: number[][][];
  centroid: [number, number];
}

/** Aggregated per-farm rollup used by the Farms table and farm info panel. */
export interface FarmSummary {
  farmId: string;
  governorate: string;
  wilayat: string;
  farmAreaHa: number;
  totalTrees: number;
  treeTypeCount: number;
  dominantTreeType: string;
  treeTypeBreakdown: TreeTypeCount[];
}

export interface TreeTypeCount {
  treeType: string;
  count: number;
}

export interface WilayatCount {
  wilayat: string;
  governorate: string;
  count: number;
}

export interface GovernorateCount {
  governorate: string;
  count: number;
}

/** The active filter state shared by the header, map, and every page. */
export interface CensusFilters {
  governorate: string | null;
  wilayat: string | null;
  farmId: string | null;
  treeType: string | null;
}

/** Dynamically computed KPI values — recalculated on every filter/selection change. */
export interface CensusStatistics {
  totalFarms: number;
  totalTrees: number;
  treeTypeCount: number;
  totalSurveyedAreaHa: number;
  governoratesCovered: number;
  wilayatsCovered: number;
  treesByType: TreeTypeCount[];
  treesByWilayat: WilayatCount[];
  treesByGovernorate: GovernorateCount[];
  farmsByWilayat: WilayatCount[];
}


export interface AreaSelection {
  farmIds: string[];
  treeIds: string[];
  areaIds: string[];
  areaHa: number;
}

/** Result of a map selection (click, box-select, or drawn polygon). */
export interface SelectionResult {
  farmIds: string[];
  statistics: CensusStatistics;
}

export interface SelectedMapFeature {
  kind: "point" | "polygon" | "operational";
  id: string;
  farmId: string;
  treeType: string;
  governorate: string;
  wilayat: string;
  longitude?: number;
  latitude?: number;
  treeTypeAr?: string;
  vegetationHeight?: number | null;
  vegetationHealth?: string | null;
  canopyDiameter?: number | null;
  count?: number;
  grassPointCount?: number;
  areaHa?: number;
  layerLabel?: string;
  attributes?: Record<string, unknown>;
}

export type GeometryFilter = "all" | "points" | "polygons";

export type DataSourceMode = "mock" | "geojson" | "arcgis";

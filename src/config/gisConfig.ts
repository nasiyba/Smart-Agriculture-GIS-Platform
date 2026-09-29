// ---------------------------------------------------------------------------
// GIS CONFIGURATION
// ---------------------------------------------------------------------------
// This is the single place you edit to connect real ArcGIS Enterprise /
// ArcGIS Online services. Everything else in the app reads from here.
//
// HOW TO CONNECT YOUR REAL DATA:
// 1. Publish your File Geodatabase layers (Farm_Boundary, Individual_Trees,
//    Tree_Areas) as an ArcGIS Feature Service, and your GeoTIFF as an Image
//    Service or Tile Layer, in ArcGIS Enterprise or ArcGIS Online.
// 2. Copy each layer's REST endpoint URL (it ends in a layer index, e.g.
//    ".../FeatureServer/0") into the matching constant below.
// 3. Set DATA_SOURCE_MODE to "arcgis". Every query in src/services/gisQueries.ts
//    will automatically switch from mock data to live FeatureLayer queries —
//    no component code needs to change.
// 4. If your services require a token (ArcGIS Online item-level security,
//    or an Enterprise portal that isn't public), set AUTH.mode to "token"
//    and provide a way to fetch/refresh it (see services/authService.ts).
// ---------------------------------------------------------------------------

import type { DataSourceMode } from "@/types";

/** Flip this once your real services are wired up. */
export const DATA_SOURCE_MODE: DataSourceMode = "geojson";

/**
 * Used when DATA_SOURCE_MODE === "geojson" — local GeoJSON files (e.g.
 * exported from ArcGIS Pro / a File Geodatabase) served as static files
 * from /public/data. No GIS server required. Replace with your own
 * converted files, or point straight at GIS_SERVICE_URLS and switch
 * DATA_SOURCE_MODE to "arcgis" once you publish real Feature Services.
 */
export const LOCAL_GEOJSON_PATHS = {
  FARM_BOUNDARIES: `${import.meta.env.BASE_URL}data/farms.geojson`,
  TREE_POINTS: `${import.meta.env.BASE_URL}data/tree_points.geojson`,
  TREE_POLYGONS: `${import.meta.env.BASE_URL}data/tree_polygons.geojson`,
  SOURCE_ROOT: `${import.meta.env.BASE_URL}data/census`,
};

/**
 * How the basemap imagery layer is sourced:
 *  - "none"        — no custom imagery, just the basemap.
 *  - "arcgis"       — a published ArcGIS Image Service (see IMAGERY_SERVICE below).
 *  - "local-tiles"  — a static XYZ tile pyramid generated locally from a GeoTIFF
 *                      (via gdal2tiles.py) and served from /public/tiles.
 *                      This is independent of DATA_SOURCE_MODE — you can use
 *                      local imagery tiles while farm/tree data is still mock.
 */
export const IMAGERY_MODE: "none" | "arcgis" | "local-tiles" = "local-tiles";

/**
 * URL template for the local tile pyramid, relative to the app root.
 * Matches the {z}/{x}/{y}.png folder structure gdal2tiles.py produces
 * with the --xyz flag. Copy your generated "tiles" folder into
 * public/tiles/agri-imagery so this path resolves.
 */
export const LOCAL_IMAGERY_TILE_URL = `${import.meta.env.BASE_URL}tiles/agri-imagery/{level}/{col}/{row}.png`;

/**
 * Geographic extent the local imagery tiles cover — used to zoom the map to
 * the imagery on load. Update to match your farm survey area (min/max lon/lat).
 * Get these from `gdalinfo yourfile.tif` (the "Corner Coordinates" section).
 */
export const LOCAL_IMAGERY_EXTENT = {
  xmin: 57.8765,
  ymin: 23.6312,
  xmax: 57.9031,
  ymax: 23.6492,
};


export const GIS_SERVICE_URLS = {
  /** Farm boundary polygons — Farm_ID, Governorate, Wilayat, Farm_Area, Geometry */
  FARM_BOUNDARY_SERVICE:
    "https://<your-org>.maps.arcgis.com/arcgis/rest/services/AgriCensus/FeatureServer/0",

  /** Individual tree points — Tree_ID, Farm_ID, Tree_Type, Longitude, Latitude */
  TREE_POINT_SERVICE:
    "https://<your-org>.maps.arcgis.com/arcgis/rest/services/AgriCensus/FeatureServer/1",

  /** Tree / crop polygon features — Area_ID, Farm_ID, Tree_Type, Tree_Count */
  TREE_POLYGON_SERVICE:
    "https://<your-org>.maps.arcgis.com/arcgis/rest/services/AgriCensus/FeatureServer/2",

  /** GeoTIFF imagery, published as an Image Service or hosted Tile Layer */
  IMAGERY_SERVICE:
    "https://<your-org>.maps.arcgis.com/arcgis/rest/services/AgriCensus/ImageServer",
} as const;

/** Field name mapping — edit if your GDB schema uses different field names. */
export const FIELD_NAMES = {
  farm: {
    farmId: "Farm_ID_",
    governorate: "Governorate",
    wilayat: "Wilayat",
    farmArea: "Shape_Area",
  },
  treePoint: {
    treeId: "Vegetation_ID",
    farmId: "Farm_ID_",
    treeType: "Vegetation_Type_EN",
    longitude: "Longitude",
    latitude: "Latitude",
    governorate: "Governorate",
    wilayat: "Wilayat",
  },
  treePolygon: {
    areaId: "Area_ID",
    farmId: "Farm_ID_",
    treeType: "Vegetation_Type_EN",
    treeCount: "Tree_Count",
    governorate: "Governorate",
    wilayat: "Wilayat",
  },
} as const;

/** Authentication — most government portals will use "portal" (signed-in user) mode. */
export const AUTH_CONFIG: {
  mode: "none" | "token" | "portal";
  portalUrl: string;
  appClientId: string;
} = {
  mode: "none",
  portalUrl: "https://www.arcgis.com",
  appClientId: "<your-oauth-app-client-id>",
};

/** Map defaults — centered on the Barka farm survey area, Al Batinah South. */
export const MAP_DEFAULTS = {
  center: [57.89, 23.638] as [number, number],
  zoom: 14,
  basemap: "topo-vector" as const,
  minZoom: 5,
  maxZoom: 21,
};

/** Performance thresholds referenced by the map + query layer. */
export const PERFORMANCE = {
  /** Beyond this many points, switch tree point layer rendering to clustering. */
  clusterThreshold: 2000,
  /** Max features pulled into browser state at once for the attribute table. */
  pageSize: 100,
};

/** Color palette used to symbolize tree types consistently across map + charts. */
export const TREE_TYPE_COLORS: Record<string, string> = {
  Palm: "#3D7E33",
  Coconut: "#7A5A36",
  Lemon: "#D3B92F",
  Orange: "#E28A2E",
  Banana: "#7CB518",
  Papaya: "#E49C3C",
  Mango: "#D9762B",
  Fig: "#73529B",
  Sidr: "#587548",
  Pomegranate: "#B83E46",
  "Prickly Pear": "#7FA05E",
  "Mixed Fruit": "#6E956A",
  "Palm & Mixed Fruit": "#6D8A52",
  "Lemon & Orange": "#D8A63C",
  Cassava: "#7E9A62",
  Grass: "#78A65D",
  Betham: "#81936F",
  Mesquite: "#34483A",
  "Zucchini Tree": "#76A05E",
  "Ornamental Tree": "#5E7D59",
  "Ornamental Palm": "#4A843D",
  "Indian Almond": "#6C7F4E",
  Unknown: "#4E6653",
  Other: "#8C9188",
};

export const DEFAULT_TREE_TYPE_COLOR = "#6B7A5E";

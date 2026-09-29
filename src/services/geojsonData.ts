import { LOCAL_GEOJSON_PATHS } from "@/config/gisConfig";
import type { FarmBoundary, TreePoint, TreePolygon } from "@/types";

// ---------------------------------------------------------------------------
// Reads the three converted GeoJSON files (see convert_geojson.py) as static
// assets from /public/data and maps them into the app's domain types. This
// is the "real data, no GIS server" path — swap DATA_SOURCE_MODE to "arcgis"
// later and these files become unnecessary.
// ---------------------------------------------------------------------------

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: string; coordinates: any };
    properties: Record<string, any>;
  }>;
}

type LocalCensusData = {
  farms: FarmBoundary[];
  treePoints: TreePoint[];
  treePolygons: TreePolygon[];
};

let cache: LocalCensusData | null = null;
let loadPromise: Promise<LocalCensusData> | null = null;

function centroidOfRings(rings: number[][][]): [number, number] {
  const outer = rings[0] ?? [];
  if (outer.length === 0) return [0, 0];
  let x = 0;
  let y = 0;
  for (const [lon, lat] of outer) {
    x += lon;
    y += lat;
  }
  return [x / outer.length, y / outer.length];
}

async function fetchGeoJson(url: string): Promise<GeoJsonFeatureCollection> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (${res.status}). Did you run convert_geojson.py and copy the output into public/data?`);
  }
  return res.json();
}

export async function loadLocalGeoJsonCensus(): Promise<LocalCensusData> {
  if (cache) return cache;
  // Important performance fix: several parts of the app request census data at
  // the same time on startup. Reuse one in-flight request instead of fetching
  // the same three GeoJSON files repeatedly.
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const [farmsFc, pointsFc, polygonsFc] = await Promise.all([
      fetchGeoJson(LOCAL_GEOJSON_PATHS.FARM_BOUNDARIES),
      fetchGeoJson(LOCAL_GEOJSON_PATHS.TREE_POINTS),
      fetchGeoJson(LOCAL_GEOJSON_PATHS.TREE_POLYGONS),
    ]);

    const farms: FarmBoundary[] = farmsFc.features.map((f) => {
      const rings = f.geometry.coordinates as number[][][];
      return {
        farmId: f.properties.Farm_ID,
        governorate: f.properties.Governorate,
        wilayat: f.properties.Wilayat,
        farmAreaHa: f.properties.Farm_Area ?? 0,
        rings,
        centroid: centroidOfRings(rings),
      };
    });

    const treePoints: TreePoint[] = pointsFc.features.map((f) => {
      const [longitude, latitude] = f.geometry.coordinates as [number, number];
      return {
        treeId: f.properties.Tree_ID,
        farmId: f.properties.Farm_ID ?? "",
        treeType: f.properties.Tree_Type ?? "Unknown",
        treeTypeAr: f.properties.Vegetation_Type_AR ?? undefined,
        vegetationHeight: f.properties.Vegetation_Height ?? null,
        vegetationHealth: f.properties.Vegetation_Health ?? null,
        canopyDiameter: f.properties.Canopy_Diameter ?? null,
        longitude,
        latitude,
        governorate: f.properties.Governorate ?? "",
        wilayat: f.properties.Wilayat ?? "",
      };
    });

    const treePolygons: TreePolygon[] = polygonsFc.features.map((f) => {
      const rings = f.geometry.coordinates as number[][][];
      return {
        areaId: f.properties.Area_ID,
        farmId: f.properties.Farm_ID ?? "",
        treeType: f.properties.Tree_Type,
        treeCount: f.properties.Tree_Count ?? 0,
        grassPointCount: f.properties.Grass_Point_Count ?? undefined,
        areaHa: f.properties.Area_Ha ?? 0,
        governorate: f.properties.Governorate,
        wilayat: f.properties.Wilayat,
        rings,
        centroid: centroidOfRings(rings),
      };
    });

    cache = { farms, treePoints, treePolygons };
    return cache;
  })();

  try {
    return await loadPromise;
  } catch (error) {
    // Allow a clean retry if a network/file request fails once.
    loadPromise = null;
    throw error;
  }
}

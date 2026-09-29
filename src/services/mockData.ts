import type { FarmBoundary, TreePoint, TreePolygon } from "@/types";

// ---------------------------------------------------------------------------
// Deterministic mock data generator.
// Mirrors Oman's administrative structure so filters/labels look realistic.
// Replace by real ArcGIS queries once GIS_SERVICE_URLS are set — see
// src/services/gisQueries.ts.
// ---------------------------------------------------------------------------

const ADMIN: Record<string, string[]> = {
  Dhofar: ["Salalah", "Taqah", "Mirbat", "Rakhyut"],
  "Al Batinah North": ["Sohar", "Shinas", "Liwa"],
  "Al Batinah South": ["Rustaq", "Al Musannah", "Barka"],
  "Ad Dakhiliyah": ["Nizwa", "Bahla", "Manah"],
  "Al Sharqiyah South": ["Sur", "Al Kamil Wal Wafi"],
};

const TREE_TYPES = ["Palm", "Banana", "Papaya", "Mango", "Lime", "Pomegranate"];

// Simple seeded PRNG so the mock dataset is stable across reloads.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function makeSquareRing(cx: number, cy: number, halfSizeDeg: number): number[][][] {
  return [
    [
      [cx - halfSizeDeg, cy - halfSizeDeg],
      [cx + halfSizeDeg, cy - halfSizeDeg],
      [cx + halfSizeDeg, cy + halfSizeDeg],
      [cx - halfSizeDeg, cy + halfSizeDeg],
      [cx - halfSizeDeg, cy - halfSizeDeg],
    ],
  ];
}

const OMAN_BOUNDS = { lonMin: 54.0, lonMax: 59.5, latMin: 16.6, latMax: 24.6 };

interface GeneratedCensus {
  farms: FarmBoundary[];
  treePoints: TreePoint[];
  treePolygons: TreePolygon[];
}

let cache: GeneratedCensus | null = null;

export function generateMockCensus(farmCount = 120): GeneratedCensus {
  if (cache) return cache;

  const farms: FarmBoundary[] = [];
  const treePoints: TreePoint[] = [];
  const treePolygons: TreePolygon[] = [];

  const governorates = Object.keys(ADMIN);

  for (let i = 0; i < farmCount; i++) {
    const governorate = pick(governorates);
    const wilayat = pick(ADMIN[governorate]);
    const farmId = `F-${String(i + 1).padStart(4, "0")}`;

    const lon =
      OMAN_BOUNDS.lonMin + rand() * (OMAN_BOUNDS.lonMax - OMAN_BOUNDS.lonMin);
    const lat =
      OMAN_BOUNDS.latMin + rand() * (OMAN_BOUNDS.latMax - OMAN_BOUNDS.latMin);

    const farmAreaHa = Math.round((2 + rand() * 30) * 10) / 10;
    const halfSize = 0.01 + rand() * 0.02;
    const rings = makeSquareRing(lon, lat, halfSize);

    farms.push({
      farmId,
      governorate,
      wilayat,
      farmAreaHa,
      rings,
      centroid: [lon, lat],
    });

    // Individual tree points scattered within the farm boundary.
    const pointTreeCount = Math.floor(rand() * 25); // some farms are point-heavy
    for (let p = 0; p < pointTreeCount; p++) {
      const tLon = lon + (rand() - 0.5) * halfSize * 1.6;
      const tLat = lat + (rand() - 0.5) * halfSize * 1.6;
      treePoints.push({
        treeId: `${farmId}-T${p + 1}`,
        farmId,
        treeType: pick(TREE_TYPES),
        longitude: Math.round(tLon * 1e6) / 1e6,
        latitude: Math.round(tLat * 1e6) / 1e6,
        governorate,
        wilayat,
      });
    }

    // Tree/crop polygon patches (denser plantations), Tree_Count carries volume.
    const polygonCount = 1 + Math.floor(rand() * 3);
    for (let g = 0; g < polygonCount; g++) {
      const pLon = lon + (rand() - 0.5) * halfSize;
      const pLat = lat + (rand() - 0.5) * halfSize;
      const pHalf = halfSize * (0.2 + rand() * 0.3);
      treePolygons.push({
        areaId: `${farmId}-A${g + 1}`,
        farmId,
        treeType: pick(TREE_TYPES),
        treeCount: 50 + Math.floor(rand() * 950),
        areaHa: Math.round(pHalf * pHalf * 4 * 12100 * 10) / 10,
        governorate,
        wilayat,
        rings: makeSquareRing(pLon, pLat, pHalf),
        centroid: [pLon, pLat],
      });
    }
  }

  cache = { farms, treePoints, treePolygons };
  return cache;
}

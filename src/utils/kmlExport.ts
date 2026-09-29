import type { FarmBoundary, TreePoint, TreePolygon } from "@/types";
import { OPERATIONAL_LAYER_DEFINITIONS } from "@/config/operationalLayers";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ringToCoordinates(ring: number[][]) {
  return ring.map(([x, y]) => `${x},${y},0`).join(" ");
}

function polygonPlacemark(name: string, description: string, rings: number[][][]) {
  if (!rings?.length) return "";
  const outer = rings[0];
  const inners = rings.slice(1);
  return `
  <Placemark>
    <name>${esc(name)}</name>
    <description><![CDATA[${description}]]></description>
    <Polygon>
      <outerBoundaryIs><LinearRing><coordinates>${ringToCoordinates(outer)}</coordinates></LinearRing></outerBoundaryIs>
      ${inners.map((ring) => `<innerBoundaryIs><LinearRing><coordinates>${ringToCoordinates(ring)}</coordinates></LinearRing></innerBoundaryIs>`).join("")}
    </Polygon>
  </Placemark>`;
}

function propsDescription(props: Record<string, unknown>) {
  return Object.entries(props)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 14)
    .map(([key, value]) => `${esc(key)}: ${esc(value)}`)
    .join("<br/>");
}

function featureName(props: Record<string, unknown>, fallback: string) {
  const idKey = Object.keys(props).find((key) => /(_ID_?$|^ID$)/i.test(key));
  return idKey && props[idKey] ? String(props[idKey]) : fallback;
}

function geoJsonFeatureToKml(feature: any, index: number) {
  const geometry = feature?.geometry;
  if (!geometry) return "";
  const props = feature.properties ?? {};
  const name = featureName(props, `Feature ${index + 1}`);
  const description = propsDescription(props);
  if (geometry.type === "Point") {
    const [x, y] = geometry.coordinates;
    return `<Placemark><name>${esc(name)}</name><description><![CDATA[${description}]]></description><Point><coordinates>${x},${y},0</coordinates></Point></Placemark>`;
  }
  if (geometry.type === "LineString") {
    return `<Placemark><name>${esc(name)}</name><description><![CDATA[${description}]]></description><LineString><coordinates>${ringToCoordinates(geometry.coordinates)}</coordinates></LineString></Placemark>`;
  }
  if (geometry.type === "Polygon") return polygonPlacemark(name, description, geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((rings: number[][][], i: number) => polygonPlacemark(`${name} ${i + 1}`, description, rings)).join("");
  if (geometry.type === "MultiLineString") return geometry.coordinates.map((line: number[][], i: number) => `<Placemark><name>${esc(`${name} ${i + 1}`)}</name><description><![CDATA[${description}]]></description><LineString><coordinates>${ringToCoordinates(line)}</coordinates></LineString></Placemark>`).join("");
  return "";
}

export async function exportCensusToKml(farms: FarmBoundary[], treePoints: TreePoint[], treePolygons: TreePolygon[]) {
  const farmKml = farms.map((f) => polygonPlacemark(
    `Farm ${f.farmId}`,
    `Governorate: ${esc(f.governorate)}<br/>Wilayat: ${esc(f.wilayat)}<br/>Area: ${esc((f.farmAreaHa * 10000).toFixed(0))} m²`,
    f.rings
  )).join("");

  const pointKml = treePoints.map((t) => `
  <Placemark>
    <name>${esc(t.treeId)}</name>
    <description><![CDATA[Vegetation Type: ${esc(t.treeType)}<br/>Farm ID: ${esc(t.farmId)}<br/>Governorate: ${esc(t.governorate)}<br/>Wilayat: ${esc(t.wilayat)}]]></description>
    <Point><coordinates>${t.longitude},${t.latitude},0</coordinates></Point>
  </Placemark>`).join("");

  const areaKml = treePolygons.map((a) => polygonPlacemark(
    `${a.treeType} Area ${a.areaId}`,
    `Vegetation Type: ${esc(a.treeType)}<br/>Count: ${esc(a.treeCount)}<br/>Farm ID: ${esc(a.farmId)}<br/>Governorate: ${esc(a.governorate)}<br/>Wilayat: ${esc(a.wilayat)}<br/>Area: ${esc((a.areaHa * 10000).toFixed(0))} m²`,
    a.rings
  )).join("");

  const additionalFolders: string[] = [];
  for (const layer of OPERATIONAL_LAYER_DEFINITIONS) {
    if (!layer.url || layer.empty || ["farms", "points", "imagery"].includes(layer.key)) continue;
    try {
      const response = await fetch(layer.url);
      if (!response.ok) continue;
      const fc = await response.json();
      const features = (fc.features ?? []).map((f: any, i: number) => geoJsonFeatureToKml(f, i)).join("");
      if (features) additionalFolders.push(`<Folder><name>${esc(layer.label)}</name>${features}</Folder>`);
    } catch {
      // Keep the export usable even if one optional layer cannot be loaded.
    }
  }

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>Smart Agriculture GIS Platform Export</name>
  <Folder><name>Farm Areas</name>${farmKml}</Folder>
  <Folder><name>Vegetation</name>${pointKml}</Folder>
  ${areaKml ? `<Folder><name>Vegetation Areas</name>${areaKml}</Folder>` : ""}
  ${additionalFolders.join("\n")}
</Document>
</kml>`;

  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agricultural_census_${new Date().toISOString().slice(0, 10)}.kml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

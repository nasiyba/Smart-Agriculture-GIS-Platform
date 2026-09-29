export type OperationalLayerKey =
  | "farms"
  | "points"
  | "agriculturalFields"
  | "animalPens"
  | "buildings"
  | "desalination"
  | "landCover"
  | "greenhouses"
  | "shadeHouses"
  | "solarPanels"
  | "streets"
  | "wells"
  | "imagery";

export interface OperationalLayerDefinition {
  key: OperationalLayerKey;
  label: string;
  url?: string;
  geometry: "polygon" | "line" | "point" | "special";
  color: string;
  visibleByDefault: boolean;
  empty?: boolean;
  titleField?: string;
}

export const OPERATIONAL_LAYER_DEFINITIONS: OperationalLayerDefinition[] = [
  { key: "farms", label: "Farm Areas", geometry: "special", color: "#2F5233", visibleByDefault: true },
  { key: "points", label: "Vegetation", geometry: "special", color: "#5A8F43", visibleByDefault: true },
  { key: "agriculturalFields", label: "Agricultural Fields", url: `${import.meta.env.BASE_URL}data/census/Agricultural_Field.geojson`, geometry: "polygon", color: "#82A64F", visibleByDefault: false },
  { key: "animalPens", label: "Animal Pens", url: `${import.meta.env.BASE_URL}data/census/Animal_Pens.geojson`, geometry: "polygon", color: "#9A6B45", visibleByDefault: false },
  { key: "buildings", label: "Buildings & Facilities", url: `${import.meta.env.BASE_URL}data/census/Buildings_and_Facilities.geojson`, geometry: "polygon", color: "#6F7880", visibleByDefault: false },
  { key: "desalination", label: "Desalination Plants", url: `${import.meta.env.BASE_URL}data/census/Desalination_Plants.geojson`, geometry: "point", color: "#3A8DB8", visibleByDefault: false, empty: true },
  { key: "landCover", label: "Farm Land Cover", url: `${import.meta.env.BASE_URL}data/census/Farm_Land_Cover.geojson`, geometry: "polygon", color: "#759A64", visibleByDefault: false },
  { key: "greenhouses", label: "Greenhouses", url: `${import.meta.env.BASE_URL}data/census/Greenhouses.geojson`, geometry: "polygon", color: "#2F9E7B", visibleByDefault: false },
  { key: "shadeHouses", label: "Shade Houses", url: `${import.meta.env.BASE_URL}data/census/Shade_Houses.geojson`, geometry: "polygon", color: "#7C63A8", visibleByDefault: false },
  { key: "solarPanels", label: "Solar Panels", url: `${import.meta.env.BASE_URL}data/census/Solar_Panels.geojson`, geometry: "polygon", color: "#D6A72A", visibleByDefault: false },
  { key: "streets", label: "Streets", url: `${import.meta.env.BASE_URL}data/census/Streets.geojson`, geometry: "line", color: "#B36A42", visibleByDefault: false },
  { key: "wells", label: "Wells", url: `${import.meta.env.BASE_URL}data/census/Wells.geojson`, geometry: "point", color: "#2878A6", visibleByDefault: false, empty: true },
  { key: "imagery", label: "Imagery", geometry: "special", color: "#596654", visibleByDefault: true },
];

export type LayerVisibility = Record<OperationalLayerKey, boolean>;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = Object.fromEntries(
  OPERATIONAL_LAYER_DEFINITIONS.map((layer) => [layer.key, layer.visibleByDefault])
) as LayerVisibility;

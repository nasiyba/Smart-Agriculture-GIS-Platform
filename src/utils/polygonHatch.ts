import { TREE_TYPE_COLORS, DEFAULT_TREE_TYPE_COLOR } from "@/config/gisConfig";

const HATCH_STYLES = [
  "backward-diagonal",
  "forward-diagonal",
  "horizontal",
  "vertical",
  "cross",
  "diagonal-cross",
] as const;

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = ((h << 5) - h + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getPolygonHatch(treeType: string) {
  const color = TREE_TYPE_COLORS[treeType] ?? DEFAULT_TREE_TYPE_COLOR;
  const arcgisStyle = HATCH_STYLES[hash(treeType) % HATCH_STYLES.length];

  let backgroundImage: string;
  switch (arcgisStyle) {
    case "forward-diagonal":
      backgroundImage = `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 7px)`;
      break;
    case "backward-diagonal":
      backgroundImage = `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 7px)`;
      break;
    case "horizontal":
      backgroundImage = `repeating-linear-gradient(0deg, ${color} 0 2px, transparent 2px 7px)`;
      break;
    case "vertical":
      backgroundImage = `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 7px)`;
      break;
    case "cross":
      backgroundImage = `repeating-linear-gradient(0deg, ${color} 0 1.5px, transparent 1.5px 7px), repeating-linear-gradient(90deg, ${color} 0 1.5px, transparent 1.5px 7px)`;
      break;
    default:
      backgroundImage = `repeating-linear-gradient(45deg, ${color} 0 1.5px, transparent 1.5px 7px), repeating-linear-gradient(135deg, ${color} 0 1.5px, transparent 1.5px 7px)`;
  }

  return { color, arcgisStyle, backgroundImage };
}

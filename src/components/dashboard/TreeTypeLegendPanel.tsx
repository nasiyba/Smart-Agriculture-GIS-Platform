import { TreeTypeIcon } from "@/components/common/TreeTypeIcon";
import { getPolygonHatch } from "@/utils/polygonHatch";
import { OPERATIONAL_LAYER_DEFINITIONS } from "@/config/operationalLayers";

export interface LegendTypeCount {
  treeType: string;
  count: number;
}

interface TreeTypeLegendPanelProps {
  pointTypes: LegendTypeCount[];
  polygonTypes: LegendTypeCount[];
  title?: string;
  subtitle?: string;
}

function LegendSection({ title, items, geometry }: { title: string; items: LegendTypeCount[]; geometry: "point" | "polygon" }) {
  if (!items.length) return null;
  return (
    <div className="tree-legend-section">
      <div className="tree-legend-section-title">
        <span className={`legend-geometry-swatch legend-geometry-swatch--${geometry}`} />
        {title}
      </div>
      <div className="tree-legend-grid">
        {items.map((item) => {
          const hatch = getPolygonHatch(item.treeType);
          return (
            <div className="tree-legend-card" key={`${geometry}-${item.treeType}`}>
              {geometry === "point" ? (
                <TreeTypeIcon treeType={item.treeType} size={30} />
              ) : (
                <span className="tree-area-legend-symbol" style={{ borderColor: hatch.color, backgroundImage: hatch.backgroundImage }} />
              )}
              <div className="tree-legend-card-text">
                <span>{item.treeType}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function OperationalLegendSection() {
  const items = OPERATIONAL_LAYER_DEFINITIONS.filter((item) =>
    !item.empty && ["agriculturalFields", "landCover", "animalPens", "buildings", "greenhouses", "shadeHouses", "solarPanels", "streets"].includes(item.key)
  );
  return (
    <div className="tree-legend-section operational-legend-section">
      <div className="tree-legend-section-title">
        <span className="legend-geometry-swatch legend-geometry-swatch--map" />
        Map Features
      </div>
      <div className="operational-legend-grid">
        {items.map((item) => (
          <div className="operational-legend-item" key={item.key}>
            <span
              className={`operational-legend-symbol operational-legend-symbol--${item.geometry}`}
              style={{ "--legend-color": item.color } as any}
            />
            <span>{item.key === "agriculturalFields" ? "Agricultural Fields · crop classes" : item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TreeTypeLegendPanel({ pointTypes, polygonTypes, title = "Legend", subtitle }: TreeTypeLegendPanelProps) {
  return (
    <div className="panel tree-legend-panel panel-with-scroll-controls">
      <div className="panel-title tree-legend-panel-title">
        <span>{title}</span>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <div className="panel-scroll-body">
        <LegendSection title="Vegetation" items={pointTypes} geometry="point" />
        <LegendSection title="Vegetation Areas" items={polygonTypes} geometry="polygon" />
        <OperationalLegendSection />
        {!pointTypes.length && !polygonTypes.length && <div className="empty-state">No vegetation types in this area.</div>}
      </div>
    </div>
  );
}

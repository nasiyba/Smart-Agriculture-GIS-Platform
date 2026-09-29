import { Layers3 } from "lucide-react";
import { TreeTypeIcon } from "@/components/common/TreeTypeIcon";
import type { SelectedMapFeature } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";
import { classifyVegetationHealth, healthClassName } from "@/utils/healthClassification";

interface TreeInfoPanelProps {
  feature: SelectedMapFeature | null;
  onClose: () => void;
}

export function TreeInfoPanel({ feature, onClose }: TreeInfoPanelProps) {
  if (!feature) return null;

  if (feature.kind === "operational") {
    if (feature.layerLabel === "Farm Land Cover") {
      const a = feature.attributes ?? {};
      const area = typeof a.Shape_Area === "number"
        ? `${Number(a.Shape_Area).toLocaleString(undefined, { maximumFractionDigits: 0 })} m²`
        : "—";
      return (
        <div className="panel tree-info-panel operational-info-panel farm-land-cover-info-panel">
          <div className="farm-panel-header">
            <span className="farm-panel-id">Farm Land Cover</span>
            <button className="farm-panel-close" onClick={onClose}>Clear</button>
          </div>
          <div className="operational-feature-identity">
            <strong>{String(a.Farm_ID ?? feature.id ?? "Land Cover")}</strong>
            <span>Farm Land Cover</span>
          </div>
          <div className="farm-panel-metrics operational-feature-metrics">
            <div><div className="farm-panel-metric-label">Governorate</div><div className="farm-panel-metric-value">{String(a.Governorat ?? a.Governorate ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Wilayat</div><div className="farm-panel-metric-value">{String(a.Wilayat ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Land Cover</div><div className="farm-panel-metric-value">{String(a.Land_Cover ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Latitude</div><div className="farm-panel-metric-value">{a.Latitude != null ? String(a.Latitude) : "—"}</div></div>
            <div><div className="farm-panel-metric-label">Longitude</div><div className="farm-panel-metric-value">{a.Longitude != null ? String(a.Longitude) : "—"}</div></div>
            <div><div className="farm-panel-metric-label">Farm ID</div><div className="farm-panel-metric-value">{String(a.Farm_ID ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Land Cover ID</div><div className="farm-panel-metric-value">{String(a.Land_Cov_1 ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Shape Length</div><div className="farm-panel-metric-value">{a.Shape_Leng != null ? String(a.Shape_Leng) : "—"}</div></div>
            <div><div className="farm-panel-metric-label">Shape Area</div><div className="farm-panel-metric-value">{area}</div></div>
          </div>
        </div>
      );
    }

    if (feature.layerLabel === "Agricultural Fields") {
      const a = feature.attributes ?? {};
      const rawSurveyDate = a.Survey_Dat ?? a.Survey_Date;
      const surveyDate = typeof rawSurveyDate === "number" && Number.isFinite(rawSurveyDate)
        ? new Date(rawSurveyDate).toLocaleDateString()
        : (rawSurveyDate ? String(rawSurveyDate) : "—");
      const plantType = String(a.Plant_Type ?? a.Plant_Type_EN ?? "—");
      const plantTypeAr = String(a.Plant_Ty_1 ?? a.Plant_Ty_AR ?? "—");
      const area = a.Shape_Area != null && Number.isFinite(Number(a.Shape_Area))
        ? `${Number(a.Shape_Area).toLocaleString(undefined, { maximumFractionDigits: 0 })} m²`
        : "—";
      const shapeLength = a.Shape_Leng != null && Number.isFinite(Number(a.Shape_Leng))
        ? `${Number(a.Shape_Leng).toLocaleString(undefined, { maximumFractionDigits: 2 })} m`
        : "—";
      const latitude = a.Latitude != null && Number.isFinite(Number(a.Latitude))
        ? Number(a.Latitude).toFixed(6)
        : "—";
      const longitude = a.Longitude != null && Number.isFinite(Number(a.Longitude))
        ? Number(a.Longitude).toFixed(6)
        : "—";
      return (
        <div className="panel tree-info-panel operational-info-panel agricultural-field-info-panel">
          <div className="farm-panel-header">
            <span className="farm-panel-id">Agricultural Field</span>
            <button className="farm-panel-close" onClick={onClose}>Clear</button>
          </div>
          <div className="tree-info-identity agricultural-field-identity">
            <span className="tree-info-icon"><Layers3 size={22} /></span>
            <div><strong>{String(a.Field_ID ?? feature.id ?? "Field")}</strong><span>{plantType}</span></div>
          </div>
          <div className="farm-panel-metrics">
            <div><div className="farm-panel-metric-label">Plant Type</div><div className="farm-panel-metric-value">{plantType}</div></div>
            <div><div className="farm-panel-metric-label">Plant Type (AR)</div><div className="farm-panel-metric-value">{plantTypeAr}</div></div>
            <div><div className="farm-panel-metric-label">Tree Count</div><div className="farm-panel-metric-value">{a.Tree_Count != null ? Number(a.Tree_Count).toLocaleString() : "—"}</div></div>
            <div><div className="farm-panel-metric-label">Area</div><div className="farm-panel-metric-value">{area}</div></div>
            <div><div className="farm-panel-metric-label">Governorate</div><div className="farm-panel-metric-value">{String(a.Governorat ?? a.Governorate ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Wilayat</div><div className="farm-panel-metric-value">{String(a.Wilayat ?? "—")}</div></div>
            <div><div className="farm-panel-metric-label">Survey Date</div><div className="farm-panel-metric-value">{surveyDate}</div></div>
            <div><div className="farm-panel-metric-label">Latitude</div><div className="farm-panel-metric-value">{latitude}</div></div>
            <div><div className="farm-panel-metric-label">Longitude</div><div className="farm-panel-metric-value">{longitude}</div></div>
            <div><div className="farm-panel-metric-label">Shape Length</div><div className="farm-panel-metric-value">{shapeLength}</div></div>
          </div>
        </div>
      );
    }

    const entries = Object.entries(feature.attributes ?? {})
      .filter(([key, value]) => value !== null && value !== undefined && value !== "" && !key.toLowerCase().includes("objectid"))
      .slice(0, 10);
    const humanize = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <div className="panel tree-info-panel operational-info-panel">
        <div className="farm-panel-header">
          <span className="farm-panel-id">{feature.layerLabel ?? "Feature Information"}</span>
          <button className="farm-panel-close" onClick={onClose}>Clear</button>
        </div>
        <div className="operational-feature-identity">
          <strong>{feature.id}</strong>
          <span>{feature.layerLabel}</span>
        </div>
        <div className="farm-panel-metrics operational-feature-metrics">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="farm-panel-metric-label">{humanize(key)}</div>
              <div className="farm-panel-metric-value">{String(value)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel tree-info-panel">
      <div className="farm-panel-header">
        <span className="farm-panel-id">{feature.kind === "point" ? "Vegetation Information" : "Vegetation Area"}</span>
        <button className="farm-panel-close" onClick={onClose}>Clear</button>
      </div>

      <div className="tree-info-identity">
        <span className="tree-info-icon">{feature.kind === "point" ? <TreeTypeIcon treeType={feature.treeType} size={44} /> : <Layers3 size={16} />}</span>
        <div><strong>{feature.id}</strong><span>{feature.treeType}</span></div>
      </div>

      {feature.kind === "point" ? (
        <div className="farm-panel-metrics">
          <div><div className="farm-panel-metric-label">Farm ID</div><div className="farm-panel-metric-value">{feature.farmId || "—"}</div></div>
          <div><div className="farm-panel-metric-label">Vegetation Type</div><div className="farm-panel-metric-value farm-panel-metric-value--with-icon"><TreeTypeIcon treeType={feature.treeType} size={26} /><span>{feature.treeType || "—"}</span></div></div>
          <div><div className="farm-panel-metric-label">Vegetation Type (AR)</div><div className="farm-panel-metric-value">{feature.treeTypeAr || "—"}</div></div>
          <div><div className="farm-panel-metric-label">Height</div><div className="farm-panel-metric-value">{feature.vegetationHeight != null ? `${feature.vegetationHeight} m` : "—"}</div></div>
          <div><div className="farm-panel-metric-label">Canopy Diameter</div><div className="farm-panel-metric-value">{feature.canopyDiameter != null ? `${feature.canopyDiameter} m` : "—"}</div></div>
          <div><div className="farm-panel-metric-label">Health</div><div className="farm-panel-metric-value"><span className={healthClassName(feature.vegetationHealth)}>{classifyVegetationHealth(feature.vegetationHealth)}</span></div></div>
          <div><div className="farm-panel-metric-label">Governorate</div><div className="farm-panel-metric-value">{feature.governorate || "—"}</div></div>
          <div><div className="farm-panel-metric-label">Wilayat</div><div className="farm-panel-metric-value">{feature.wilayat || "—"}</div></div>
          <div><div className="farm-panel-metric-label">Latitude</div><div className="farm-panel-metric-value">{feature.latitude != null ? feature.latitude.toFixed(6) : "—"}</div></div>
          <div><div className="farm-panel-metric-label">Longitude</div><div className="farm-panel-metric-value">{feature.longitude != null ? feature.longitude.toFixed(6) : "—"}</div></div>
        </div>
      ) : (
        <div className="farm-panel-metrics">
          <div><div className="farm-panel-metric-label">Farm ID</div><div className="farm-panel-metric-value">{feature.farmId || "—"}</div></div>
          <div><div className="farm-panel-metric-label">Vegetation Type</div><div className="farm-panel-metric-value farm-panel-metric-value--with-icon"><TreeTypeIcon treeType={feature.treeType} size={26} /><span>{feature.treeType || "—"}</span></div></div>
          {feature.treeType === "Grass" && feature.grassPointCount != null ? (
            <div><div className="farm-panel-metric-label">Grass Points</div><div className="farm-panel-metric-value">{feature.grassPointCount.toLocaleString()}</div></div>
          ) : feature.count != null ? (
            <div><div className="farm-panel-metric-label">Tree Count</div><div className="farm-panel-metric-value">{feature.count.toLocaleString()}</div></div>
          ) : null}
          {feature.areaHa != null && <div><div className="farm-panel-metric-label">Area</div><div className="farm-panel-metric-value">{formatSquareMeters(feature.areaHa)}</div></div>}
          <div><div className="farm-panel-metric-label">Governorate</div><div className="farm-panel-metric-value">{feature.governorate || "—"}</div></div>
          <div><div className="farm-panel-metric-label">Wilayat</div><div className="farm-panel-metric-value">{feature.wilayat || "—"}</div></div>
        </div>
      )}


    </div>
  );
}

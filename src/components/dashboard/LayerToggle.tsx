import { OPERATIONAL_LAYER_DEFINITIONS, type LayerVisibility, type OperationalLayerKey } from "@/config/operationalLayers";

interface LayerToggleProps {
  visibility: LayerVisibility;
  onChange: (visibility: LayerVisibility) => void;
  onExportKml?: () => void;
}

export function LayerToggle({ visibility, onChange, onExportKml }: LayerToggleProps) {
  return (
    <div className="panel">
      <div className="panel-title">Layers</div>
      <div className="layer-toggle-list layer-toggle-list--scrollable">
        {OPERATIONAL_LAYER_DEFINITIONS.map((layer) => (
          <div className={`layer-toggle-row${layer.empty ? " is-disabled" : ""}`} key={layer.key}>
            <span>{layer.label}</span>
            <button
              className={`toggle-switch${visibility[layer.key] ? " on" : ""}`}
              onClick={() => !layer.empty && onChange({ ...visibility, [layer.key]: !visibility[layer.key] })}
              aria-label={`Toggle ${layer.label}`}
              disabled={layer.empty}
              title={layer.empty ? "No features in the supplied dataset" : undefined}
            >
              <span className="toggle-switch-knob" />
            </button>
          </div>
        ))}
      </div>
      {onExportKml && (
        <button className="layer-export-kml" onClick={onExportKml}>
          Export data as KML
        </button>
      )}
    </div>
  );
}

export type { LayerVisibility, OperationalLayerKey };

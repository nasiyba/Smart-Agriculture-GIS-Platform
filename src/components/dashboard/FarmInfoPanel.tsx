import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { TREE_TYPE_COLORS, DEFAULT_TREE_TYPE_COLOR } from "@/config/gisConfig";
import type { FarmSummary } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";

interface FarmInfoPanelProps {
  farm: FarmSummary | null;
  onClose: () => void;
}

export function FarmInfoPanel({ farm, onClose }: FarmInfoPanelProps) {
  if (!farm) {
    return (
      <div className="panel info-unified-panel panel-with-scroll-controls">
        <div className="panel-title">Farm / Area Information</div>
        <div className="panel-scroll-body"><p className="empty-state">Click a farm boundary or draw an area on the map to see its details here.</p></div>
        </div>
    );
  }

  const metrics: [string, string][] = [
    ["Total Vegetation", farm.totalTrees.toLocaleString()],
    ["Vegetation Types", farm.treeTypeCount.toString()],
    ["Farm Area", formatSquareMeters(farm.farmAreaHa)],
    ["Dominant Vegetation", farm.dominantTreeType],
    ["Governorate", farm.governorate],
    ["Wilayat", farm.wilayat],
  ];

  return (
    <div className="panel info-unified-panel panel-with-scroll-controls">
      <div className="farm-panel-header">
        <span className="farm-panel-id">Farm / Area Information</span>
        <button className="farm-panel-close" onClick={onClose}>
          Clear
        </button>
      </div>

      <div className="panel-scroll-body">
        <div className="info-section-kicker">Selected Farm</div>
        <div className="info-section-title">Farm {farm.farmId}</div>
        <div className="farm-panel-metrics">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <div className="farm-panel-metric-label">{label}</div>
              <div className="farm-panel-metric-value">{value}</div>
            </div>
          ))}
        </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={farm.treeTypeBreakdown}>
          <XAxis dataKey="treeType" hide />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {farm.treeTypeBreakdown.map((entry) => (
              <Cell key={entry.treeType} fill={TREE_TYPE_COLORS[entry.treeType] ?? DEFAULT_TREE_TYPE_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="farm-type-breakdown-list">
        {farm.treeTypeBreakdown.map((entry) => (
          <div className="farm-type-breakdown-item" key={entry.treeType}>
            <span className="farm-type-breakdown-swatch" style={{ background: TREE_TYPE_COLORS[entry.treeType] ?? DEFAULT_TREE_TYPE_COLOR }} />
            <span className="farm-type-breakdown-name">{entry.treeType || "Unknown"}</span>
            <strong>{entry.count.toLocaleString()}</strong>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Search, Trees, MousePointer2 } from "lucide-react";
import { TreeTypeIcon } from "@/components/common/TreeTypeIcon";
import type { CensusFilters, CensusStatistics, FarmBoundary, TreePoint } from "@/types";

interface CensusToolsPanelProps {
  filters: CensusFilters;
  stats: CensusStatistics;
  totalStats: CensusStatistics;
  farms: FarmBoundary[];
  treePoints: TreePoint[];
  geometryMode: "all" | "points" | "polygons";
  onGeometryModeChange: (mode: "all" | "points" | "polygons") => void;
  onTreeSearch: (treeId: string) => void;
}

export function CensusToolsPanel({
  filters,
  stats,
  totalStats,
  farms,
  treePoints,
  geometryMode,
  onGeometryModeChange,
  onTreeSearch,
}: CensusToolsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [treeId, setTreeId] = useState("");

  const activeFarm = useMemo(
    () => (filters.farmId ? farms.find((f) => f.farmId === filters.farmId) ?? null : null),
    [filters.farmId, farms]
  );

  const locationLabel = activeFarm
    ? `Farm ${activeFarm.farmId}`
    : filters.wilayat ?? filters.governorate ?? "All census areas";

  function submitSearch() {
    const value = treeId.trim();
    if (!value) return;
    onTreeSearch(value);
  }

  return (
    <aside className={`census-tools${collapsed ? " census-tools--collapsed" : ""}`}>
      <button
        className="census-tools-collapse"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Open census tools" : "Collapse census tools"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {!collapsed && (
        <>
          <div className="census-tools-section census-location-block">
            <div className="census-tools-heading"><MapPin size={14} /> Location</div>
            <strong>{locationLabel}</strong>
            <span>Governorate: {filters.governorate ?? activeFarm?.governorate ?? "All"}</span>
            <span>Wilayat: {filters.wilayat ?? activeFarm?.wilayat ?? "All"}</span>
          </div>

          <Link to="/statistics" className="census-statistics-link">
            <span>View Full Statistics</span>
            <span>↗</span>
          </Link>

          <div className="census-count-grid">
            <div><strong>{stats.totalTrees.toLocaleString()}</strong><span>Showing</span></div>
            <div><strong>{totalStats.totalTrees.toLocaleString()}</strong><span>Total</span></div>
          </div>

          <div className="census-tools-section">
            <div className="census-tools-heading"><Search size={14} /> Find a tree</div>
            <div className="tree-id-search">
              <input
                value={treeId}
                onChange={(e) => setTreeId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Search Tree ID…"
                list="tree-id-options"
              />
              <button onClick={submitSearch} aria-label="Search tree ID"><Search size={14} /></button>
            </div>
            <datalist id="tree-id-options">
              {treePoints.slice(0, 250).map((t) => <option key={t.treeId} value={t.treeId} />)}
            </datalist>
          </div>

          <div className="census-tools-section">
            <div className="census-tools-heading"><MousePointer2 size={14} /> Geometry</div>
            <div className="geometry-chip-row">
              {([
                ["all", "All"],
                ["points", "Individual"],
                ["polygons", "Tree Areas"],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  className={geometryMode === mode ? "active" : ""}
                  onClick={() => onGeometryModeChange(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="census-tools-section species-in-view">
            <div className="census-tools-heading"><Trees size={14} /> Species in View</div>
            <div className="species-mini-list">
              {stats.treesByType.slice(0, 5).map((t) => (
                <div key={t.treeType}>
                  <span className="species-mini-item-label"><TreeTypeIcon treeType={t.treeType} size={22} /><span>{t.treeType}</span></span>
                  <strong>{t.count.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Trees, Sparkles } from "lucide-react";
import { TreeTypeIcon } from "@/components/common/TreeTypeIcon";
import { TREE_TYPE_COLORS, DEFAULT_TREE_TYPE_COLOR } from "@/config/gisConfig";
import type { CensusStatistics } from "@/types";

const AXIS_STYLE = { fontSize: 11, fill: "#A9B39A" };

export function TreesByTypeChart({ stats }: { stats: CensusStatistics }) {
  return (
    <div className="panel tree-type-panel">
      <div className="panel-title panel-title--with-icon">
        <div className="panel-title-group">
          <span className="panel-3d-icon panel-3d-icon--trees">
            <span className="panel-3d-icon-glow" />
            <Trees size={16} strokeWidth={2.1} />
            <Sparkles size={10} strokeWidth={2.3} className="panel-3d-icon-sparkle" />
          </span>
          <span>Vegetation by Type</span>
        </div>
      </div>
      <div className="tree-type-chart-body">
      <ResponsiveContainer width="100%" height={235}>
        <PieChart>
          <Pie
            data={stats.treesByType}
            dataKey="count"
            nameKey="treeType"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {stats.treesByType.map((entry) => (
              <Cell
                key={entry.treeType}
                fill={TREE_TYPE_COLORS[entry.treeType] ?? DEFAULT_TREE_TYPE_COLOR}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>
      </div>
      <div className="chart-legend tree-type-legend">
        {stats.treesByType.slice(0, 6).map((t) => (
          <span key={t.treeType} className="chart-legend-item chart-legend-item--soft chart-legend-item--tree">
            <TreeTypeIcon treeType={t.treeType} size={28} />
            {t.treeType} · {t.count.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TreesByWilayatChart({ stats }: { stats: CensusStatistics }) {
  const data = stats.treesByWilayat.slice(0, 8);
  return (
    <div className="panel">
      <div className="panel-title">Vegetation by Wilayat</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="wilayat"
            tick={AXIS_STYLE}
            width={90}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Bar dataKey="count" fill="#7CB518" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FarmsByWilayatChart({ stats }: { stats: CensusStatistics }) {
  const data = stats.farmsByWilayat.slice(0, 8);
  return (
    <div className="panel">
      <div className="panel-title">Farms by Wilayat</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="wilayat" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#D6FF3F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TreesByGovernorateChart({ stats }: { stats: CensusStatistics }) {
  return (
    <div className="panel">
      <div className="panel-title">Vegetation by Governorate</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={stats.treesByGovernorate}>
          <XAxis dataKey="governorate" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Bar dataKey="count" fill="#C1873A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

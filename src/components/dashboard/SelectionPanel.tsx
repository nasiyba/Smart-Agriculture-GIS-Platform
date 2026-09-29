import { Download, FileText, MapPinned } from "lucide-react";
import { TreeTypeIcon } from "@/components/common/TreeTypeIcon";
import { exportCensusToKml } from "@/utils/kmlExport";
import type { AreaSelection, CensusStatistics, FarmBoundary, TreePoint, TreePolygon } from "@/types";
import { formatSquareMeters } from "@/utils/areaUnits";

interface SelectionPanelProps {
  stats: CensusStatistics | null;
  selection: AreaSelection;
  farms: FarmBoundary[];
  treePoints: TreePoint[];
  treePolygons: TreePolygon[];
  getMapScreenshot?: () => Promise<string | null>;
  onClear: () => void;
}

function downloadBlob(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SelectionPanel({ stats, selection, farms, treePoints, treePolygons, getMapScreenshot, onClear }: SelectionPanelProps) {
  if (!stats) return null;

  const pointIds = new Set(selection.treeIds);
  const polygonIds = new Set(selection.areaIds);
  const farmIds = new Set(selection.farmIds);
  const selectedPoints = treePoints.filter((p) => pointIds.has(p.treeId));
  const selectedPolygons = treePolygons.filter((p) => polygonIds.has(p.areaId));
  const selectedFarms = farms.filter((f) => farmIds.has(f.farmId));
  const individualTreeCount = selectedPoints.length;
  const groupedTreeCount = selectedPolygons.reduce((sum, item) => sum + item.treeCount, 0);

  const exportCsv = () => {
    const rows = [
      ["Geometry", "ID", "Tree Type", "Count", "Farm ID", "Governorate", "Wilayat"],
      ...selectedPoints.map((p) => ["Point", p.treeId, p.treeType, "1", p.farmId, p.governorate, p.wilayat]),
      ...selectedPolygons.map((p) => ["Polygon", p.areaId, p.treeType, String(p.treeCount), p.farmId, p.governorate, p.wilayat]),
    ];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(csv, "text/csv;charset=utf-8", "selected_area.csv");
  };



  const exportPdf = async () => {
    // Open immediately from the button click so browsers do not block it as a popup.
    const popup = window.open("", "_blank", "width=1100,height=800");
    if (!popup) return;
    popup.document.write('<!doctype html><html><body style="font-family:Arial,sans-serif;padding:32px;color:#2f392d">Preparing selected-area PDF…</body></html>');
    const screenshot = getMapScreenshot ? await getMapScreenshot() : null;
    const speciesRows = stats.treesByType.map((t) => `
      <tr><td>${t.treeType}</td><td>${t.count.toLocaleString()}</td></tr>`).join("");
    popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Selected Area Analysis</title>
<style>
body{font-family:Arial,sans-serif;color:#2f392d;margin:32px;background:#fff}h1{font-size:24px;margin:0 0 6px}p{color:#6e7869}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.card{border:1px solid #dfe5d9;border-radius:12px;padding:14px}.card strong{display:block;font-size:20px}.map{margin:20px 0;border:1px solid #dfe5d9;border-radius:14px;overflow:hidden}.map img{display:block;width:100%;height:auto}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border-bottom:1px solid #e6eadf;padding:9px;text-align:left;font-size:13px}th{background:#f5f7f1}@media print{body{margin:14mm}.no-print{display:none}}
</style></head><body>
<h1>Selected Area Analysis</h1><p>Smart Agriculture GIS Platform</p>
<div class="grid">
<div class="card"><span>Selected Area</span><strong>${formatSquareMeters(selection.areaHa)}</strong></div>
<div class="card"><span>Trees</span><strong>${stats.totalTrees.toLocaleString()}</strong></div>
<div class="card"><span>Farms</span><strong>${stats.totalFarms.toLocaleString()}</strong></div>
<div class="card"><span>Tree Types</span><strong>${stats.treeTypeCount.toLocaleString()}</strong></div>
</div>
${screenshot ? `<div class="map"><img src="${screenshot}" alt="Selected map area"></div>` : ""}
<h2>Species Breakdown</h2><table><thead><tr><th>Tree Type</th><th>Count</th></tr></thead><tbody>${speciesRows}</tbody></table>
<script>window.onload=()=>setTimeout(()=>window.print(),250);<\/script>
</body></html>`);
    popup.document.close();
  };

  return (
    <div className="panel area-analysis-panel info-unified-panel panel-with-scroll-controls">
      <div className="panel-title area-analysis-title">
        <span>Farm / Area Information</span>
        <button className="farm-panel-close" onClick={onClear}>Clear</button>
      </div>

      <div className="panel-scroll-body">
      <div className="info-section-kicker">Drawn Selection</div>
      <div className="info-section-title">Area Analysis</div>
      <div className="area-analysis-kpis">
        <div className="area-analysis-kpi area-analysis-kpi--area">
          <strong>{formatSquareMeters(selection.areaHa)}</strong>
          <span>Selected Area</span>
        </div>
        <div className="area-analysis-kpi area-analysis-kpi--trees">
          <strong>{stats.totalTrees.toLocaleString()}</strong>
          <span>Trees</span>
        </div>
      </div>

      <div className="area-analysis-summary">
        <div><span>Farms intersected</span><strong>{stats.totalFarms.toLocaleString()}</strong></div>
        <div><span>Tree types</span><strong>{stats.treeTypeCount.toLocaleString()}</strong></div>
        <div><span>Individual trees</span><strong>{individualTreeCount.toLocaleString()}</strong></div>
        <div><span>Grouped trees</span><strong>{groupedTreeCount.toLocaleString()}</strong></div>
      </div>

      <div className="area-analysis-section-title">By Species</div>
      <div className="area-analysis-species-list">
        {stats.treesByType.map((t) => {
          const pct = stats.totalTrees ? Math.round((t.count / stats.totalTrees) * 100) : 0;
          return (
            <div className="area-analysis-species-row" key={t.treeType}>
              <TreeTypeIcon treeType={t.treeType} size={28} />
              <span className="area-analysis-species-name">{t.treeType}</span>
              <strong>{t.count.toLocaleString()}</strong>
              <small>{pct}%</small>
            </div>
          );
        })}
      </div>

      <div className="area-analysis-section-title">By Geometry</div>
      <div className="area-analysis-geometry">
        <span>Individual: <strong>{individualTreeCount.toLocaleString()}</strong></span>
        <span>Tree Areas: <strong>{selectedPolygons.length.toLocaleString()}</strong></span>
      </div>

      <div className="area-analysis-section-title">Export Data</div>
      <div className="area-analysis-export-grid">
        <button onClick={exportCsv}><Download size={13}/> CSV</button>
        <button onClick={exportPdf}><FileText size={13}/> PDF</button>
        <button onClick={() => exportCensusToKml(selectedFarms, selectedPoints, selectedPolygons)}><MapPinned size={13}/> KML</button>
      </div>
      </div>
    </div>
  );
}

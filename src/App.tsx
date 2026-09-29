import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { Farms } from "@/pages/Farms";
import { TreeCensus } from "@/pages/TreeCensus";
import { Statistics } from "@/pages/Statistics";
import { Reports } from "@/pages/Reports";
import { DataExplorer } from "@/pages/DataExplorer";
import { SettingsPage } from "@/pages/SettingsPage";
import { HelpPage } from "@/pages/HelpPage";

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-shell">
        <Sidebar />
        <div className="main-column">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<Navigate to="/" replace />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/tree-census" element={<TreeCensus />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/data-explorer" element={<DataExplorer />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

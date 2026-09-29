import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Trees,
  Sprout,
  BarChart3,
  FileText,
  Database,
  Settings,
  HelpCircle
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/farms", label: "Farms", icon: Sprout },
  { to: "/tree-census", label: "Vegetation", icon: Trees },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/data-explorer", label: "Data Explorer", icon: Database },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <img src={`${import.meta.env.BASE_URL}assets/ministry-logo-full.png`} alt="Ministry of Agriculture, Fisheries and Water Resources" className="sidebar-brand-logo" />
        </div>
        <div className="sidebar-brand-text">
          AgriCensus
          <span>Smart Agriculture GIS Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <Settings size={16} strokeWidth={2} />
          Settings
        </NavLink>
        <NavLink to="/help" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
          <HelpCircle size={16} strokeWidth={2} />
          Help
        </NavLink>
        <div className="sidebar-credit">Agricultural Census<br/>GIS Platform · 2026</div>
      </div>
    </aside>
  );
}

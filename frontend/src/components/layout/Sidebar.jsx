import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquareText,
  Database,
  History,
  Settings,
  Upload,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/query", icon: MessageSquareText, label: "AI Query" },
  { to: "/explorer", icon: Database, label: "Data Explorer" },
  { to: "/history", icon: History, label: "History" },
  { to: "/upload", icon: Upload, label: "Upload Data" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-border flex flex-col z-40 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <BarChart3 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-text-primary leading-tight">
              BI Agent
            </h1>
            <p className="text-[10px] text-text-muted leading-tight">
              AI-Powered Analytics
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                isActive
                  ? "bg-primary-50 text-primary font-semibold"
                  : "text-text-secondary hover:bg-surface-light hover:text-text-primary"
              }`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                  }`}
                />
                {!collapsed && <span>{label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-text-muted hover:bg-surface-light hover:text-text-secondary transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}

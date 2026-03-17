import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
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
  UserCircle2,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/query", icon: MessageSquareText, label: "AI Query" },
  { to: "/explorer", icon: Database, label: "Data Explorer" },
  { to: "/history", icon: History, label: "History" },
  { to: "/upload", icon: Upload, label: "Upload Data" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const AVATAR_COLORS = [
  { from: "#F97316", to: "#F59E0B" },
  { from: "#3B82F6", to: "#06B6D4" },
  { from: "#8B5CF6", to: "#EC4899" },
  { from: "#22C55E", to: "#14B8A6" },
  { from: "#EF4444", to: "#F97316" },
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function loadProfile() {
  try {
    const saved = localStorage.getItem("bi_agent_user_profile");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

export default function Sidebar({ collapsed, onToggle }) {
  const [profile, setProfile] = useState(loadProfile);

  // Refresh when profile is saved from ProfilePage (same tab) or another tab
  useEffect(() => {
    function onUpdate() { setProfile(loadProfile()); }
    window.addEventListener("bi_profile_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("bi_profile_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const colorIdx = profile?.avatarColor ?? 0;
  const color = AVATAR_COLORS[colorIdx] || AVATAR_COLORS[0];
  const initials = getInitials(profile?.name);
  const displayName = profile?.name || profile?.username || "My Profile";

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

      {/* ── User Profile Section ── */}
      <div className="border-t border-border px-3 py-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group ${
              isActive
                ? "bg-primary-50"
                : "hover:bg-surface-light"
            }`
          }
          title={collapsed ? displayName : undefined}
        >
          {({ isActive }) => (
            <>
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
              >
                {(profile?.name || profile?.username) ? (
                  <span className="text-xs font-bold text-white select-none">{initials}</span>
                ) : (
                  <UserCircle2 size={16} className="text-white" />
                )}
              </div>

              {/* Name + label */}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? "text-primary" : "text-text-primary"}`}>
                    {displayName}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">
                    {profile?.role || "View profile"}
                  </p>
                </div>
              )}
            </>
          )}
        </NavLink>
      </div>

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


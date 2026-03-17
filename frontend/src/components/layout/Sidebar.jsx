import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  Database,
  History,
  Upload,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  UserCircle2,
  X,
  LogOut,
} from "lucide-react";
import { AVATAR_COLORS, getInitials, loadProfile } from "../../utils/constants";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/query", icon: MessageSquareText, label: "AI Query" },
  { to: "/explorer", icon: Database, label: "Data Explorer" },
  { to: "/history", icon: History, label: "History" },
  { to: "/upload", icon: Upload, label: "Upload Data" },
];

export default function Sidebar({ collapsed, onToggle, isMobile, onClose }) {
  const [profile, setProfile] = useState(loadProfile);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && onClose) onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleLogout = () => {
    // Clear user profile from localStorage
    localStorage.removeItem("bi_agent_user_profile");
    // Navigate to landing page
    navigate("/landing");
  };

  const colorIdx = profile?.avatarColor ?? 0;
  const color = AVATAR_COLORS[colorIdx] || AVATAR_COLORS[0];
  const initials = getInitials(profile?.name);
  const displayName = profile?.name || profile?.username || "My Profile";
  const isExpanded = isMobile || !collapsed;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-border flex flex-col z-50 transition-all duration-200 ${
          isMobile ? "w-[240px] shadow-2xl" : collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <BarChart3 size={18} className="text-white" />
          </div>
          {isExpanded && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-base font-bold text-text-primary leading-tight">
                BI Agent
              </h1>
              <p className="text-[10px] text-text-muted leading-tight">
                AI-Powered Analytics
              </p>
            </div>
          )}
          {isMobile && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-light text-text-muted ml-auto">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                  isActive
                    ? "bg-primary-50 text-primary font-semibold"
                    : "text-text-secondary hover:bg-surface-light hover:text-text-primary"
                }`
              }
              title={!isExpanded ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className={`shrink-0 ${
                      isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                    }`}
                  />
                  {isExpanded && <span>{label}</span>}
                  {isActive && isExpanded && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User Profile Section ── */}
        <div className="border-t border-border px-3 py-3 space-y-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group ${
                isActive
                  ? "bg-primary-50"
                  : "hover:bg-surface-light"
              }`
            }
            title={!isExpanded ? displayName : undefined}
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
                {isExpanded && (
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

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-text-secondary hover:text-error hover:bg-red-50 transition-all duration-150"
            title={!isExpanded ? "Logout" : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {isExpanded && <span className="text-xs font-medium">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle — hidden on mobile */}
        {!isMobile && (
          <div className="border-t border-border px-3 py-3">
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-full py-2 rounded-lg text-text-muted hover:bg-surface-light hover:text-text-secondary transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}


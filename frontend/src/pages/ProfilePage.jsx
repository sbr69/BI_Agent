import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Briefcase,
  Calendar,
  Edit3,
  Save,
  X,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  Info,
} from "lucide-react";
import { AVATAR_COLORS, getInitials, loadProfile } from "../utils/constants";

const PROFILE_KEY = "bi_agent_user_profile";
const ROLES = ["Analyst", "Manager", "Developer", "Student", "Data Scientist", "Other"];

function saveProfile(data) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

const DEFAULT_PROFILE = {
  name: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  role: "Analyst",
  avatarColor: 0,
  joinedAt: new Date().toISOString(),
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => loadProfile() || DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    // If profile has no name, check if we came from signup
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      setEditing(true); // open edit mode immediately for new users
    }
  }, []);

  function handleEdit() {
    setDraft({ ...profile });
    setErrors({});
    setEditing(true);
  }

  function handleCancel() {
    setDraft(profile);
    setErrors({});
    setEditing(false);
  }

  function validate(d) {
    const e = {};
    if (!d.name.trim()) e.name = "Full name is required.";
    if (!d.username.trim()) e.username = "Username is required.";
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(d.username))
      e.username = "3–20 chars, letters, numbers, underscores only.";
    if (!d.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
      e.email = "Enter a valid email.";
    if (d.phone && !/^[+\d\s\-()]{7,15}$/.test(d.phone))
      e.phone = "Enter a valid phone number.";
    return e;
  }

  function handleSave() {
    const e = validate(draft);
    if (Object.keys(e).length) { setErrors(e); return; }
    const updated = { ...draft };
    setProfile(updated);
    saveProfile(updated);
    // Notify Sidebar (same tab) to refresh
    window.dispatchEvent(new CustomEvent("bi_profile_updated"));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleChange(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function handleSignOut() {
    navigate("/landing");
  }

  const color = AVATAR_COLORS[profile.avatarColor ?? 0];
  const initials = getInitials(profile.name || draft.name || "U");

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage your personal information and account settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-success animate-fade-in">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          {!editing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 border border-border hover:bg-surface-light text-text-secondary rounded-lg text-sm font-medium transition-colors"
              >
                <X size={15} /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save size={15} /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Avatar + Identity Card ── */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
            >
              <span className="text-2xl font-bold text-white select-none">{initials}</span>
            </div>
            {editing && (
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center hover:bg-surface-light transition-colors"
                title="Change avatar colour"
              >
                <Camera size={13} className="text-text-muted" />
              </button>
            )}
            {/* Color picker */}
            {showColorPicker && editing && (
              <div className="absolute top-full mt-2 left-0 z-10 card p-3 flex gap-2 shadow-lg">
                {AVATAR_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleChange("avatarColor", i);
                      setShowColorPicker(false);
                    }}
                    className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${
                      draft.avatarColor === i ? "ring-2 ring-offset-1 ring-primary scale-110" : ""
                    }`}
                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <input
                    value={draft.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Full name"
                    className={`w-full text-lg font-semibold px-3 py-2 border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
                      errors.name ? "border-error" : "border-border"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
                      <AlertCircle size={11} /> {errors.name}
                    </p>
                  )}
                </div>
                <select
                  value={draft.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-lg bg-white text-sm text-text-secondary focus:outline-none focus:border-primary transition-all"
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text-primary truncate">
                  {profile.name || <span className="text-text-muted italic">No name set</span>}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-primary text-xs font-semibold border border-primary-200">
                    {profile.role || "Analyst"}
                  </span>
                  {profile.username && (
                    <span className="text-sm text-text-muted">@{profile.username}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  {profile.bio || <span className="italic text-text-muted">No bio set</span>}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-surface-light">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Personal Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <Field
            label="Full Name"
            icon={User}
            editing={editing}
            value={editing ? draft.name : profile.name}
            onChange={(v) => handleChange("name", v)}
            placeholder="Jane Smith"
            error={errors.name}
          />
          {/* Username */}
          <Field
            label="Username"
            icon={AtSign}
            editing={editing}
            value={editing ? draft.username : profile.username}
            onChange={(v) => handleChange("username", v)}
            placeholder="jane_smith"
            error={errors.username}
            prefix="@"
          />
          {/* Email */}
          <Field
            label="Email Address"
            icon={Mail}
            editing={editing}
            value={editing ? draft.email : profile.email}
            onChange={(v) => handleChange("email", v)}
            placeholder="jane@example.com"
            type="email"
            error={errors.email}
          />
          {/* Phone */}
          <Field
            label="Phone Number"
            icon={Phone}
            editing={editing}
            value={editing ? draft.phone : profile.phone}
            onChange={(v) => handleChange("phone", v)}
            placeholder="+1 555 000 0000"
            type="tel"
            error={errors.phone}
          />
          {/* Bio — full width */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Bio</label>
            {editing ? (
              <textarea
                value={draft.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell us a little about yourself…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
              />
            ) : (
              <p className="text-sm text-text-primary min-h-[40px]">
                {profile.bio || <span className="italic text-text-muted">No bio set</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Account Information ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-surface-light">
          <div className="w-7 h-7 rounded-lg bg-info-50 flex items-center justify-center">
            <Shield size={14} className="text-info" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Account Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
            {editing ? (
              <select
                value={draft.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              >
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-text-muted shrink-0" />
                <span className="text-sm text-text-primary">{profile.role || "Analyst"}</span>
              </div>
            )}
          </div>
          {/* Member since */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Member Since
            </label>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-text-muted shrink-0" />
              <span className="text-sm text-text-primary">
                {new Date(profile.joinedAt || Date.now()).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-surface-light">
          <div className="w-7 h-7 rounded-lg bg-error-50 flex items-center justify-center">
            <Info size={14} className="text-error" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary">Account Actions</h3>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Sign out</p>
            <p className="text-xs text-text-muted mt-0.5">
              You will be returned to the home page.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-error/30 bg-error-50 hover:bg-error/10 text-error rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable field component ── */
function Field({ label, icon: Icon, editing, value, onChange, placeholder, type = "text", error, prefix }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
      {editing ? (
        <div>
          <div className="relative">
            {Icon && (
              <Icon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            )}
            {prefix && (
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                {prefix}
              </span>
            )}
            <input
              type={type}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full py-2.5 text-sm border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
                prefix ? "pl-12 pr-3" : "pl-9 pr-3"
              } ${error ? "border-error focus:border-error focus:ring-error/10" : "border-border focus:border-primary focus:ring-primary/10"}`}
            />
          </div>
          {error && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-error">
              <AlertCircle size={11} /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 min-h-[32px]">
          {Icon && <Icon size={14} className="text-text-muted shrink-0" />}
          <span className="text-sm text-text-primary">
            {value
              ? prefix ? `${prefix}${value}` : value
              : <span className="italic text-text-muted">Not set</span>
            }
          </span>
        </div>
      )}
    </div>
  );
}

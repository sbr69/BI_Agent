import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "Contains a number", test: (v) => /\d/.test(v) },
  { label: "Contains a letter", test: (v) => /[a-zA-Z]/.test(v) },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Full name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Please enter a valid email address.");
    if (!form.password) return setError("Password is required.");
    if (!PASSWORD_RULES.every((r) => r.test(form.password)))
      return setError("Password does not meet the requirements.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    // Simulate async registration — replace with real API call
    await new Promise((r) => setTimeout(r, 1100));
    setLoading(false);

    // Seed profile in localStorage so ProfilePage has data on first visit
    const nameParts = form.name.trim().split(" ").filter(Boolean);
    const username =
      (nameParts[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, "") +
      "_" +
      Math.floor(1000 + Math.random() * 9000);
    try {
      localStorage.setItem(
        "bi_agent_user_profile",
        JSON.stringify({
          name: form.name.trim(),
          username,
          email: form.email.trim(),
          phone: "",
          bio: "",
          role: "Analyst",
          avatarColor: 0,
          joinedAt: new Date().toISOString(),
        })
      );
    } catch { /* ignore */ }

    navigate("/");
  }

  const passwordStrength = PASSWORD_RULES.filter((r) =>
    r.test(form.password)
  ).length;
  const strengthColor =
    passwordStrength === 0
      ? "bg-border"
      : passwordStrength === 1
      ? "bg-error"
      : passwordStrength === 2
      ? "bg-warning"
      : "bg-success";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-border flex items-center px-6">
        <Link to="/landing" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BarChart3 size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">
            BI <span className="text-primary">Agent</span>
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-md">
                <BarChart3 size={22} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-text-primary">Create your account</h1>
              <p className="text-xs text-text-muted">Start analysing your data in seconds</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-error">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-medium text-text-secondary">
                  Full name
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-medium text-text-secondary">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-text-secondary">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1 h-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength ? strengthColor : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {(passwordFocused || form.password) && (
                  <div className="space-y-1 pt-0.5">
                    {PASSWORD_RULES.map((r) => {
                      const met = r.test(form.password);
                      return (
                        <div key={r.label} className="flex items-center gap-1.5">
                          <CheckCircle2
                            size={11}
                            className={met ? "text-success" : "text-border"}
                          />
                          <span
                            className={`text-[11px] transition-colors ${
                              met ? "text-success" : "text-text-muted"
                            }`}
                          >
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-text-secondary">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? "border-error focus:border-error focus:ring-error/10"
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? "border-success focus:border-success focus:ring-success/10"
                        : "border-border focus:border-primary focus:ring-primary/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="flex items-center gap-1 text-[11px] text-success">
                    <CheckCircle2 size={11} /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>

              <p className="text-[11px] text-center text-text-muted leading-relaxed">
                By creating an account you agree to our{" "}
                <span className="text-primary cursor-pointer hover:underline">Terms</span> and{" "}
                <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[11px] text-text-muted bg-white">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login link */}
            <Link
              to="/login"
              className="w-full flex items-center justify-center py-2.5 border border-border hover:border-primary-200 hover:bg-surface-hover text-sm font-medium text-text-secondary rounded-lg transition-all"
            >
              Sign in
            </Link>
          </div>

          {/* Back */}
          <p className="text-center text-xs text-text-muted mt-5">
            <Link to="/landing" className="hover:text-primary transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

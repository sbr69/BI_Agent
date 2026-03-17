export const AVATAR_COLORS = [
  { from: "#F97316", to: "#F59E0B", label: "Orange" },
  { from: "#3B82F6", to: "#06B6D4", label: "Blue" },
  { from: "#8B5CF6", to: "#EC4899", label: "Purple" },
  { from: "#22C55E", to: "#14B8A6", label: "Green" },
  { from: "#EF4444", to: "#F97316", label: "Red" },
];

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PROFILE_KEY = "bi_agent_user_profile";

export function loadProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

export function sanitizeText(value) {
  if (value == null) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const EXAMPLE_PROMPTS = [
  "Show me total revenue by customer region",
  "Monthly sales trends for 2023 by product category",
  "What's the most popular payment method?",
  "Top 5 product categories by average discount",
  "Revenue vs discount correlation analysis",
  "Compare Q1 and Q2 2023 performance by region",
];

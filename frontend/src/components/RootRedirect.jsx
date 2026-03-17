import { Navigate } from "react-router-dom";

export default function RootRedirect() {
  // Check if user is authenticated
  const userProfile = localStorage.getItem("bi_agent_user_profile");
  const isAuthenticated = !!userProfile;

  // If authenticated, redirect to dashboard; otherwise redirect to landing page
  return <Navigate to={isAuthenticated ? "/dashboard" : "/landing"} replace />;
}

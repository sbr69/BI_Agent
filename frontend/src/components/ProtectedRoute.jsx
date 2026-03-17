import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check if user is authenticated by checking localStorage
  const userProfile = localStorage.getItem("bi_agent_user_profile");
  const isAuthenticated = !!userProfile;

  // If not authenticated, redirect to landing page
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  // If authenticated, render the protected component
  return children;
}

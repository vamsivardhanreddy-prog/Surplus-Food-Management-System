import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "donator" | "ngo")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard if they try to access wrong role page
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "donator") return <Redirect to="/donator" />;
    if (user.role === "ngo") return <Redirect to="/ngo" />;
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

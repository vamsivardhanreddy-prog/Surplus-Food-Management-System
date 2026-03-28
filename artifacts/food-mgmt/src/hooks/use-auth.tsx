import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetMe, 
  useLogin, 
  useRegister,
  getGetMeQueryKey,
  type User,
  type LoginRequest,
  type RegisterRequest
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("food_mgmt_token"));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Setup generic fetch interceptor or headers logic globally if needed.
  // For this implementation, we assume `custom-fetch` picks up the token, 
  // but to be safe we sync it with localStorage which is the standard approach.
  
  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      // If token is invalid
      logout();
    }
  }, [error]);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleLogin = async (data: LoginRequest) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      localStorage.setItem("food_mgmt_token", response.token);
      setToken(response.token);
      queryClient.setQueryData(getGetMeQueryKey(), response.user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err?.message || "Invalid credentials.",
      });
      throw err;
    }
  };

  const handleRegister = async (data: RegisterRequest) => {
    try {
      const response = await registerMutation.mutateAsync({ data });
      localStorage.setItem("food_mgmt_token", response.token);
      setToken(response.token);
      queryClient.setQueryData(getGetMeQueryKey(), response.user);
      toast({
        title: "Account created!",
        description: "Welcome to the platform.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err?.message || "Could not create account.",
      });
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("food_mgmt_token");
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading: isUserLoading && !!token,
      login: handleLogin,
      register: handleRegister,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

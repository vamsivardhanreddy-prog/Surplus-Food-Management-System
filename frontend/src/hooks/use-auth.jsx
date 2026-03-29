import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useLogin,
  useRegister,
  getGetMeQueryKey,
  setAuthTokenGetter } from



"@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";










const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("food_mgmt_token"));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Register the token getter so every API request includes Authorization: Bearer <token>
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("food_mgmt_token"));
    return () => {
      setAuthTokenGetter(null);
    };
  }, []);

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false
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

  const handleLogin = async (data) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      localStorage.setItem("food_mgmt_token", response.token);
      setToken(response.token);
      queryClient.setQueryData(getGetMeQueryKey(), response.user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in."
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err?.message || "Invalid credentials."
      });
      throw err;
    }
  };

  const handleRegister = async (data) => {
    try {
      const response = await registerMutation.mutateAsync({ data });
      localStorage.setItem("food_mgmt_token", response.token);
      setToken(response.token);
      queryClient.setQueryData(getGetMeQueryKey(), response.user);
      toast({
        title: "Account created!",
        description: "Welcome to the platform."
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err?.message || "Could not create account."
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
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>);

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
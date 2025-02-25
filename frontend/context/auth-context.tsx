"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import apiService from "@/services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAuthLoaded: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await apiService.fetchAuthState();
      setIsAuthenticated(authenticated);
      setIsAuthLoaded(true);
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

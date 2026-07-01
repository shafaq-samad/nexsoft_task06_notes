import { useCallback, useEffect, useState } from "react";
import { authApi } from "../services/api";
import { AuthRequestPayload, AppView, User } from "../types";

interface UseAuthResult {
  token: string | null;
  currentUser: Omit<User, "passwordHash"> | null;
  currentView: AppView;
  authError: string;
  appInitializing: boolean;
  setCurrentView: (view: AppView) => void;
  setAuthError: (message: string) => void;
  login: (payload: AuthRequestPayload) => Promise<void>;
  register: (payload: AuthRequestPayload) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [token, setToken] = useState<string | null>(typeof window !== "undefined" ? window.localStorage.getItem("token") : null);
  const [currentUser, setCurrentUser] = useState<Omit<User, "passwordHash"> | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(token ? "dashboard" : "login");
  const [authError, setAuthError] = useState("");
  const [appInitializing, setAppInitializing] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const savedToken = window.localStorage.getItem("token");
      if (!savedToken) {
        setAppInitializing(false);
        return;
      }

      try {
        const data = await authApi.me(savedToken);
        setCurrentUser(data.user);
        setToken(savedToken);
        setCurrentView("dashboard");
      } catch (error) {
        window.localStorage.removeItem("token");
        setToken(null);
        setCurrentView("login");
      } finally {
        setAppInitializing(false);
      }
    };

    void verifySession();
  }, []);

  const persistToken = useCallback((nextToken: string, user: Omit<User, "passwordHash">) => {
    window.localStorage.setItem("token", nextToken);
    setToken(nextToken);
    setCurrentUser(user);
    setCurrentView("dashboard");
  }, []);

  const login = useCallback(async (payload: AuthRequestPayload) => {
    setAuthError("");
    const data = await authApi.login(payload);
    persistToken(data.token, data.user);
  }, [persistToken]);

  const register = useCallback(async (payload: AuthRequestPayload) => {
    setAuthError("");
    const data = await authApi.register(payload);
    persistToken(data.token, data.user);
  }, [persistToken]);

  const logout = useCallback(() => {
    window.localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setCurrentView("login");
  }, []);

  return {
    token,
    currentUser,
    currentView,
    authError,
    appInitializing,
    setCurrentView,
    setAuthError,
    login,
    register,
    logout,
  };
}

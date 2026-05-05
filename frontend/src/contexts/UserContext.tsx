"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken, clearToken, isLoggedIn } from "@/lib/auth";

const API_URL = "http://localhost:8000/api/v1";

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    const handler = () => fetchUser();
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, [fetchUser]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refresh: fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

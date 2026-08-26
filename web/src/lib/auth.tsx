import { createContext, useContext, useMemo, useState, ReactNode } from "react";

type AuthState = {
  authenticated: boolean;
  name: string;
  login: (name: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const KEY = "gridloss_auth";

function readStored(): string {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState(readStored);

  const value = useMemo<AuthState>(
    () => ({
      authenticated: Boolean(name),
      name,
      login: (n) => {
        setName(n);
        localStorage.setItem(KEY, n);
      },
      logout: () => {
        setName("");
        localStorage.removeItem(KEY);
      },
    }),
    [name]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth hors AuthProvider");
  return ctx;
}

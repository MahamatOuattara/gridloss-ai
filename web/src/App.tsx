import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { AnalysisProvider } from "./lib/analysis";
import { ThemeProvider } from "./lib/theme";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import Connexion from "./pages/Connexion";
import NouvelleAnalyse from "./pages/NouvelleAnalyse";
import VueEnsemble from "./pages/VueEnsemble";
import CarteAtlas from "./pages/CarteAtlas";
import FichePoste from "./pages/FichePoste";
import FicheAbonne from "./pages/FicheAbonne";
import ActionTerrain from "./pages/ActionTerrain";

function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const location = useLocation();
  if (!authenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="analyse" replace />} />
        <Route path="analyse" element={<NouvelleAnalyse />} />
        <Route path="resultats" element={<VueEnsemble />} />
        <Route path="carte" element={<CarteAtlas />} />
        <Route path="postes" element={<FichePoste />} />
        <Route path="postes/:id" element={<FichePoste />} />
        <Route path="abonnes" element={<FicheAbonne />} />
        <Route path="abonnes/:id" element={<FicheAbonne />} />
        <Route path="terrain" element={<ActionTerrain />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <AppRoutes />
        </AnalysisProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

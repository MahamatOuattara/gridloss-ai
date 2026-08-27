import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import CinematicBackdrop from "../components/CinematicBackdrop";
import LiveGrid from "../components/LiveGrid";
import { LogoMarkMono } from "../components/Logo";

export default function Connexion() {
  const [params] = useSearchParams();
  const demoMode = params.get("demo") === "1";
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(demoMode ? "jury.sirexe" : "");
  const [password, setPassword] = useState(demoMode ? "demo2026" : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !password.trim()) {
      setError("Merci de renseigner un identifiant et un mot de passe.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.login(name.trim(), password);
      login(res.username);
      navigate("/app/analyse");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-[#040812]">
      <CinematicBackdrop dim="heavy" />
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <LiveGrid />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-5 md:px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <LogoMarkMono className="w-7 h-7" />
            </div>
            <span className="font-display font-bold">GridLoss AI</span>
          </Link>
          <Link to="/" className="text-xs text-white/60 hover:text-white">
            Retour accueil
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <form onSubmit={onSubmit} className="w-full max-w-md gl-glass p-7 md:p-8 gl-animate">
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber">Accès opérateur</p>
            <h1 className="font-display text-3xl font-extrabold mt-2">Connexion</h1>
            <p className="text-sm text-white/60 mt-2">Espace démo GridLoss AI, salle de contrôle SIREXE.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70">Identifiant</label>
                <input
                  className="gl-hud-input mt-1 w-full px-3 py-2.5 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex. i.kouassi"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/70">Mot de passe</label>
                <input
                  type="password"
                  className="gl-hud-input mt-1 w-full px-3 py-2.5 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <p className="text-xs text-white/40 mt-2 text-right">Mot de passe oublié ?</p>
              </div>
              {error && <p className="text-sm text-amber">{error}</p>}
              <button type="submit" className="gl-btn-primary w-full py-3" disabled={busy}>
                {busy ? "Authentification…" : "Entrer dans la salle"}
              </button>
              <p className="text-xs text-white/45 leading-relaxed">
                Prototype de démonstration : toute paire identifiant et mot de passe non vide fonctionne.
              </p>
            </div>
          </form>
        </main>

        <p className="text-center text-[11px] text-white/35 pb-5">
          SIREXE Hackathon 2026, Prix Thématique, Défi Énergie
        </p>
      </div>
    </div>
  );
}

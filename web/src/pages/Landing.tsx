import { Link } from "react-router-dom";
import CinematicBackdrop from "../components/CinematicBackdrop";
import LiveGrid from "../components/LiveGrid";
import { LogoMarkMono } from "../components/Logo";

export default function Landing() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-[#040812]">
      <CinematicBackdrop />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-5 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <LogoMarkMono className="w-7 h-7" />
            </div>
            <div>
              <p className="font-display font-bold leading-tight">GridLoss AI</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Salle de contrôle</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/connexion" className="gl-btn-ghost-dark">
              Connexion
            </Link>
            <Link to="/connexion?demo=1" className="gl-btn-primary">
              Accéder à la démo
            </Link>
          </div>
        </header>

        <main className="flex-1 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center px-5 md:px-8 py-8 md:py-12">
          <div className="gl-animate max-w-2xl">
            <h1 className="font-display text-4xl md:text-[3.4rem] font-extrabold tracking-tight leading-[1.08] text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]">
              Voyez les pertes
              <span className="block text-amber-dark">avant qu'elles ne disparaissent.</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg mt-5 leading-relaxed max-w-xl">
              GridLoss AI croise comptage et imagerie aérienne pour localiser les pertes non techniques, scorer chaque
              abonné, et ranger les missions par gain estimé.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/connexion?demo=1" className="gl-btn-primary px-6 py-3">
                Entrer dans la salle de contrôle
              </Link>
              <Link to="/connexion" className="gl-btn-ghost-dark px-6 py-3">
                Espace opérateur
              </Link>
            </div>
          </div>

          <div className="relative gl-animate justify-self-center w-full max-w-[420px] aspect-square">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-6 rounded-full border border-[#FF6600]/40" />
            <div className="absolute inset-0 rounded-full overflow-hidden gl-radar-sweep opacity-80" />
            <div className="absolute inset-8 rounded-full overflow-hidden bg-black/35 border border-white/10">
              <LiveGrid />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 gl-glass px-4 py-2 text-center whitespace-nowrap">
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber font-bold">Anomalie en visée</p>
              <p className="text-xs text-white/80 mt-0.5">Poste P-142, Hiré, perte 15,5 %</p>
            </div>
          </div>
        </main>

        <footer className="px-5 md:px-8 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["6", "postes suivis"],
              ["330", "abonnés couverts"],
              ["25", "alertes ≥ 80"],
              ["1,38 M", "FCFA par an"],
            ].map(([value, label]) => (
              <div key={label} className="gl-glass px-4 py-3">
                <p className="font-display text-xl font-extrabold text-amber">{value}</p>
                <p className="text-[11px] uppercase tracking-wide text-white/55 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/40 mt-4">
            Prototype sur données synthétiques, aucune donnée réelle CIE ou CI-Energies.
          </p>
        </footer>
      </div>
    </div>
  );
}

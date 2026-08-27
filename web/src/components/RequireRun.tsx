import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAnalysis } from "../lib/analysis";

export default function RequireRun({ children }: { children: ReactNode }) {
  const { run, loadDemo, loading } = useAnalysis();
  if (!run) {
    return (
      <div className="gl-page">
        <div className="gl-panel p-8">
          <p className="text-[11px] font-bold text-amber-dark">Résultats</p>
          <h2 className="font-display text-xl font-bold mt-1">Aucune analyse en mémoire</h2>
          <p className="text-muted mt-2 text-sm">
            Lancez un run depuis Nouvelle analyse, ou chargez le jeu de démonstration (6 postes).
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="gl-btn-primary" disabled={loading} onClick={() => void loadDemo()}>
              Jeu de démonstration
            </button>
            <Link to="/app/analyse" className="gl-btn-ghost">
              Nouvelle analyse
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

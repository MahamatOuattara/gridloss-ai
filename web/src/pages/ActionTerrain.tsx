import { Link } from "react-router-dom";
import RequireRun from "../components/RequireRun";
import PageHeader from "../components/PageHeader";
import { IconClipboard } from "../components/icons";
import { useAnalysis } from "../lib/analysis";
import { formatFcfaFull } from "../lib/format";

function TerrainInner() {
  const { run } = useAnalysis();
  if (!run) return null;
  const top = run.abonnes.filter((a) => a.score_risque >= 80).slice(0, 8);

  return (
    <div className="gl-page">
      <PageHeader icon={IconClipboard} kicker="Missions" title="Action terrain">
        <span className="gl-badge border border-edge text-muted">bientôt</span>
      </PageHeader>

      <div className="gl-panel p-8 mb-4">
        <h2 className="font-display text-xl font-bold">File d'attente en préparation</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          La prochaine brique : transformer les priorités GridLoss en missions d'inspection (équipes, tournées, preuves
          photo, clôture). Le moteur identifie déjà qui investiguer en premier.
        </p>
      </div>

      <div className="gl-panel p-5">
        <h3 className="gl-section-title mb-3">Aperçu des priorités</h3>
        <ul className="divide-y divide-edge">
          {top.map((a, i) => (
            <li key={a.abonne_id} className="py-3 flex items-center justify-between gap-3 opacity-80">
              <div>
                <p className="font-semibold text-sm">
                  <span className="text-muted mr-2">{i + 1}.</span>
                  {a.abonne_id}
                </p>
                <p className="text-xs text-muted">
                  {a.poste_id}, {a.motif_principal}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-amber-dark">{a.score_risque.toFixed(0)}</p>
                <p className="text-[11px] text-muted">{formatFcfaFull(a.gain_estime_fcfa_an)}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link to="/app/abonnes" className="gl-btn-ghost mt-4 w-full">
          Voir les fiches abonnés
        </Link>
      </div>
    </div>
  );
}

export default function ActionTerrain() {
  return (
    <RequireRun>
      <TerrainInner />
    </RequireRun>
  );
}

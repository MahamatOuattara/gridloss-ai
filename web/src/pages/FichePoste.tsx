import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RequireRun from "../components/RequireRun";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import { IconSubstation } from "../components/icons";
import { useAnalysis } from "../lib/analysis";
import { COLORS, lossColor } from "../lib/colors";
import { formatFcfaFull, formatKwh, formatPct } from "../lib/format";

function FichePosteInner() {
  const { run } = useAnalysis();
  const { id } = useParams();
  const navigate = useNavigate();
  if (!run) return null;

  const poste = useMemo(() => {
    if (id) return run.postes.find((p) => p.poste_id === id) || run.postes[0];
    return [...run.postes].sort((a, b) => b.taux_perte_pct - a.taux_perte_pct)[0];
  }, [run.postes, id]);

  const abonnes = useMemo(
    () => run.abonnes.filter((a) => a.poste_id === poste.poste_id).slice(0, 10),
    [run.abonnes, poste.poste_id]
  );

  return (
    <div className="gl-page">
      <PageHeader icon={IconSubstation} kicker="Investigations" title={`${poste.poste_id} - ${poste.nom}`}>
        <label className="text-sm">
          <span className="text-xs text-muted font-semibold">Choisir un poste</span>
          <select
            className="gl-field mt-1 block px-3 py-2 text-sm min-w-[240px]"
            value={poste.poste_id}
            onChange={(e) => navigate(`/app/postes/${e.target.value}`)}
          >
            {run.postes.map((p) => (
              <option key={p.poste_id} value={p.poste_id}>
                {p.poste_id} - {p.nom}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          color={lossColor(poste.taux_perte_pct)}
          label="Perte totale"
          value={formatPct(poste.taux_perte_pct)}
          note="injecté vs facturé"
        />
        <KpiCard
          color={COLORS.amber}
          label="Dont non technique"
          value={poste.perte_non_technique_pct.toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " pts"}
          note="résidu à investiguer"
        />
        <KpiCard
          color={COLORS.green}
          label="Gain estimé"
          value={Math.round(poste.gain_estime_fcfa_an).toLocaleString("fr-FR")}
          note="FCFA par an"
        />
        <KpiCard
          color={COLORS.lblue}
          label="Abonnés du poste"
          value={String(poste.n_abonnes)}
          note={`zone ${poste.intensite.toLowerCase()}`}
        />
      </div>

      <div className="gl-panel p-5 mb-4">
        <h3 className="gl-section-title mb-2">Bilan énergétique</h3>
        <p className="text-sm text-muted leading-relaxed">
          Injecté : <b className="text-ink font-mono">{formatKwh(poste.energie_injectee_kwh)}</b>, Facturé :{" "}
          <b className="text-ink font-mono">{formatKwh(poste.energie_facturee_kwh)}</b>, Perte technique estimée (modèle
          physique) : <b className="text-ink font-mono">{formatKwh(poste.perte_technique_estimee_kwh)}</b>, Résidu non
          expliqué : <b className="text-amber font-mono">{formatKwh(poste.perte_non_technique_kwh)}</b>
        </p>
      </div>

      <div className="gl-panel p-5 overflow-x-auto">
        <h3 className="gl-section-title mb-3">Abonnés prioritaires sur ce poste</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-muted border-b border-edge">
              <th className="py-2 pr-3">Abonné</th>
              <th className="py-2 pr-3">Score de risque</th>
              <th className="py-2 pr-3">Motif</th>
              <th className="py-2">Gain estimé (FCFA par an)</th>
            </tr>
          </thead>
          <tbody>
            {abonnes.map((a) => (
              <tr key={a.abonne_id} className="border-b border-edge last:border-0">
                <td className="py-2 pr-3">
                  <Link to={`/app/abonnes/${a.abonne_id}`} className="font-mono font-semibold text-blue hover:underline">
                    {a.abonne_id}
                  </Link>
                </td>
                <td className="py-2 pr-3 font-mono font-bold">{a.score_risque.toFixed(0)}</td>
                <td className="py-2 pr-3 text-muted">{a.motif_principal}</td>
                <td className="py-2 font-mono">{formatFcfaFull(a.gain_estime_fcfa_an)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FichePoste() {
  return (
    <RequireRun>
      <FichePosteInner />
    </RequireRun>
  );
}

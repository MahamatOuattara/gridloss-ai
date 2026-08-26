import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import RequireRun from "../components/RequireRun";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import { IconUser } from "../components/icons";
import { useAnalysis } from "../lib/analysis";
import { COLORS, MONTHS, tooltipStyle, useAxisColors } from "../lib/colors";
import { formatFcfaFull } from "../lib/format";
import { Abonne } from "../lib/api";

function series(a: Abonne) {
  return MONTHS.map((m) => ({ mois: m, kwh: Number(a[m] ?? 0) }));
}

function FicheAbonneInner() {
  const { run } = useAnalysis();
  const { id } = useParams();
  const navigate = useNavigate();
  const axis = useAxisColors();
  if (!run) return null;

  const abonne = useMemo(() => {
    if (id) return run.abonnes.find((a) => a.abonne_id === id) || run.abonnes[0];
    return run.abonnes[0];
  }, [run.abonnes, id]);

  const top = run.abonnes.slice(0, 12);

  return (
    <div className="gl-page">
      <PageHeader icon={IconUser} kicker="Investigations" title={abonne.abonne_id}>
        <select
          className="gl-field px-3 py-2 text-sm min-w-[240px]"
          value={abonne.abonne_id}
          onChange={(e) => navigate(`/app/abonnes/${e.target.value}`)}
        >
          {run.abonnes.map((a) => (
            <option key={a.abonne_id} value={a.abonne_id}>
              {a.abonne_id} ({a.score_risque.toFixed(0)})
            </option>
          ))}
        </select>
      </PageHeader>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <div className="gl-panel p-3 h-fit lg:sticky lg:top-4">
          <p className="text-xs font-semibold text-muted px-2 mb-2">
            Triés par score
          </p>
          <ul className="space-y-0.5 max-h-[62vh] overflow-auto gl-sidebar-scroll">
            {top.map((a) => {
              const active = a.abonne_id === abonne.abonne_id;
              return (
                <li key={a.abonne_id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/abonnes/${a.abonne_id}`)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm ${
                      active ? "bg-amber-soft border border-amber" : "hover:bg-[var(--panel-muted)]"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-mono font-semibold truncate">{a.abonne_id}</span>
                      <span className={`font-mono font-bold ${a.score_risque >= 80 ? "text-danger" : "text-amber-dark"}`}>
                        {a.score_risque.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted truncate">{a.poste_id}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="grid md:grid-cols-3 gap-3">
            <KpiCard
              color={abonne.score_risque >= 80 ? COLORS.red : COLORS.amber}
              label="Score de risque"
              value={`${abonne.score_risque.toFixed(0)} sur 100`}
              note={abonne.motif_principal}
            />
            <KpiCard
              color={COLORS.green}
              label="Gain estimé si confirmé"
              value={Math.round(abonne.gain_estime_fcfa_an).toLocaleString("fr-FR")}
              note="FCFA par an"
            />
            <KpiCard color={COLORS.lblue} label="Poste" value={abonne.poste_id} note="voir sur la carte réseau" />
          </div>

          <div className="gl-panel p-5">
            <h3 className="gl-section-title mb-3">Consommation mensuelle, {abonne.poste_id}</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series(abonne)}>
                  <CartesianGrid stroke={axis.grid} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: axis.muted }} />
                  <YAxis tick={{ fontSize: 12, fill: axis.muted }} unit=" kWh" />
                  <Tooltip formatter={(v: number) => [`${v} kWh`, "Consommation"]} contentStyle={tooltipStyle(axis)} />
                  <Line type="monotone" dataKey="kwh" stroke={COLORS.blue} strokeWidth={3} dot={{ fill: COLORS.amber, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-edge bg-[var(--panel-muted)] px-4 py-3 text-sm text-ink">
            Priorité d'inspection, pas une accusation. Ce score doit être vérifié sur le terrain avant toute action.
          </div>
          {abonne.is_fraud_verite_terrain && (
            <p className="text-xs text-muted">
              Donnée de démonstration : cet abonné porte un pattern de fraude injecté volontairement dans le jeu
              synthétique.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FicheAbonne() {
  return (
    <RequireRun>
      <FicheAbonneInner />
    </RequireRun>
  );
}

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RequireRun from "../components/RequireRun";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import { IconDashboard } from "../components/icons";
import { useAnalysis } from "../lib/analysis";
import { COLORS, MOTIF_COLORS, ZONE_COLOR, lossColor, tooltipStyle, useAxisColors } from "../lib/colors";
import { formatFcfa, formatFcfaFull, formatPct } from "../lib/format";

function VueEnsembleInner() {
  const { run } = useAnalysis();
  const navigate = useNavigate();
  const axis = useAxisColors();
  if (!run) return null;

  const barData = useMemo(
    () =>
      [...run.postes]
        .sort((a, b) => a.taux_perte_pct - b.taux_perte_pct)
        .map((p) => ({ ...p, label: p.nom })),
    [run.postes]
  );

  const pieData = useMemo(() => {
    const counts = new Map<string, number>();
    run.abonnes
      .filter((a) => a.score_risque >= 60)
      .forEach((a) => counts.set(a.motif_principal, (counts.get(a.motif_principal) || 0) + 1));
    return [...counts.entries()].map(([name, value]) => ({ name, value }));
  }, [run.abonnes]);

  return (
    <div className="gl-page">
      <PageHeader icon={IconDashboard} kicker="Console" title="Vue d'ensemble">
        {run.source === "import" && (
          <span className="gl-badge border border-edge text-green">
            moteur recalculé sur import, {run.summary.n_postes} postes
          </span>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          color={COLORS.lblue}
          label="Postes suivis"
          value={String(run.summary.n_postes)}
          note={`${run.summary.n_abonnes} abonnés couverts`}
        />
        <KpiCard
          color={COLORS.amber}
          label="Perte moyenne réseau"
          value={formatPct(run.summary.perte_moy)}
          note="toutes zones confondues"
        />
        <KpiCard
          color={COLORS.red}
          label="Alertes prioritaires"
          value={String(run.summary.n_alertes)}
          note="score de risque ≥ 80"
        />
        <KpiCard
          color={COLORS.green}
          label="Gain récupérable estimé"
          value={formatFcfa(run.summary.gain_total)}
          note="FCFA par an, si zones traitées"
        />
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 mb-4">
        <div className="gl-panel p-5">
          <h3 className="gl-section-title mb-3">Postes classés par taux de perte</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid stroke={axis.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: axis.muted }} unit="%" />
                <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12, fill: axis.txt }} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)} %`, "Taux de perte"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.poste_id}
                  contentStyle={tooltipStyle(axis)}
                />
                <Bar dataKey="taux_perte_pct" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d) => navigate(`/app/postes/${d.poste_id}`)}>
                  {barData.map((p) => (
                    <Cell key={p.poste_id} fill={lossColor(p.taux_perte_pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gl-panel p-5">
          <h3 className="gl-section-title mb-3">Répartition des alertes par motif</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={MOTIF_COLORS[i % MOTIF_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle(axis)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-xs text-muted">
            {pieData.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: MOTIF_COLORS[i % MOTIF_COLORS.length] }} />
                {d.name}, {d.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gl-panel p-5">
        <h3 className="gl-section-title mb-2">Zones les plus critiques</h3>
        {run.zones.slice(0, 3).map((z) => (
          <button
            key={z.zone_id}
            type="button"
            onClick={() => navigate("/app/carte")}
            className="w-full flex items-center justify-between py-3 border-b border-edge last:border-0 text-left"
          >
            <div>
              <b>Zone {z.zone_id}</b>
              <span className="text-muted text-xs">, {z.postes}, {z.n_abonnes} abonnés</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-amber-dark font-bold text-sm">{formatFcfaFull(z.gain_estime_fcfa_an)}</span>
              <span className="gl-badge text-white" style={{ background: ZONE_COLOR[z.intensite] }}>
                {z.intensite}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VueEnsemble() {
  return (
    <RequireRun>
      <VueEnsembleInner />
    </RequireRun>
  );
}

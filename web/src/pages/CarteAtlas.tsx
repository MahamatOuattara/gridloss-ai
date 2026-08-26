import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RequireRun from "../components/RequireRun";
import NetworkMap from "../components/NetworkMap";
import PageHeader from "../components/PageHeader";
import { IconMap } from "../components/icons";
import { useAnalysis } from "../lib/analysis";
import { ZONE_COLOR } from "../lib/colors";
import { formatFcfaFull } from "../lib/format";

function CarteInner() {
  const { run } = useAnalysis();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  if (!run) return null;

  return (
    <div className="gl-page">
      <PageHeader icon={IconMap} kicker="Localisation" title="Carte réseau" />

      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-4">
        <div className="gl-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="gl-section-title">Carte du réseau</h3>
            <div className="flex flex-wrap gap-2">
              <span className="gl-badge border border-edge text-blue">moins de 8%</span>
              <span className="gl-badge border border-edge text-amber">8-13%</span>
              <span className="gl-badge border border-edge text-danger">critique, plus de 13%</span>
            </div>
          </div>
          <NetworkMap
            postes={run.postes}
            topologie={run.topologie}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id);
              navigate(`/app/postes/${id}`);
            }}
          />
          <p className="text-xs text-muted mt-2">
            Liaisons reconstituées par arbre couvrant minimal sur la position des postes, à remplacer par le plan réel
            des départs CIE.
          </p>
          {run.image && (
            <div className="mt-4 rounded-lg border border-edge overflow-hidden">
              <p className="text-xs font-semibold px-3 py-2 bg-[var(--panel-muted)]">
                Imagerie aérienne, {run.image.name}
              </p>
              <img src={run.image.preview_data_url} alt={run.image.name} className="max-h-56 w-full object-contain bg-navy" />
            </div>
          )}
        </div>

        <div className="gl-panel p-5">
          <h3 className="gl-section-title mb-3">Atlas des zones de pertes</h3>
          <div className="space-y-3">
            {run.zones.map((z) => (
              <div key={z.zone_id} className="rounded-lg border border-edge p-3 bg-[var(--panel-muted)]">
                <div className="flex justify-between items-center">
                  <b>Zone {z.zone_id}</b>
                  <span className="gl-badge text-white" style={{ background: ZONE_COLOR[z.intensite] }}>
                    {z.intensite}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">
                  {z.postes}, {z.n_abonnes} abonnés
                </p>
                <p className="font-mono text-amber-dark font-bold text-lg mt-2">{formatFcfaFull(z.gain_estime_fcfa_an)}</p>
                <p className="text-[10px] text-muted">gain estimé si la zone est traitée</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-4">Halo coloré = intensité de la zone, nœud = taux de perte du poste.</p>
          <div className="mt-2 text-[11px] text-muted">Cliquez un poste pour ouvrir sa fiche.</div>
        </div>
      </div>
    </div>
  );
}

export default function CarteAtlas() {
  return (
    <RequireRun>
      <CarteInner />
    </RequireRun>
  );
}

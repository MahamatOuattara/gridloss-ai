import { useMemo } from "react";
import { Edge, Poste } from "../lib/api";
import { lossColor, ZONE_COLOR } from "../lib/colors";

type Props = {
  postes: Poste[];
  topologie: Edge[];
  selectedId?: string | null;
  onSelect?: (posteId: string) => void;
};

export default function NetworkMap({ postes, topologie, selectedId, onSelect }: Props) {
  const W = 720;
  const H = 480;
  const pad = 48;
  const xMin = 0;
  const xMax = 8;
  const yMin = 1.2;
  const yMax = 5.6;

  const project = (x: number, y: number) => {
    const px = pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
    const py = pad + ((yMax - y) / (yMax - yMin)) * (H - 2 * pad);
    return [px, py] as const;
  };

  const nodes = useMemo(
    () =>
      postes.map((p) => {
        const [cx, cy] = project(p.x, p.y);
        return { ...p, cx, cy, r: 9 + p.taux_perte_pct * 0.45 };
      }),
    [postes]
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-ink" role="img" aria-label="Carte du réseau">
      {nodes.map((p) => (
        <circle
          key={`halo-${p.poste_id}`}
          cx={p.cx}
          cy={p.cy}
          r={42}
          fill={ZONE_COLOR[p.intensite] || "#888"}
          opacity={0.14}
        />
      ))}
      {topologie.map((e, i) => {
        const [x1, y1] = project(e.xa, e.ya);
        const [x2, y2] = project(e.xb, e.yb);
        return (
          <line
            key={`e-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={lossColor(e.perte_moy_pct)}
            strokeWidth={3}
            opacity={0.85}
          />
        );
      })}
      {nodes.map((p) => {
        const active = selectedId === p.poste_id;
        return (
          <g
            key={p.poste_id}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={() => onSelect?.(p.poste_id)}
          >
            <circle
              cx={p.cx}
              cy={p.cy}
              r={p.r + (active ? 3 : 0)}
              fill={lossColor(p.taux_perte_pct)}
              stroke={active ? "#FF6600" : "#8EC0E8"}
              strokeWidth={active ? 3 : 1.2}
            />
            <text
              x={p.cx}
              y={p.cy + p.r + 16}
              textAnchor="middle"
              fill="currentColor"
              fontSize={13}
              fontWeight={700}
              fontFamily='"Source Sans 3", sans-serif'
            >
              {p.nom}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

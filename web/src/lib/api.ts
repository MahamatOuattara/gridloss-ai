const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText;
    try {
      const body = JSON.parse(text) as { detail?: unknown };
      if (typeof body.detail === "string") message = body.detail;
      else if (text) message = text;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  return res.json();
}

export type Intensite = "Faible" | "Moyenne" | "Critique";

export type Poste = {
  poste_id: string;
  nom: string;
  x: number;
  y: number;
  n_abonnes: number;
  taux_perte_pct: number;
  perte_technique_estimee_pct: number;
  perte_technique_estimee_kwh: number;
  perte_non_technique_kwh: number;
  perte_non_technique_pct: number;
  gain_estime_fcfa_an: number;
  energie_injectee_kwh: number;
  energie_facturee_kwh: number;
  zone_id: number;
  intensite: Intensite;
  longueur_km: number;
  section_mm2: number;
  charge_moy_A: number;
};

export type Abonne = {
  abonne_id: string;
  poste_id: string;
  score_risque: number;
  motif_principal: string;
  gain_estime_fcfa_an: number;
  is_fraud_verite_terrain: boolean;
  fraud_type_verite_terrain?: string;
  consommation_moyenne_kwh: number;
  jan: number;
  fev: number;
  mar: number;
  avr: number;
  mai: number;
  juin: number;
  juil: number;
  aout: number;
  sept: number;
  oct: number;
  nov: number;
  dec: number;
};

export type Zone = {
  zone_id: number;
  postes: string;
  n_postes: number;
  n_abonnes: number;
  perte_non_technique_kwh: number;
  gain_estime_fcfa_an: number;
  x: number;
  y: number;
  intensite: Intensite;
};

export type Edge = {
  poste_a: string;
  poste_b: string;
  xa: number;
  ya: number;
  xb: number;
  yb: number;
  perte_moy_pct: number;
};

export type AerialImage = {
  name: string;
  width: number;
  height: number;
  size_kb: number;
  preview_data_url: string;
};

export type AnalysisRun = {
  source: "demo" | "import";
  filename?: string | null;
  image: AerialImage | null;
  mode: "data" | "data+image";
  months: string[];
  postes: Poste[];
  abonnes: Abonne[];
  zones: Zone[];
  topologie: Edge[];
  summary: {
    n_postes: number;
    n_abonnes: number;
    perte_moy: number;
    n_alertes: number;
    gain_total: number;
  };
};

export const api = {
  login: (username: string, password: string) =>
    request<{ ok: boolean; username: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),
  demo: () => request<AnalysisRun>("/api/runs/demo"),
  analyze: async (compteurs?: File | null, image?: File | null) => {
    const form = new FormData();
    if (compteurs) form.append("compteurs", compteurs);
    if (image) form.append("image", image);
    return request<AnalysisRun>("/api/runs", { method: "POST", body: form });
  },
  templateUrl: "/api/template.csv",
};

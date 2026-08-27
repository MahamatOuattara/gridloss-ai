export function formatFcfa(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} M`;
  }
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export function formatFcfaFull(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA par an`;
}

export function formatPct(n: number): string {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

export function formatKwh(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} kWh`;
}

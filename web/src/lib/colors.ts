import { useTheme } from "./theme";

export const MONTHS = ["jan", "fev", "mar", "avr", "mai", "juin", "juil", "aout", "sept", "oct", "nov", "dec"] as const;

export const COLORS = {
  navy: "#0E1A2B",
  blue: "#4E8FCB",
  lblue: "#4E8FCB",
  amber: "#FF6600",
  amberDk: "#FF6600",
  red: "#C14545",
  green: "#1A9E5C",
  txt: "#0E1A2B",
  muted: "#5A6B80",
  card: "#FFFFFF",
  grid: "#D5DEEA",
};

const LIGHT_AXIS = {
  txt: "#0E1A2B",
  muted: "#5A6B80",
  grid: "#D5DEEA",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#D5DEEA",
  tooltipColor: "#0E1A2B",
};

const DARK_AXIS = {
  txt: "#FFFFFF",
  muted: "#DCE4EF",
  grid: "rgba(255,255,255,0.22)",
  tooltipBg: "#1A2336",
  tooltipBorder: "rgba(255,255,255,0.28)",
  tooltipColor: "#FFFFFF",
};

export function useAxisColors() {
  const { theme } = useTheme();
  return theme === "dark" ? DARK_AXIS : LIGHT_AXIS;
}

export function tooltipStyle(axis: ReturnType<typeof useAxisColors>) {
  return {
    background: axis.tooltipBg,
    border: `1px solid ${axis.tooltipBorder}`,
    color: axis.tooltipColor,
    borderRadius: 8,
    fontSize: 12,
  };
}

export function lossColor(pct: number): string {
  return pct < 8 ? COLORS.lblue : pct < 13 ? COLORS.amber : COLORS.red;
}

export const ZONE_COLOR: Record<string, string> = {
  Faible: COLORS.lblue,
  Moyenne: COLORS.amber,
  Critique: COLORS.red,
};

export const MOTIF_COLORS = [COLORS.amber, COLORS.red, COLORS.lblue, COLORS.green];

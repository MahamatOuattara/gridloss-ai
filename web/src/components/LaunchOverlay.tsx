import { ANALYSIS_STEPS } from "../lib/analysis";
import { IconCheck } from "./icons";

export default function LaunchOverlay({ step }: { step: string | null }) {
  if (!step) return null;
  const idx = ANALYSIS_STEPS.indexOf(step);
  return (
    <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="gl-panel w-full max-w-md p-6 gl-animate">
        <p className="text-[11px] font-bold text-amber-dark">Analyse en cours</p>
        <h2 className="font-display text-xl font-bold mt-1">Pipeline GridLoss AI</h2>
        <ol className="mt-5 space-y-3">
          {ANALYSIS_STEPS.map((s, i) => {
            const done = idx > i;
            const current = idx === i;
            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? "bg-green text-white"
                      : current
                        ? "bg-amber text-white"
                        : "bg-[var(--panel-muted)] text-muted border border-edge"
                  }`}
                >
                  {done ? (
                    <IconCheck className="w-4 h-4" />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${current ? "bg-white" : "bg-muted"}`} />
                  )}
                </span>
                <span className={`text-sm ${current ? "font-semibold text-ink" : "text-muted"}`}>{s}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

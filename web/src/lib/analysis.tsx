import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { api, AnalysisRun } from "./api";

const STEPS = [
  "Bilan énergétique par poste",
  "Séparation technique et non technique",
  "Score de risque par abonné",
  "Atlas des zones",
];

type AnalysisState = {
  run: AnalysisRun | null;
  loading: boolean;
  error: string | null;
  step: string | null;
  loadDemo: () => Promise<AnalysisRun>;
  analyze: (compteurs?: File | null, image?: File | null) => Promise<AnalysisRun>;
  clear: () => void;
};

const AnalysisContext = createContext<AnalysisState | null>(null);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);

  const withProgress = useCallback(async (job: () => Promise<AnalysisRun>) => {
    setLoading(true);
    setError(null);
    try {
      const pending = job();
      for (const s of STEPS) {
        setStep(s);
        await sleep(280);
      }
      const result = await pending;
      setRun(result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      throw e;
    } finally {
      setLoading(false);
      setStep(null);
    }
  }, []);

  const loadDemo = useCallback(() => withProgress(() => api.demo()), [withProgress]);
  const analyze = useCallback(
    (compteurs?: File | null, image?: File | null) => withProgress(() => api.analyze(compteurs, image)),
    [withProgress]
  );

  const value = useMemo<AnalysisState>(
    () => ({
      run,
      loading,
      error,
      step,
      loadDemo,
      analyze,
      clear: () => setRun(null),
    }),
    [run, loading, error, step, loadDemo, analyze]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis hors AnalysisProvider");
  return ctx;
}

export { STEPS as ANALYSIS_STEPS };

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAnalysis } from "../lib/analysis";
import PageHeader from "../components/PageHeader";
import { IconUpload } from "../components/icons";

export default function NouvelleAnalyse() {
  const { run, analyze, loadDemo, loading, error } = useAnalysis();
  const navigate = useNavigate();
  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [dragCsv, setDragCsv] = useState(false);
  const [dragImg, setDragImg] = useState(false);

  const mode = imgFile ? "Données + imagerie" : "Données seules";
  const perimetre = csvFile
    ? `Import personnalisé (${csvFile.name})`
    : run
      ? `Dernier run (${run.summary.n_postes} postes)`
      : "Réseau de démonstration (6 postes)";

  function onCsv(file: File | null) {
    setCsvFile(file);
  }

  function onImg(file: File | null) {
    setImgFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImgPreview(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setImgPreview(null);
    }
  }

  async function launch(useDemo: boolean) {
    if (useDemo) {
      await loadDemo();
    } else {
      await analyze(csvFile, imgFile);
    }
    navigate("/app/resultats");
  }

  return (
    <div className="gl-page">
      <PageHeader icon={IconUpload} kicker="Canal d'entrée" title="Nouveau run">
        {run ? (
          <span className="gl-badge border border-edge text-green">
            run chargé, {run.summary.n_postes} postes, {run.summary.n_abonnes} abonnés
          </span>
        ) : (
          <span className="gl-badge border border-edge text-muted">aucun import, jeu de démonstration</span>
        )}
      </PageHeader>

      <p className="text-sm text-muted leading-relaxed -mt-2 mb-6 max-w-none">
        Chargez un fichier compteurs, éventuellement une image aérienne, puis lancez le run. La console calcule le
        bilan, le score de risque et l'atlas, puis range les priorités d'action.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="gl-panel p-5">
          <h3 className="gl-section-title">Canal 1, compteurs</h3>
          <p className="text-sm text-muted mt-1">
            Un seul fichier CSV ou Excel : une ligne par abonné, infos poste répétées sur chaque ligne.
          </p>
          <div
            className={`dropzone mt-4 p-6 text-center cursor-pointer ${dragCsv ? "dropzone-active" : ""}`}
            onClick={() => csvRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragCsv(true);
            }}
            onDragLeave={() => setDragCsv(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragCsv(false);
              const f = e.dataTransfer.files[0];
              if (f) onCsv(f);
            }}
          >
            <input
              ref={csvRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => onCsv(e.target.files?.[0] || null)}
            />
            {csvFile ? (
              <div className="text-left rounded-lg border border-edge bg-[var(--panel-muted)] p-3">
                <p className="text-sm font-semibold">{csvFile.name}</p>
                <p className="font-mono text-xs text-muted mt-1">{Math.round(csvFile.size / 1024)} Ko</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Déposez un CSV ou XLSX, ou cliquez pour parcourir</p>
            )}
          </div>
          <a href={api.templateUrl} className="text-xs text-blue mt-3 inline-block">
            Télécharger le modèle (jeu de démonstration)
          </a>
        </div>

        <div className="gl-panel p-5">
          <h3 className="gl-section-title">Canal 2, imagerie</h3>
          <p className="text-sm text-muted mt-1">
            Satellite, drone ou orthophoto d'un départ, complément pour repérer des branchements à vérifier.
          </p>
          <div
            className={`dropzone mt-4 p-6 text-center cursor-pointer ${dragImg ? "dropzone-active" : ""}`}
            onClick={() => imgRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragImg(true);
            }}
            onDragLeave={() => setDragImg(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragImg(false);
              const f = e.dataTransfer.files[0];
              if (f) onImg(f);
            }}
          >
            <input
              ref={imgRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => onImg(e.target.files?.[0] || null)}
            />
            {imgPreview ? (
              <div>
                <img src={imgPreview} alt="Aperçu aérien" className="max-h-40 mx-auto rounded-lg" />
                <p className="text-xs text-muted mt-2">{imgFile?.name}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Optionnel : PNG ou JPG pour activer le mode « Données + imagerie »</p>
            )}
          </div>
        </div>
      </div>

      <div className="gl-panel p-5 mb-5">
        <h3 className="gl-section-title">Paramètres du run</h3>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <label className="text-sm">
            <span className="text-xs font-semibold text-muted">Périmètre</span>
            <select disabled className="gl-field mt-1 w-full px-3 py-2 text-sm">
              <option>{perimetre}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-muted">
              Mode d'analyse
            </span>
            <div className="mt-2 text-sm font-semibold">{mode}</div>
          </label>
          <label className="text-sm">
            <span className="text-xs font-semibold text-muted">Période</span>
            <select disabled className="gl-field mt-1 w-full px-3 py-2 text-sm">
              <option>Année de référence (12 mois : jan à déc)</option>
            </select>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-danger mb-3">{error}</p>}

      <div className="flex flex-col items-stretch gap-2">
        <button
          type="button"
          className="gl-btn-primary w-full py-3 text-base"
          disabled={loading}
          onClick={() => void launch(false)}
        >
          {csvFile ? "Lancer le run sur l'import" : "Lancer le run de démonstration"}
        </button>
        {csvFile && (
          <button type="button" className="gl-btn-ghost w-full" disabled={loading} onClick={() => void launch(true)}>
            Ignorer l'import, rejouer la démo
          </button>
        )}
        <p className="text-xs text-muted">
          Bilan énergétique, séparation technique et non technique, score de risque, atlas des zones.
        </p>
      </div>
    </div>
  );
}

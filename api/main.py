"""GridLoss AI — API FastAPI (enveloppe mince autour de engine.py)."""

from __future__ import annotations

import base64
import json
import sys
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402
from engine import (  # noqa: E402
    MONTHS,
    UNIFIED_REQUIRED,
    run_from_frames,
    run_pipeline,
    split_unified_dataset,
    validate_columns,
)

app = FastAPI(
    title="GridLoss AI",
    description="Localisation et qualification des pertes non techniques, SIREXE 2026",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginIn(BaseModel):
    username: str
    password: str


def _records(df: pd.DataFrame) -> list[dict]:
    return json.loads(df.to_json(orient="records"))


def _pack(result: dict, source: str, filename: str | None = None, image: dict | None = None) -> dict:
    postes = result["postes"].copy()
    zones = result["zones"].copy()
    if "intensite" not in postes.columns:
        postes = postes.merge(zones[["zone_id", "intensite"]], on="zone_id", how="left")

    abonnes = result["abonnes"]
    n_alertes = int((abonnes["score_risque"] >= 80).sum())
    return {
        "source": source,
        "filename": filename,
        "image": image,
        "mode": "data+image" if image else "data",
        "months": MONTHS,
        "postes": _records(postes),
        "abonnes": _records(abonnes),
        "zones": _records(zones),
        "topologie": _records(result["topologie"]),
        "summary": {
            "n_postes": int(len(postes)),
            "n_abonnes": int(postes["n_abonnes"].sum()),
            "perte_moy": float(postes["taux_perte_pct"].mean()),
            "n_alertes": n_alertes,
            "gain_total": float(postes["gain_estime_fcfa_an"].sum()),
        },
    }


def _encode_image(upload: UploadFile, raw: bytes) -> dict:
    try:
        from PIL import Image
        img = Image.open(BytesIO(raw))
        width, height = img.size
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Impossible de lire l'image : {exc}") from exc

    mime = upload.content_type or "image/png"
    b64 = base64.b64encode(raw).decode()
    return {
        "name": upload.filename or "image",
        "width": width,
        "height": height,
        "size_kb": round(len(raw) / 1024),
        "preview_data_url": f"data:{mime};base64,{b64}",
    }


def _read_table(raw: bytes, filename: str) -> pd.DataFrame:
    buf = BytesIO(raw)
    name = filename.lower()
    try:
        if name.endswith((".xlsx", ".xls")):
            df = pd.read_excel(buf)
        else:
            df = pd.read_csv(buf)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Fichier illisible : {exc}") from exc
    df.columns = df.columns.str.strip()
    for col in ("poste_id", "abonne_id"):
        if col in df.columns:
            df[col] = df[col].astype(str)
    return df


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(body: LoginIn):
    if not body.username.strip() or not body.password.strip():
        raise HTTPException(400, "Merci de renseigner un identifiant et un mot de passe.")
    return {"ok": True, "username": body.username.strip()}


@app.get("/api/runs/demo")
def demo_run():
    return _pack(run_pipeline(), source="demo")


@app.post("/api/runs")
async def create_run(
    compteurs: UploadFile | None = File(default=None),
    image: UploadFile | None = File(default=None),
):
    aerial = None
    if image is not None and image.filename:
        aerial = _encode_image(image, await image.read())

    if compteurs is None or not compteurs.filename:
        return _pack(run_pipeline(), source="demo", image=aerial)

    raw = await compteurs.read()
    df = _read_table(raw, compteurs.filename)
    missing = validate_columns(df, UNIFIED_REQUIRED)
    if missing:
        raise HTTPException(400, f"Colonnes manquantes : {', '.join(missing)}")

    postes_df, abonnes_df = split_unified_dataset(df)
    result = run_from_frames(postes_df, abonnes_df)
    return _pack(result, source="import", filename=compteurs.filename, image=aerial)


@app.get("/api/template.csv")
def template_csv():
    """Jeu de démonstration au format d'import unique (une ligne par abonné)."""
    result = run_pipeline()
    postes = result["postes"].rename(columns={"nom": "poste_nom", "x": "poste_x", "y": "poste_y"})
    keep = [
        "poste_id", "poste_nom", "poste_x", "poste_y",
        "longueur_km", "section_mm2", "charge_moy_A",
        "energie_injectee_kwh", "energie_facturee_kwh",
    ]
    merged = result["abonnes"].merge(postes[keep], on="poste_id")
    cols = UNIFIED_REQUIRED + [
        c for c in ("is_fraud_verite_terrain", "fraud_type_verite_terrain") if c in merged.columns
    ]
    buf = merged[cols].to_csv(index=False)
    return Response(
        content=buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=gridloss-demo-compteurs.csv"},
    )

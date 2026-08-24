"""
GridLoss AI — Générateur de données synthétiques
====================================================
Calibré sur une topologie de départ ivoirienne réaliste (6 postes HTA/BT,
~330 abonnés). Certains abonnés reçoivent un pattern de fraude injecté
volontairement (chute brutale, profil plat, écart au voisinage) afin de
pouvoir entraîner et démontrer le moteur de détection sur un jeu de données
dont on connaît la vérité terrain.

Sortie : deux CSV dans ./data/
  - postes.csv   : un poste HTA/BT par ligne
  - abonnes.csv  : un abonné par ligne, avec 12 mois de consommation (kWh)
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
OUT_DIR = Path(__file__).parent / "data"
OUT_DIR.mkdir(exist_ok=True)

MONTHS = ["jan", "fev", "mar", "avr", "mai", "juin", "juil", "aout", "sept", "oct", "nov", "dec"]

# --- Topologie des postes : nom, position (coord. locales, pas de vraies GPS), ---
# --- longueur du départ (km), section du câble (mm2), charge moyenne (A)      ---
POSTES = [
    dict(id="P-101", nom="Port. central", x=1.5, y=3.6, longueur_km=2.1, section_mm2=95, charge_moy_A=180, n_abonnes=70),
    dict(id="P-107", nom="Divo",          x=3.3, y=2.6, longueur_km=4.8, section_mm2=70, charge_moy_A=210, n_abonnes=55),
    dict(id="P-142", nom="Hiré",          x=5.0, y=2.0, longueur_km=9.6, section_mm2=50, charge_moy_A=260, n_abonnes=60),
    dict(id="P-118", nom="Lakota",        x=3.8, y=4.4, longueur_km=3.4, section_mm2=70, charge_moy_A=150, n_abonnes=45),
    dict(id="P-133", nom="Bouaflé",       x=5.6, y=4.8, longueur_km=7.9, section_mm2=50, charge_moy_A=230, n_abonnes=58),
    dict(id="P-129", nom="Oumé",          x=7.0, y=4.1, longueur_km=2.8, section_mm2=95, charge_moy_A=140, n_abonnes=42),
]

# Résistivité effective simplifiée pour l'estimation de perte Joule (ordre de grandeur pédagogique)
# Calibrage choisi pour produire un étalement réaliste de perte technique entre ~3% et ~9%
# selon la longueur, la section et la charge du départ (et non une valeur saturée au plafond).
_SCORE_MIN, _SCORE_MAX = 0.02, 0.25
_FRAC_MIN, _FRAC_MAX = 0.03, 0.09

def techn_loss_fraction(longueur_km, section_mm2, charge_A, tension_V=380):
    """Estimation simplifiée de la perte technique (fraction de l'énergie transportée) :
    un score de contrainte du départ (longueur/section, pondéré par la charge) est
    projeté linéairement sur une plage réaliste de perte technique (3% à 9%)."""
    score = (longueur_km / section_mm2) * (charge_A / 200)
    score = np.clip(score, _SCORE_MIN, _SCORE_MAX)
    frac = _FRAC_MIN + (score - _SCORE_MIN) / (_SCORE_MAX - _SCORE_MIN) * (_FRAC_MAX - _FRAC_MIN)
    return float(frac)


def gen_abonne_series(base_kwh, fraud_type=None):
    """12 mois de consommation avec saisonnalité légère + bruit, et pattern de fraude optionnel."""
    season = 1 + 0.08 * np.sin(np.linspace(0, 2 * np.pi, 12))
    series = base_kwh * season * RNG.normal(1.0, 0.06, 12)

    if fraud_type == "chute_brutale":
        # chute nette et durable à partir d'un mois aléatoire (mois 3 à 8)
        t0 = RNG.integers(3, 9)
        drop = RNG.uniform(0.35, 0.55)
        series[t0:] *= (1 - drop)
    elif fraud_type == "profil_plat":
        # consommation anormalement stable, très inférieure à la normale attendue pour ce profil
        flat_level = base_kwh * RNG.uniform(0.35, 0.5)
        series = np.full(12, flat_level) * RNG.normal(1.0, 0.015, 12)
    elif fraud_type == "ecart_voisinage":
        # légèrement sous la normale tout le long, difficile à voir mois par mois
        series *= RNG.uniform(0.55, 0.68)

    return np.round(np.clip(series, 5, None), 1)


def build():
    postes_rows = []
    abonnes_rows = []

    for p in POSTES:
        frac_technique = techn_loss_fraction(p["longueur_km"], p["section_mm2"], p["charge_moy_A"])

        # Base de consommation par abonné (résidentiel/petit commerce), légère hétérogénéité
        base_levels = RNG.gamma(shape=4.0, scale=22, size=p["n_abonnes"]) + 15

        # Taux de fraude variable selon le poste (certains départs bien plus touchés)
        fraud_rate = {"P-142": 0.16, "P-133": 0.12}.get(p["id"], 0.05)
        n_fraud = int(round(p["n_abonnes"] * fraud_rate))
        fraud_types = RNG.choice(
            ["chute_brutale", "profil_plat", "ecart_voisinage"], size=n_fraud, p=[0.45, 0.30, 0.25]
        )
        is_fraud = np.array([False] * p["n_abonnes"])
        fraud_idx = RNG.choice(p["n_abonnes"], size=n_fraud, replace=False)
        is_fraud[fraud_idx] = True

        abonne_series_list = []
        fraud_ptr = 0
        for i in range(p["n_abonnes"]):
            if is_fraud[i]:
                ftype = fraud_types[fraud_ptr]
                fraud_ptr += 1
            else:
                ftype = None
            s = gen_abonne_series(base_levels[i], ftype)
            abonne_series_list.append((s, ftype))

        # Énergie injectée en tête = somme facturée + perte technique + perte non technique réelle (fraude)
        total_facture_annuel = sum(s.sum() for s, _ in abonne_series_list)
        # énergie "perdue" par la fraude = ce que les abonnés fraudeurs auraient normalement consommé en plus
        perte_fraude_annuelle = sum(
            (base_levels[i] * 12 * 1.0 - abonne_series_list[i][0].sum())
            for i in range(p["n_abonnes"]) if is_fraud[i]
        )
        perte_fraude_annuelle = max(perte_fraude_annuelle, 0)

        energie_injectee_annuelle = (total_facture_annuel + perte_fraude_annuelle) / (1 - frac_technique)
        perte_technique_annuelle = energie_injectee_annuelle * frac_technique

        postes_rows.append(dict(
            poste_id=p["id"], nom=p["nom"], x=p["x"], y=p["y"],
            longueur_km=p["longueur_km"], section_mm2=p["section_mm2"], charge_moy_A=p["charge_moy_A"],
            n_abonnes=p["n_abonnes"],
            energie_injectee_kwh=round(energie_injectee_annuelle, 0),
            energie_facturee_kwh=round(total_facture_annuel, 0),
            perte_technique_kwh=round(perte_technique_annuelle, 0),
        ))

        for i in range(p["n_abonnes"]):
            s, ftype = abonne_series_list[i]
            row = dict(
                abonne_id=f"CI-24-{p['id'][-3:]}-{i:03d}",
                poste_id=p["id"],
                is_fraud_verite_terrain=bool(is_fraud[i]),
                fraud_type_verite_terrain=ftype if ftype else "",
            )
            for m, val in zip(MONTHS, s):
                row[m] = val
            abonnes_rows.append(row)

    postes_df = pd.DataFrame(postes_rows)
    abonnes_df = pd.DataFrame(abonnes_rows)

    postes_df.to_csv(OUT_DIR / "postes.csv", index=False)
    abonnes_df.to_csv(OUT_DIR / "abonnes.csv", index=False)
    print(f"postes.csv  : {len(postes_df)} lignes")
    print(f"abonnes.csv : {len(abonnes_df)} lignes ({abonnes_df['is_fraud_verite_terrain'].sum()} fraudes injectées)")
    return postes_df, abonnes_df


if __name__ == "__main__":
    build()

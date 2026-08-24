# GridLoss AI

Localisation et qualification des pertes non techniques du réseau électrique —
prototype réalisé pour le SIREXE Hackathon 2026 (Prix Thématique · Défi Énergie).

GridLoss AI transforme les données de comptage — et, si disponible, une image
aérienne du départ — en priorités d'action : les postes et abonnés à
investiguer en premier, avec un gain estimé.

> ⚠️ Prototype de démonstration sur **données synthétiques**. Les captures,
> chiffres et abonnés/postes générés ne représentent aucune donnée réelle de
> la CIE ou de CI-Energies.

## Fonctionnalités

- **Bilan énergétique par poste** — séparation perte technique / non technique
  (modèle physique simplifié)
- **Score de risque par abonné** — détection de fraude (RandomForest supervisé
  sur données de démonstration, IsolationForest en absence de vérité terrain)
- **Atlas des zones** — clustering géographique des postes (K-means), classé
  par intensité de perte
- **Détection géométrique de branchements** — transformée de Hough +
  réconciliation avec le référentiel réseau, sur imagerie aérienne
  *(canal image : upload et aperçu fonctionnels ; la détection Hough est
  démontrée séparément, pas encore branchée sur l'écran d'analyse — voir
  feuille de route)*
- **Import d'un fichier unique** — un seul CSV/XLSX (une ligne par abonné,
  poste rattaché) suffit à relancer tout le moteur, plus besoin de fichiers
  séparés postes/abonnés
- **Interface Streamlit** — connexion, nouvelle analyse, tableau de bord
  (vue d'ensemble, carte & atlas, fiche poste, fiche abonné)

## Installation

```bash
git clone <url-du-depot>
cd gridloss-ai
python3 -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
```

## Lancer l'application

```bash
streamlit run app.py
```

Ouvre ensuite `http://localhost:8501`. L'écran de connexion accepte n'importe
quelle paire identifiant / mot de passe non vide (prototype de démonstration).

## Format du fichier d'import (données compteurs)

Un seul fichier CSV ou Excel, une ligne par abonné, avec les informations de
son poste répétées sur chaque ligne :

| Colonne | Description |
|---|---|
| `abonne_id`, `poste_id` | identifiants |
| `poste_nom`, `poste_x`, `poste_y` | nom et coordonnées du poste |
| `longueur_km`, `section_mm2`, `charge_moy_A` | caractéristiques physiques du départ |
| `energie_injectee_kwh`, `energie_facturee_kwh` | bilan énergétique du poste |
| `jan` … `dec` | consommation mensuelle de l'abonné (kWh) |

Le poste est reconstruit automatiquement par agrégation (le nombre d'abonnés
est compté, pas besoin de le fournir).

## Structure du projet

```
app.py          interface Streamlit (connexion, écrans, tableau de bord)
engine.py       moteur d'analyse (bilan, séparation, score, atlas)
data_gen.py     génération des données de démonstration synthétiques
data/           postes.csv / abonnes.csv de démonstration
brand/          logo et déclinaisons graphiques
images/         assets divers
```

## Stack technique

Python · Streamlit · pandas · scikit-learn · Plotly · SciPy (atlas des zones,
réconciliation réseau)

## Avertissement

Ce dépôt est un prototype de hackathon. Les données sont synthétiques, le
modèle physique de perte technique est simplifié, et l'intégration avec les
données réelles CIE/CI-Energies reste à valider (voir la feuille de route du
document de candidature).

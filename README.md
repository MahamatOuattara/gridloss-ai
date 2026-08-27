# GridLoss AI

Localisation et qualification des pertes non techniques du réseau électrique.
Prototype pour le SIREXE Hackathon 2026 (Prix Thématique, Défi Énergie).

GridLoss AI transforme les données de comptage (et, si disponible, une image
aérienne du départ) en priorités d'action : les postes et abonnés à
investiguer en premier, avec un gain estimé.

> Prototype de démonstration sur **données synthétiques**. Les captures,
> chiffres et abonnés/postes générés ne représentent aucune donnée réelle de
> la CIE ou de CI-Energies.

## Prérequis

- Python 3.10 ou plus (3.14 OK)
- Node.js 18 ou plus (`node -v` / `npm -v`)
- Git

## Lancer l'app (React + FastAPI)

Il faut **deux terminaux**, tous les deux ouverts à la racine du dépôt
(`gridloss-ai`).

### 1. Cloner et installer le backend

```bash
git clone <url-du-depot>
cd gridloss-ai

python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r api/requirements.txt
```

Si l'activation PowerShell est bloquée :

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Puis relancer `.\.venv\Scripts\Activate.ps1`.

### 2. Terminal A, API

Toujours avec le venv activé, depuis `gridloss-ai` :

```bash
python -m uvicorn api.main:app --reload --port 8001
```

L'API écoute sur [http://127.0.0.1:8001](http://127.0.0.1:8001).
La doc interactive est sur [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs).

Le port **8001** est volontaire : le 8000 est souvent déjà pris par
CommunityMine 360.

Laisse ce terminal ouvert.

### 3. Terminal B, interface

Nouveau terminal, **sans** besoin du venv Python :

```bash
cd gridloss-ai/web
npm install
npm run dev
```

Ouvre l'URL affichée par Vite, en général [http://localhost:5173](http://localhost:5173).

Si 5173 est déjà pris, Vite bascule tout seul (5174, 5175, …). Utilise
l'URL qu'il imprime, le proxy vers l'API reste le même.

### 4. Se connecter

| | |
|---|---|
| Identifiant démo | `jury.sirexe` |
| Mot de passe démo | `demo2026` |

Toute paire identifiant / mot de passe **non vide** fonctionne
(prototype). Bouton **Accéder à la démo** sur le landing pré-remplit les champs.

Puis : **Nouvelle analyse** → **Lancer l'analyse (jeu de démonstration)**
→ Vue d'ensemble, carte, fiches poste et abonné.

### Si ça ne démarre pas

- `ModuleNotFoundError` côté API : le venv n'est pas activé, ou
  `pip install -r api/requirements.txt` n'a pas été lancé.
- Page blanche / erreurs `/api/...` dans la console navigateur : l'API
  (terminal A) n'est pas démarrée, ou elle n'est pas sur le port **8001**.
- `uvicorn` introuvable : utiliser `python -m uvicorn ...` plutôt que
  `uvicorn` tout court.
- Port 8001 déjà pris : changer le port des **deux** côtés
  (`--port 8002` **et** `web/vite.config.ts`, cible du proxy).

## Format du fichier d'import (données compteurs)

Un seul fichier CSV ou Excel, une ligne par abonné, avec les informations de
son poste répétées sur chaque ligne. Un modèle se télécharge depuis l'écran
Nouvelle analyse.

| Colonne | Description |
|---|---|
| `abonne_id`, `poste_id` | identifiants |
| `poste_nom`, `poste_x`, `poste_y` | nom et coordonnées du poste |
| `longueur_km`, `section_mm2`, `charge_moy_A` | caractéristiques physiques du départ |
| `energie_injectee_kwh`, `energie_facturee_kwh` | bilan énergétique du poste |
| `jan` … `dec` | consommation mensuelle de l'abonné (kWh) |

Le poste est reconstruit automatiquement par agrégation (le nombre d'abonnés
est compté, pas besoin de le fournir).

## Fonctionnalités

- **Bilan énergétique par poste** : séparation perte technique / non technique
  (modèle physique simplifié)
- **Score de risque par abonné** : détection de fraude (RandomForest supervisé
  sur données de démonstration, IsolationForest en absence de vérité terrain)
- **Atlas des zones** : clustering géographique des postes (K-means), classé
  par intensité de perte
- **Imagerie aérienne** : upload et aperçu (la détection Hough n'est pas encore
  branchée sur l'écran d'analyse)
- **Import d'un fichier unique** : un seul CSV/XLSX (une ligne par abonné)
- **Interface React** : landing salle de contrôle, connexion, nouvelle analyse,
  tableau de bord (vue d'ensemble, carte et atlas, fiche poste, fiche abonné)

## Structure du projet

```
api/            API FastAPI (login démo, import CSV, pipeline)
web/            interface React + Vite + Tailwind
app.py          ancienne UI Streamlit (optionnelle)
engine.py       moteur d'analyse (bilan, séparation, score, atlas)
data_gen.py     génération des données de démonstration synthétiques
data/           postes.csv / abonnes.csv de démonstration
brand/          logo et déclinaisons graphiques
web/public/hero/  visuels de la landing
```

## Stack

Python, FastAPI, React, Vite, Tailwind, Recharts, pandas, scikit-learn, SciPy.

## Ancienne UI Streamlit (optionnel)

Pas nécessaire pour la démo SIREXE. Si besoin :

```bash
pip install -r requirements.txt
streamlit run app.py
```

Puis [http://localhost:8501](http://localhost:8501).

## Avertissement

Ce dépôt est un prototype de hackathon. Les données sont synthétiques, le
modèle physique de perte technique est simplifié, et l'intégration avec les
données réelles CIE/CI-Energies reste à valider (voir la feuille de route du
document de candidature).

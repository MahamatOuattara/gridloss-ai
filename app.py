import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import base64
from pathlib import Path
from engine import (
    run_pipeline, MONTHS, separer_pertes, detecter_fraude, construire_atlas,
    construire_topologie, UNIFIED_REQUIRED, validate_columns, split_unified_dataset,
)

st.set_page_config(page_title="GridLoss AI", layout="wide", initial_sidebar_state="collapsed", page_icon="⚡")


# Logo — réseau connu (plein) + point détecté non déclaré (pointillé, cerclé)
_BRAND_DIR = Path(__file__).parent / "brand"


def load_custom_logo():
    """Cherche un logo personnalisé nommé 'logo_custom.*' dans brand/ et le
    retourne prêt à insérer dans le HTML (SVG brut ou balise <img> encodée en
    base64 pour PNG/JPG/WEBP). Retourne None si aucun logo custom n'est trouvé,
    pour un repli automatique sur le logo généré par défaut."""
    for ext, mime in [(".svg", None), (".png", "image/png"), (".jpg", "image/jpeg"),
                      (".jpeg", "image/jpeg"), (".webp", "image/webp")]:
        candidate = _BRAND_DIR / f"logo_custom{ext}"
        if candidate.exists():
            if ext == ".svg":
                return candidate.read_text()
            b64 = base64.b64encode(candidate.read_bytes()).decode()
            return f'<img src="data:{mime};base64,{b64}" style="object-fit:contain;display:block;" />'
    return None


def load_custom_logo_tight():
    """Même logo, mais recadré sur son contenu réel (marge blanche retirée) —
    utilisé sur l'écran de connexion pour un rendu mieux centré dans son cadre,
    au lieu de laisser respirer la marge d'origine du fichier source."""
    for ext, mime in [(".png", "image/png"), (".jpg", "image/jpeg"),
                      (".jpeg", "image/jpeg"), (".webp", "image/webp")]:
        candidate = _BRAND_DIR / f"logo_custom{ext}"
        if candidate.exists():
            from PIL import Image as PILImage
            import numpy as _np
            im = PILImage.open(candidate).convert("RGB")
            arr = _np.array(im)
            mask = ~_np.all(arr > 245, axis=2)
            ys, xs = _np.where(mask)
            if len(xs) == 0:
                break
            pad = 14
            left, right = max(0, xs.min() - pad), min(im.width, xs.max() + pad)
            top, bottom = max(0, ys.min() - pad), min(im.height, ys.max() + pad)
            cropped = im.crop((left, top, right, bottom))
            import io
            buf = io.BytesIO()
            cropped.save(buf, format="PNG")
            b64 = base64.b64encode(buf.getvalue()).decode()
            return f'<img src="data:image/png;base64,{b64}" style="object-fit:contain;display:block;" />'
    return None


_custom_logo = load_custom_logo()
HAS_CUSTOM_LOGO = _custom_logo is not None
LOGO_MARK = _custom_logo if _custom_logo else (_BRAND_DIR / "logo_mark.svg").read_text()
LOGO_MARK_TIGHT = load_custom_logo_tight() or LOGO_MARK  # recadré, pour l'écran de connexion
LOGO_MARK_MONO = (_BRAND_DIR / "logo_mark_mono.svg").read_text()  # blanc, pour fond orange (repli, voir note plus bas)

# ---------------------------------------------------------------
# PALETTE — thème clair
# ---------------------------------------------------------------
PAGE_BG = "#FFFFFF"
CARD = "#F4F7FB"
CARD2 = "#FFFFFF"
BORDER = "#E2E8F0"
GRID = "#E9EEF4"
NAVY = "#16315C"       # navy des tableaux CIE (cie.ci/particuliers/tarifs-electricite)
BLUE = "#1C5D99"
LBLUE = "#4E8FCB"
AMBER = "#F8942F"      # orange CIE (boutons CTA, macieenligne.ci)
AMBERDK = "#FF6600"    # orange vif (bandeau d'en-tête, cie.ci)
RED = "#C14545"
GREEN = "#009540"      # vert CIE (cie.ci, sidebar & nav)
TXT = "#1C2B3A"
MUTED = "#5C6B7A"

st.markdown(f"""
<style>
html, body {{ font-size: 17px; }}
.stApp {{ background-color: {PAGE_BG}; color: {TXT}; }}
h1, h2, h3, h4 {{ color: {TXT} !important; }}
[data-testid="stMetricValue"] {{ color: {AMBERDK}; font-size: 1.6rem; }}
[data-testid="stMetricLabel"] {{ color: {MUTED}; font-size: 1rem; }}
.stDataFrame {{ background-color: {CARD2}; font-size: 1rem; }}
div[data-baseweb="tab-list"] {{ gap: 6px; border-bottom: 1px solid {BORDER}; }}
button[data-baseweb="tab"] {{ font-size: 18px; padding: 12px 22px; }}
button[data-baseweb="tab"] p {{ font-size: 18px; }}
label[data-testid="stWidgetLabel"] p {{ font-size: 1rem; }}
div[data-testid="stTextInput"] input {{ font-size: 1rem; }}

/* Header */
.gl-header {{ display:flex; align-items:center; gap:16px; margin-bottom:2px; }}
.gl-logo {{ width:52px; height:52px; border-radius:50%; background:#FFFFFF; border:3px solid {AMBER};
  display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 8px rgba(22,49,92,0.10); }}
.gl-logo svg, .gl-logo img {{ width:30px; height:30px; object-fit:contain; }}
.gl-logo-custom {{ display:inline-flex; align-items:center; justify-content:center; background:#FFFFFF;
  border-radius:14px; border:1px solid {BORDER}; padding:10px 18px; box-shadow:0 2px 10px rgba(22,49,92,0.10); flex-shrink:0; }}
.gl-logo-custom img {{ height:56px; width:auto; max-width:260px; object-fit:contain; display:block; }}
.gl-title {{ font-size:29px; font-weight:800; color:{TXT}; line-height:1.15; }}
.gl-sub {{ font-size:15px; color:{MUTED}; margin-top:3px; }}
.gl-account {{ display:flex; flex-direction:column; align-items:flex-end; justify-content:center; height:50px; gap:8px; }}
.gl-account-name {{ font-size:14px; color:{MUTED}; white-space:nowrap; text-align:right; }}

/* KPI cards */
.kpi-card {{ background:{CARD}; border-radius:12px; padding:18px 20px; height:128px;
  border:1px solid {BORDER}; }}
.kpi-top {{ display:flex; align-items:center; gap:9px; margin-bottom:9px; }}
.kpi-dot {{ width:11px; height:11px; border-radius:50%; flex-shrink:0; }}
.kpi-label {{ font-size:13px; color:{MUTED}; text-transform:uppercase; letter-spacing:0.4px; }}
.kpi-value {{ font-size:32px; font-weight:800; color:{TXT}; }}
.kpi-note {{ font-size:12.5px; color:{MUTED}; margin-top:3px; }}

/* Menu principal (4 rubriques) */
.topmenu-marker {{ display:none; }}
div[data-testid="stElementContainer"]:has(.topmenu-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stHorizontalBlock"] {{
  border-bottom:1px solid {BORDER}; margin-bottom:22px; align-items:stretch; }}
.gl-menu-item {{ text-align:center; padding:13px 4px 11px 4px; font-size:14px; font-weight:700;
  letter-spacing:0.4px; border-bottom:3px solid transparent; white-space:nowrap; }}
.gl-menu-done {{ color:{GREEN}; }}
.gl-menu-active {{ color:{AMBERDK}; border-bottom-color:{AMBER}; }}
.gl-menu-disabled {{ color:{MUTED}; opacity:0.55; }}
.gl-menu-soon {{ font-size:9.5px; font-weight:700; background:{BORDER}; color:{MUTED}; padding:1px 7px;
  border-radius:8px; margin-left:5px; letter-spacing:0; text-transform:none; }}
.gl-menu-btn-marker {{ display:none; }}
div[data-testid="stElementContainer"]:has(.gl-menu-btn-marker) + div[data-testid="stElementContainer"] div.stButton > button {{
  background:transparent !important; color:{MUTED} !important; border:none !important; border-radius:0 !important;
  border-bottom:3px solid transparent !important; font-weight:700 !important; font-size:14px !important;
  letter-spacing:0.4px; padding:13px 4px 11px 4px !important; box-shadow:none !important; width:100%; }}
div[data-testid="stElementContainer"]:has(.gl-menu-btn-marker) + div[data-testid="stElementContainer"] div.stButton > button:hover {{
  color:{AMBERDK} !important; border-bottom-color:{AMBER} !important; background:transparent !important; }}

/* Generic panel card — deux usages : classe directe (div ouverte+fermée dans le même
   appel st.markdown) et marqueur (voir styled_container(), pour envelopper plusieurs
   widgets Streamlit dans une vraie carte) */
.gl-card {{ background:{CARD}; border-radius:12px; padding:18px 20px; margin-bottom:14px; border:1px solid {BORDER}; }}
.gl-card-marker {{ display:none; }}
div[data-testid="stVerticalBlock"]:has(> div[data-testid="stElementContainer"] > div[data-testid="stMarkdown"] .gl-card-marker) {{
  background:{CARD}; border-radius:12px; padding:18px 20px; margin-bottom:14px; border:1px solid {BORDER}; }}
.gl-card-title {{ font-size:17px; font-weight:700; color:{TXT}; margin-bottom:8px; }}
.gl-badge {{ font-size:12px; font-weight:700; padding:4px 12px; border-radius:10px; }}
.gl-pill {{ display:inline-block; font-size:12.5px; font-weight:600; padding:4px 12px;
  border-radius:8px; background:rgba(224,147,46,0.12); color:{AMBERDK}; margin-right:8px; }}

section[data-testid="stSidebar"] {{ display:none; }}
header[data-testid="stHeader"] {{ background: transparent; height: 2.2rem; }}
div[data-testid="stToolbar"] {{ display:none; }}
div[data-testid="stDecoration"] {{ display:none; }}
.block-container {{ padding-top: 2.6rem; padding-bottom: 2rem; padding-left: 2.5rem; padding-right: 2.5rem; max-width: 100%; }}

/* Écran de connexion — version simple, fond clair uni, carte flottante */
.login-marker {{ display:none; }}
div[data-testid="stElementContainer"]:has(.login-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stHorizontalBlock"] {{
  margin:-2.6rem -2.5rem 0 -2.5rem; align-items:stretch; min-height:88vh; position:relative;
  background:#F4F6F9;
}}
div[data-testid="stElementContainer"]:has(.login-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stColumn"] {{
  display:flex; flex-direction:column; box-sizing:border-box; position:relative;
}}
div[data-testid="stElementContainer"]:has(.login-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stColumn"]:nth-of-type(1) {{
  justify-content:center; padding:40px 40px 40px 72px;
}}
div[data-testid="stElementContainer"]:has(.login-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stColumn"]:nth-of-type(2) {{
  justify-content:center; align-items:center; padding:40px 56px;
}}
div[data-testid="stElementContainer"]:has(.login-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stColumn"]:nth-of-type(2) div[data-testid="stTextInput"],
div[data-testid="stElementContainer"]:has(.login-marker) + div[data-testid="stLayoutWrapper"] div[data-testid="stColumn"]:nth-of-type(2) div[data-testid="stButton"] {{
  width:100%; max-width:340px;
}}

.login-scene {{ max-width:460px; }}
.login-scene-logo {{ display:flex; justify-content:flex-start; margin-bottom:26px; }}
.login-scene-logo img {{ max-height:110px; width:auto; display:block; }}
.login-scene-logo svg {{ width:64px; height:64px; }}
.login-scene-title {{ font-size:34px; line-height:1.25; margin-bottom:18px; color:{TXT}; font-weight:400; }}
.login-scene-title b {{ font-weight:800; }}
.login-scene-sub {{ font-size:16px; line-height:1.6; color:{MUTED}; }}
.login-scene-sub b {{ color:{TXT}; font-weight:700; }}

.login-card-marker {{ display:none; }}
div[data-testid="stVerticalBlock"]:has(> div[data-testid="stElementContainer"] > div[data-testid="stMarkdown"] .login-card-marker) {{
  background:#FFFFFF; border-radius:20px; padding:36px 40px 28px 40px; width:100%; max-width:400px;
  box-shadow:0 10px 34px rgba(22,49,92,0.12); }}
.login-card-logo {{ display:flex; justify-content:center; padding-bottom:16px; margin-bottom:20px; border-bottom:1px solid {BORDER}; }}
.login-card-logo img {{ max-height:84px; width:auto; display:block; }}
.login-card-logo svg {{ width:52px; height:52px; }}
.login-field-label {{ font-size:14px; font-weight:700; color:{TXT}; margin-bottom:4px; }}
.login-forgot {{ font-size:13px; color:{BLUE}; text-align:right; margin:6px 0 22px 0; }}
.login-note-pill {{ display:flex; align-items:center; gap:9px; background:{CARD}; border:1px solid {BORDER};
  border-radius:10px; padding:11px 14px; font-size:12px; color:{MUTED}; margin-top:16px; line-height:1.4; }}
.login-note-pill .dot {{ color:{BLUE}; font-size:14px; flex-shrink:0; }}
.login-footer {{ text-align:center; font-size:12px; color:{MUTED}; padding:16px 0 4px 0; }}
div[data-testid="stTextInput"] input {{ border-radius:8px !important; }}
div[data-testid="stTextInput"] input[aria-label="Identifiant"] {{
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF6600'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>");
  background-repeat:no-repeat; background-position:14px center; background-size:17px 17px; padding-left:42px !important; }}
div[data-testid="stTextInput"] input[aria-label="Mot de passe"] {{
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF6600'><path d='M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM8.9 6a3.1 3.1 0 016.2 0v2H8.9V6zM12 17a2 2 0 110-4 2 2 0 010 4z'/></svg>");
  background-repeat:no-repeat; background-position:14px center; background-size:17px 17px; padding-left:42px !important; }}
div.stButton > button {{ background:linear-gradient(90deg,{AMBER},{AMBERDK}); color:#FFFFFF; font-weight:700; border:none; border-radius:8px;
  padding:11px 0; width:100%; font-size:17px; }}
div.stButton > button:hover {{ background:linear-gradient(90deg,{AMBERDK},{AMBER}); color:#FFFFFF; border:none; }}
</style>
""", unsafe_allow_html=True)




def styled_container(marker_class):
    """Ouvre un vrai st.container() et lui applique une classe CSS via un marqueur
    interne ciblé en :has() côté CSS. Contrairement à une simple <div> ouverte dans
    un st.markdown puis refermée plus loin — qui ne fonctionne PAS, Streamlit
    referme chaque appel indépendamment et la div reste vide — ceci enveloppe
    réellement tous les widgets placés à l'intérieur du bloc `with`."""
    c = st.container()
    with c:
        st.markdown(f'<div class="{marker_class}"></div>', unsafe_allow_html=True)
    return c


def render_login():
    st.markdown('<div class="login-marker"></div>', unsafe_allow_html=True)
    left, right = st.columns([1.3, 1], gap="large")

    with left:
        st.markdown(f"""
        <div class="login-scene">
          <div class="login-scene-logo">{LOGO_MARK_TIGHT}</div>
          <div class="login-scene-title"><b>Optimisez</b> votre réseau électrique</div>
          <div class="login-scene-sub">Suivez, localisez et priorisez les pertes non techniques avec <b>GridLoss AI</b>.</div>
        </div>
        """, unsafe_allow_html=True)

    with right:
        with styled_container("login-card-marker"):
            st.markdown(f'<div class="login-card-logo">{LOGO_MARK_TIGHT}</div>', unsafe_allow_html=True)

            st.markdown('<div class="login-field-label">Identifiant</div>', unsafe_allow_html=True)
            username = st.text_input("Identifiant", placeholder="ex. i.kouassi", key="login_user", label_visibility="collapsed")
            st.markdown('<div style="height:14px;"></div>', unsafe_allow_html=True)
            st.markdown('<div class="login-field-label">Mot de passe</div>', unsafe_allow_html=True)
            password = st.text_input("Mot de passe", type="password", placeholder="••••••••", key="login_pwd", label_visibility="collapsed")
            st.markdown('<div class="login-forgot">Mot de passe oublié ?</div>', unsafe_allow_html=True)

            clicked = st.button("SE CONNECTER", use_container_width=True)
            st.markdown('<div class="login-note-pill"><span class="dot">◆</span> Prototype de démonstration — toute paire identifiant / mot de passe non vide fonctionne.</div>', unsafe_allow_html=True)

    if clicked:
        if username.strip() and password.strip():
            st.session_state.authenticated = True
            st.session_state.username = username.strip()
            st.rerun()
        else:
            st.error("Merci de renseigner un identifiant et un mot de passe.")


    st.markdown('<div class="login-footer">SIREXE Hackathon 2026 · Prix Thématique · Défi Énergie</div>', unsafe_allow_html=True)


if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

if not st.session_state.authenticated:
    render_login()
    st.stop()

if "stage" not in st.session_state:
    st.session_state.stage = "accueil"          # "accueil" -> "dashboard" (Analyse en cours / Résultats à venir)
if "custom_data" not in st.session_state:
    st.session_state.custom_data = None


@st.cache_data
def load_default():
    res = run_pipeline()
    return res["postes"], res["abonnes"], res["zones"], res["topologie"]


def read_uploaded_table(uploaded_file):
    """Lit un fichier importé (CSV ou Excel) en DataFrame, quel que soit le format."""
    name = uploaded_file.name.lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(uploaded_file)
    return pd.read_csv(uploaded_file)


ZONE_COLOR = {"Faible": LBLUE, "Moyenne": AMBER, "Critique": RED}


def loss_color(pct):
    return LBLUE if pct < 8 else (AMBER if pct < 13 else RED)


def kpi_card(col, dot_color, label, value, note):
    col.markdown(f"""
    <div class="kpi-card">
      <div class="kpi-top"><div class="kpi-dot" style="background:{dot_color};"></div>
        <div class="kpi-label">{label}</div></div>
      <div class="kpi-value">{value}</div>
      <div class="kpi-note">{note}</div>
    </div>
    """, unsafe_allow_html=True)


# ---------------------------------------------------------------
# EN-TÊTE PARTAGÉ + MENU PRINCIPAL (utilisés par toutes les pages post-connexion)
# ---------------------------------------------------------------
def render_app_header(sub_text, key_suffix):
    col_h1, col_h2 = st.columns([5, 1.3])
    with col_h1:
        header_logo_class = "gl-logo-custom" if HAS_CUSTOM_LOGO else "gl-logo"
        title_html = "" if HAS_CUSTOM_LOGO else '<div class="gl-title">GridLoss AI</div>'
        sub_html = f'<div class="gl-sub">{sub_text}</div>'
        st.markdown(
            f'<div class="gl-header"><div class="{header_logo_class}">{LOGO_MARK}</div>'
            f'<div>{title_html}{sub_html}</div></div>',
            unsafe_allow_html=True
        )
    with col_h2:
        st.markdown(f"""<div class="gl-account-name">Connecté : <b style="color:{TXT};">{st.session_state.get('username','—')}</b></div>""", unsafe_allow_html=True)
        st.markdown('<div style="height:6px;"></div>', unsafe_allow_html=True)
        if st.button("Se déconnecter", key=f"logout_btn_{key_suffix}", use_container_width=True):
            st.session_state.authenticated = False
            st.rerun()
    st.markdown('<div style="height:14px;"></div>', unsafe_allow_html=True)


def render_top_menu(current):
    """Menu principal à 4 rubriques. 'Nouvelle analyse' regroupe Accueil + Analyse en
    cours ; 'Résultats' regroupe Vue d'ensemble, Carte & Atlas, Postes et Abonnés
    (les onglets du tableau de bord). 'Action terrain' arrivera avec l'écran dédié."""
    st.markdown('<div class="topmenu-marker"></div>', unsafe_allow_html=True)
    c1, c2, c3, c4 = st.columns([1.1, 1.5, 1.1, 1.4])

    with c1:
        st.markdown('<div class="gl-menu-item gl-menu-done">✓ CONNEXION</div>', unsafe_allow_html=True)

    with c2:
        if current == "accueil":
            st.markdown('<div class="gl-menu-item gl-menu-active">NOUVELLE ANALYSE</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="gl-menu-btn-marker"></div>', unsafe_allow_html=True)
            if st.button("NOUVELLE ANALYSE", key="menu_go_accueil", use_container_width=True):
                st.session_state.stage = "accueil"
                st.rerun()

    with c3:
        if current == "dashboard":
            st.markdown('<div class="gl-menu-item gl-menu-active">RÉSULTATS</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="gl-menu-btn-marker"></div>', unsafe_allow_html=True)
            if st.button("RÉSULTATS", key="menu_go_dashboard", use_container_width=True):
                st.session_state.stage = "dashboard"
                st.rerun()

    with c4:
        st.markdown('<div class="gl-menu-item gl-menu-disabled">ACTION TERRAIN <span class="gl-menu-soon">bientôt</span></div>', unsafe_allow_html=True)


# =================================================================
# ÉCRAN 2 — ACCUEIL / NOUVELLE ANALYSE
# =================================================================
def render_accueil():
    render_app_header("Préparez vos données puis lancez un nouveau run d'analyse", "accueil")
    render_top_menu("accueil")

    st.markdown(f"""
    <div class="gl-card" style="background:linear-gradient(90deg, rgba(248,148,47,0.08), rgba(248,148,47,0.0));">
      <div style="color:{TXT};font-size:15.5px;line-height:1.6;">
        GridLoss AI transforme vos données de comptage — et, si disponible, une image aérienne du départ —
        en <b>priorités d'action</b> : les postes et abonnés à investiguer en premier, avec un gain estimé.
        <span style="color:{MUTED};"> Donnée → Analyse → Risque → Localisation → Poste → Abonné → Action.</span>
      </div>
    </div>
    """, unsafe_allow_html=True)

    # -------------------------------------------------------
    # Statut des données déjà en mémoire (import précédent, le cas échéant)
    # -------------------------------------------------------
    if st.session_state.custom_data is not None:
        cp, ca, _, _ = st.session_state.custom_data
        st.markdown(f"""<span class="gl-pill" style="background:rgba(0,149,64,0.12);color:{GREEN};">
        ● données importées actives — {len(cp)} postes, {len(ca)} abonnés</span>""", unsafe_allow_html=True)
    else:
        st.markdown(f"""<span class="gl-pill">● aucune donnée importée — le jeu de démonstration sera utilisé</span>""", unsafe_allow_html=True)
    st.markdown("<div style='height:10px;'></div>", unsafe_allow_html=True)

    up_col1, up_col2 = st.columns(2)

    # -------------------------------------------------------
    # CANAL 1 — DONNÉES COMPTEURS INTELLIGENTS (un seul fichier)
    # -------------------------------------------------------
    new_postes_df, new_abonnes_df = None, None
    with up_col1:
        with styled_container("gl-card-marker"):
            st.markdown('<div class="gl-card-title">⚡ Données compteurs intelligents</div>', unsafe_allow_html=True)
            st.caption("Un seul fichier CSV ou Excel : une ligne par abonné, avec les informations de son poste "
                       "(énergie injectée/facturée, longueur, section...) répétées sur chaque ligne — plus besoin "
                       "de fichiers séparés pour les postes et les abonnés.")
            f_compteurs = st.file_uploader("Fichier compteurs (CSV / XLSX)", type=["csv", "xlsx", "xls"], key="up_compteurs")

            if f_compteurs is not None:
                try:
                    df_raw = read_uploaded_table(f_compteurs)
                    missing = validate_columns(df_raw, UNIFIED_REQUIRED)
                    if missing:
                        st.error(f"Colonnes manquantes : {', '.join(missing)}")
                    else:
                        new_postes_df, new_abonnes_df = split_unified_dataset(df_raw)
                except Exception as e:
                    st.error(f"Fichier illisible : {e}")

            if new_postes_df is not None and new_abonnes_df is not None:
                st.markdown('<div style="height:6px;"></div>', unsafe_allow_html=True)
                poste_ids = new_postes_df["poste_id"].astype(str).tolist()
                apercu = ", ".join(poste_ids[:4]) + (f" … (+{len(poste_ids)-4})" if len(poste_ids) > 4 else "")
                mois_presents = [m for m in MONTHS if m in new_abonnes_df.columns]
                periode = f"{mois_presents[0]} → {mois_presents[-1]} ({len(mois_presents)} mois)" if mois_presents else "n/d"
                poids_ko = len(f_compteurs.getvalue()) / 1024
                st.markdown(f"""
                <div style="background:{CARD2};border-radius:9px;padding:10px 14px;border:1px solid {BORDER};">
                  ✅ <b>{f_compteurs.name}</b> — {poids_ko:.0f} Ko<br>
                  <span style="color:{MUTED};font-size:12px;">{len(new_postes_df)} postes · {len(new_abonnes_df)} abonnés ·
                  période {periode} · périmètre : {apercu}</span>
                </div>
                """, unsafe_allow_html=True)

    # -------------------------------------------------------
    # CANAL 2 — IMAGERIE AÉRIENNE
    # -------------------------------------------------------
    new_img = None
    with up_col2:
        with styled_container("gl-card-marker"):
            st.markdown('<div class="gl-card-title">🛰️ Imagerie aérienne</div>', unsafe_allow_html=True)
            st.caption("Satellite, drone ou orthophoto d'un départ — utilisée en complément des données de comptage "
                       "pour repérer des branchements à vérifier.")
            f_img = st.file_uploader("Image aérienne (PNG/JPG)", type=["png", "jpg", "jpeg"], key="up_img")
            if f_img is not None:
                try:
                    from PIL import Image as PILImage
                    pil_img = PILImage.open(f_img)
                    new_img = pil_img
                    poids_ko = len(f_img.getvalue()) / 1024
                    st.markdown(f"""
                    <div style="background:{CARD2};border-radius:9px;padding:10px 14px;border:1px solid {BORDER};">
                      ✅ <b>{f_img.name}</b><br>
                      <span style="color:{MUTED};font-size:12px;">Résolution : {pil_img.width} × {pil_img.height} px · {poids_ko:.0f} Ko</span>
                    </div>
                    """, unsafe_allow_html=True)
                    st.image(pil_img, use_container_width=True)
                except Exception as e:
                    st.error(f"Impossible de lire l'image : {e}")
            else:
                st.markdown(f"""
                <div style="border:2px dashed {BORDER};border-radius:9px;padding:22px 14px;text-align:center;color:{MUTED};font-size:12.5px;">
                  Optionnel — dépose une image pour activer le mode « Données + imagerie »
                </div>
                """, unsafe_allow_html=True)

    # -------------------------------------------------------
    # CONFIGURATION DU RUN
    # -------------------------------------------------------
    with styled_container("gl-card-marker"):
        st.markdown('<div class="gl-card-title">Configuration du run</div>', unsafe_allow_html=True)
        cf1, cf2, cf3 = st.columns(3)
        with cf1:
            if new_postes_df is not None:
                perimetre_label = f"Import personnalisé ({len(new_postes_df)} postes)"
            elif st.session_state.custom_data is not None:
                perimetre_label = f"Import actif ({len(st.session_state.custom_data[0])} postes)"
            else:
                perimetre_label = "Réseau de démonstration (6 postes)"
            st.selectbox("Périmètre", [perimetre_label], disabled=True,
                         help="Un seul périmètre pour ce prototype — le multi-sites arrivera avec les données CIE réelles.")
        with cf2:
            mode_options = ["Données seules"] + (["Données + imagerie"] if new_img is not None else [])
            mode = st.radio("Mode d'analyse", mode_options, horizontal=False,
                            index=len(mode_options) - 1)
        with cf3:
            st.selectbox("Période", ["Année de référence (12 mois : jan → déc)"], disabled=True)

    # -------------------------------------------------------
    # LANCEMENT
    # -------------------------------------------------------
    st.markdown("<div style='height:4px;'></div>", unsafe_allow_html=True)
    launch = st.button("🚀 LANCER L'ANALYSE", use_container_width=True, key="btn_launch_analysis")
    st.markdown(f"""<div style="text-align:center;color:{MUTED};font-size:12px;margin-top:6px;">
    Bilan énergétique → séparation technique / non technique → score de risque → atlas des zones.</div>""",
    unsafe_allow_html=True)

    if launch:
        if new_postes_df is not None and new_abonnes_df is not None:
            with st.spinner("Bilan énergétique, séparation, score de risque, atlas..."):
                postes_sep = separer_pertes(new_postes_df)
                abonnes_scored = detecter_fraude(new_abonnes_df)
                postes_zoned, zones_new = construire_atlas(postes_sep)
                topo_new = construire_topologie(postes_zoned)
                st.session_state.custom_data = (postes_zoned, abonnes_scored, zones_new, topo_new)
        st.session_state.stage = "dashboard"
        st.rerun()


if st.session_state.stage == "accueil":
    render_accueil()
    st.stop()


# =================================================================
# TABLEAU DE BORD (Analyse en cours / Résultats / Carte & Atlas / Postes / Abonnés
# — écrans dédiés à venir ; réunis ici pour le moment)
# =================================================================
if st.session_state.custom_data is not None:
    postes, abonnes, zones, topologie = st.session_state.custom_data
    USING_CUSTOM_DATA = True
else:
    postes, abonnes, zones, topologie = load_default()
    USING_CUSTOM_DATA = False

postes = postes.merge(zones[["zone_id", "intensite"]], on="zone_id", how="left")

render_app_header(
    "Localisation et qualification des pertes non techniques du réseau électrique · prototype sur données synthétiques",
    "dashboard"
)
render_top_menu("dashboard")
st.markdown("<div style='height:6px;'></div>", unsafe_allow_html=True)

tab0, tab1, tab2, tab3 = st.tabs(["📊 Vue d'ensemble", "🗺️ Carte réseau & atlas", "📋 Fiche poste", "👤 Fiche abonné"])

# ---------------------------------------------------------------
# TAB 0 — VUE D'ENSEMBLE
# ---------------------------------------------------------------
with tab0:
    if USING_CUSTOM_DATA:
        st.markdown(f"""<span class="gl-pill" style="background:rgba(0,149,64,0.12);color:{GREEN};">● moteur recalculé sur des données importées — {len(postes)} postes</span>""", unsafe_allow_html=True)
        st.markdown("<div style='height:10px;'></div>", unsafe_allow_html=True)

    total_abonnes = int(postes["n_abonnes"].sum())
    total_gain = float(postes["gain_estime_fcfa_an"].sum())
    n_alertes = int((abonnes["score_risque"] >= 80).sum())
    perte_moy = float(postes["taux_perte_pct"].mean())

    c1, c2, c3, c4 = st.columns(4)
    kpi_card(c1, LBLUE, "Postes suivis", f"{len(postes)}", f"{total_abonnes} abonnés couverts")
    kpi_card(c2, AMBER, "Perte moyenne réseau", f"{perte_moy:.1f}%", "toutes zones confondues")
    kpi_card(c3, RED, "Alertes prioritaires", f"{n_alertes}", "score de risque ≥ 80")
    kpi_card(c4, GREEN, "Gain récupérable estimé", f"{total_gain/1e6:.2f} M", "FCFA / an, si zones traitées")

    st.markdown("<div style='height:16px;'></div>", unsafe_allow_html=True)

    col_a, col_b = st.columns([1.5, 1])
    with col_a:
        with styled_container("gl-card-marker"):
            st.markdown('<div class="gl-card-title">Postes classés par taux de perte</div>', unsafe_allow_html=True)
            pr = postes.sort_values("taux_perte_pct")
            fig0 = go.Figure(go.Bar(
                x=pr["taux_perte_pct"], y=pr["nom"], orientation="h",
                marker=dict(color=[loss_color(v) for v in pr["taux_perte_pct"]]),
                text=[f"{v:.1f}%" for v in pr["taux_perte_pct"]], textposition="outside",
                textfont=dict(color=TXT),
                hovertext=[f"{r['poste_id']} · gain estimé {r['gain_estime_fcfa_an']:,.0f} FCFA/an" for _, r in pr.iterrows()],
                hoverinfo="text"
            ))
            fig0.update_layout(
                plot_bgcolor=CARD, paper_bgcolor=CARD, font=dict(color=TXT, size=15),
                xaxis=dict(title="Taux de perte (%)", gridcolor=GRID, range=[0, pr["taux_perte_pct"].max() * 1.25]),
                yaxis=dict(title=""), height=300, margin=dict(l=10, r=30, t=10, b=30)
            )
            st.plotly_chart(fig0, use_container_width=True)

    with col_b:
        with styled_container("gl-card-marker"):
            st.markdown('<div class="gl-card-title">Répartition des alertes par motif</div>', unsafe_allow_html=True)
            top_alerts = abonnes[abonnes["score_risque"] >= 60]
            counts = top_alerts["motif_principal"].value_counts()
            fig1 = go.Figure(go.Pie(
                labels=counts.index, values=counts.values, hole=0.55,
                marker=dict(colors=[AMBER, RED, LBLUE, GREEN], line=dict(color=CARD2, width=2)),
                textfont=dict(color=NAVY, size=13)
            ))
            fig1.update_layout(
                paper_bgcolor=CARD, plot_bgcolor=CARD, font=dict(color=TXT, size=14),
                showlegend=True, legend=dict(orientation="h", y=-0.15, font=dict(size=12, color=MUTED)),
                height=300, margin=dict(l=10, r=10, t=10, b=10)
            )
            st.plotly_chart(fig1, use_container_width=True)

    with styled_container("gl-card-marker"):
        st.markdown('<div class="gl-card-title">Zones les plus critiques</div>', unsafe_allow_html=True)
        for _, z in zones.head(3).iterrows():
            bc = ZONE_COLOR[z["intensite"]]
            st.markdown(f"""
            <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid {BORDER};">
              <div><b style="color:{TXT};">Zone {z['zone_id']}</b><span style="color:{MUTED};font-size:11.5px;"> · {z['postes']} · {int(z['n_abonnes'])} abonnés</span></div>
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="color:{AMBERDK};font-weight:700;">{z['gain_estime_fcfa_an']:,.0f} FCFA/an</span>
                <span class="gl-badge" style="background:{bc};color:#FFFFFF;">{z['intensite']}</span>
              </div>
            </div>
            """, unsafe_allow_html=True)

# ---------------------------------------------------------------
# TAB 1 — CARTE + ATLAS
# ---------------------------------------------------------------
with tab1:
    col_map, col_side = st.columns([1.6, 1])

    with col_map:
        with styled_container("gl-card-marker"):
            st.markdown(f"""
            <div class="gl-card-title">Carte du réseau</div>
            <span class="gl-pill">● bleu &lt; 8%</span><span class="gl-pill" style="background:rgba(224,147,46,0.14);color:{AMBERDK};">● 8–15%</span><span class="gl-pill" style="background:rgba(193,69,69,0.12);color:{RED};">● critique &gt; 15%</span>
            """, unsafe_allow_html=True)

            fig = go.Figure()

            # halo de zone : tache douce sous chaque poste, colorée par intensité de sa zone
            for _, p in postes.iterrows():
                fig.add_trace(go.Scatter(
                    x=[p["x"]], y=[p["y"]], mode="markers",
                    marker=dict(size=95, color=ZONE_COLOR.get(p["intensite"], "#888"), opacity=0.16),
                    hoverinfo="skip", showlegend=False
                ))

            # liaisons du réseau (arbre couvrant minimal sur les positions des postes)
            for _, e in topologie.iterrows():
                fig.add_trace(go.Scatter(
                    x=[e["xa"], e["xb"]], y=[e["ya"], e["yb"]], mode="lines",
                    line=dict(color=loss_color(e["perte_moy_pct"]), width=3),
                    opacity=0.8, hoverinfo="skip", showlegend=False
                ))

            # postes
            for _, p in postes.iterrows():
                color = loss_color(p["taux_perte_pct"])
                fig.add_trace(go.Scatter(
                    x=[p["x"]], y=[p["y"]], mode="markers+text",
                    marker=dict(size=16 + p["taux_perte_pct"], color=color, line=dict(color=NAVY, width=1.2)),
                    text=[p["nom"]], textposition="bottom center", textfont=dict(color=TXT, size=13.5),
                    hovertext=f"{p['poste_id']} · {p['taux_perte_pct']:.1f}% de perte · gain estimé {p['gain_estime_fcfa_an']:,.0f} FCFA/an · zone {p['intensite'].lower()}",
                    hoverinfo="text", showlegend=False
                ))

            fig.update_layout(
                plot_bgcolor=PAGE_BG, paper_bgcolor=CARD,
                xaxis=dict(visible=False, range=[0, 8]), yaxis=dict(visible=False, range=[1.2, 5.6]),
                height=500, margin=dict(l=10, r=10, t=10, b=10)
            )
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Liaisons reconstituées par arbre couvrant minimal sur la position des postes — à remplacer par le plan réel des départs CIE.")

    with col_side:
        with styled_container("gl-card-marker"):
            st.markdown('<div class="gl-card-title">Atlas des zones de pertes</div>', unsafe_allow_html=True)
            for _, z in zones.iterrows():
                bc = ZONE_COLOR[z["intensite"]]
                st.markdown(f"""
                <div style="background:{CARD2};border-radius:9px;padding:12px 14px;margin-bottom:10px;border:1px solid {BORDER};">
                  <div style="display:flex;justify-content:space-between;">
                    <b style="color:{TXT};">Zone {z['zone_id']}</b>
                    <span class="gl-badge" style="background:{bc};color:#FFFFFF;">{z['intensite']}</span>
                  </div>
                  <div style="color:{MUTED};font-size:11px;margin-top:4px;">{z['postes']} · {int(z['n_abonnes'])} abonnés</div>
                  <div style="color:{AMBERDK};font-size:16px;font-weight:800;margin-top:6px;">{z['gain_estime_fcfa_an']:,.0f} FCFA/an</div>
                  <div style="color:{MUTED};font-size:10px;">gain estimé si la zone est traitée</div>
                </div>
                """, unsafe_allow_html=True)

# ---------------------------------------------------------------
# TAB 2 — FICHE POSTE
# ---------------------------------------------------------------
with tab2:
    poste_sel = st.selectbox("Choisir un poste", postes["poste_id"] + " — " + postes["nom"])
    p = postes[postes["poste_id"] == poste_sel.split(" — ")[0]].iloc[0]

    c1, c2, c3, c4 = st.columns(4)
    kpi_card(c1, loss_color(p["taux_perte_pct"]), "Perte totale", f"{p['taux_perte_pct']:.1f}%", "injecté vs facturé")
    kpi_card(c2, AMBER, "Dont non technique", f"{p['perte_non_technique_pct']:.1f} pts", "résidu à investiguer")
    kpi_card(c3, GREEN, "Gain estimé", f"{p['gain_estime_fcfa_an']:,.0f}", "FCFA / an")
    kpi_card(c4, LBLUE, "Abonnés du poste", f"{int(p['n_abonnes'])}", f"zone {p['intensite'].lower()}")

    st.markdown("<div style='height:14px;'></div>", unsafe_allow_html=True)

    st.markdown(f"""
    <div class="gl-card">
      <div class="gl-card-title">Bilan énergétique</div>
      <div style="color:{MUTED};font-size:13px;line-height:1.7;">
        Injecté : <b style="color:{TXT};">{p['energie_injectee_kwh']:,.0f} kWh</b> ·
        Facturé : <b style="color:{TXT};">{p['energie_facturee_kwh']:,.0f} kWh</b> ·
        Perte technique estimée (modèle physique) : <b style="color:{TXT};">{p['perte_technique_estimee_kwh']:,.0f} kWh</b> ·
        Résidu non expliqué : <b style="color:{AMBERDK};">{p['perte_non_technique_kwh']:,.0f} kWh</b>
      </div>
    </div>
    """, unsafe_allow_html=True)

    with styled_container("gl-card-marker"):
        st.markdown('<div class="gl-card-title">Abonnés prioritaires sur ce poste</div>', unsafe_allow_html=True)
        sub = abonnes[abonnes["poste_id"] == p["poste_id"]].head(10)
        show = sub[["abonne_id", "score_risque", "motif_principal", "gain_estime_fcfa_an"]].rename(columns={
            "abonne_id": "Abonné", "score_risque": "Score de risque", "motif_principal": "Motif", "gain_estime_fcfa_an": "Gain estimé (FCFA/an)"
        })
        st.dataframe(show, use_container_width=True, hide_index=True)

# ---------------------------------------------------------------
# TAB 3 — FICHE ABONNÉ
# ---------------------------------------------------------------
with tab3:
    ab_sel = st.selectbox("Choisir un abonné (triés par score de risque décroissant)", abonnes["abonne_id"])
    a = abonnes[abonnes["abonne_id"] == ab_sel].iloc[0]

    c1, c2, c3 = st.columns(3)
    kpi_card(c1, RED if a["score_risque"] >= 80 else AMBER, "Score de risque", f"{a['score_risque']:.0f} / 100", a["motif_principal"])
    kpi_card(c2, GREEN, "Gain estimé si confirmé", f"{a['gain_estime_fcfa_an']:,.0f}", "FCFA / an")
    kpi_card(c3, LBLUE, "Poste", a["poste_id"], "voir sur la carte réseau")

    st.markdown("<div style='height:14px;'></div>", unsafe_allow_html=True)

    with styled_container("gl-card-marker"):
        st.markdown(f'<div class="gl-card-title">Consommation mensuelle — {a["poste_id"]}</div>', unsafe_allow_html=True)
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=MONTHS, y=[a[m] for m in MONTHS], mode="lines+markers",
                                   line=dict(color=BLUE, width=3), marker=dict(size=7, color=AMBER),
                                   fill="tozeroy", fillcolor="rgba(28,93,153,0.08)"))
        fig2.update_layout(
            plot_bgcolor=CARD, paper_bgcolor=CARD,
            font=dict(color=TXT),
            yaxis=dict(title="kWh", gridcolor=GRID),
            xaxis=dict(gridcolor=GRID),
            height=300, margin=dict(l=10, r=10, t=10, b=10)
        )
        st.plotly_chart(fig2, use_container_width=True)

    st.info("Priorité d'inspection — pas une accusation. Ce score doit être vérifié sur le terrain avant toute action.")

    if a["is_fraud_verite_terrain"]:
        st.caption("🔧 Donnée de démonstration : cet abonné porte un pattern de fraude injecté volontairement dans le jeu de données synthétique, pour la démo.")

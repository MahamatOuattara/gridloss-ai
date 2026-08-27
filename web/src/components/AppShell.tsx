import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useAnalysis } from "../lib/analysis";
import LaunchOverlay from "./LaunchOverlay";
import { LogoMark } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import {
  IconClipboard,
  IconDashboard,
  IconLogout,
  IconMap,
  IconPanelClose,
  IconPanelOpen,
  IconSubstation,
  IconUpload,
  IconUser,
  type NavIcon,
} from "./icons";

type NavItem = { to: string; label: string; icon: NavIcon; badge?: string };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Préparation", items: [{ to: "/app/analyse", label: "Nouveau run", icon: IconUpload }] },
  {
    group: "Console",
    items: [
      { to: "/app/resultats", label: "Vue d'ensemble", icon: IconDashboard },
      { to: "/app/carte", label: "Carte réseau", icon: IconMap },
      { to: "/app/postes", label: "Fiche poste", icon: IconSubstation },
      { to: "/app/abonnes", label: "Fiche abonné", icon: IconUser },
    ],
  },
  {
    group: "Missions",
    items: [{ to: "/app/terrain", label: "Action terrain", icon: IconClipboard, badge: "bientôt" }],
  },
];

const SIDEBAR_KEY = "gridloss-sidebar";

export default function AppShell() {
  const { name, logout } = useAuth();
  const { run, step } = useAnalysis();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "collapsed";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className="h-screen flex flex-col bg-surface text-slate-900 dark:text-white overflow-hidden">
      <LaunchOverlay step={step} />

      <header className="shrink-0 z-30 h-[68px] border-b border-edge bg-[var(--header)]">
        <div className="h-full px-4 md:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-amber-soft border border-edge flex items-center justify-center shrink-0 text-[#0E1A2B] dark:text-white">
              <LogoMark className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold leading-none text-[15px] text-[#0E1A2B] dark:text-white">
                GridLoss AI
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 truncate">Salle de contrôle</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-300">run</p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {run ? `${run.summary.n_alertes} alertes` : "aucun chargé"}
              </p>
            </div>
            <ThemeToggle />
            <div className="rounded-lg border border-edge bg-[var(--panel-muted)] px-3 py-1.5 text-right">
              <p className="text-xs font-semibold truncate max-w-[140px] text-slate-900 dark:text-white">
                {name || "Opérateur"}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-green">en ligne</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className={`hidden md:flex shrink-0 flex-col border-r border-edge bg-[var(--sidebar)] transition-[width] duration-200 ease-out ${
            collapsed ? "w-[72px]" : "w-[248px]"
          }`}
        >
          <nav className={`flex-1 min-h-0 overflow-y-auto gl-sidebar-scroll py-4 ${collapsed ? "px-2" : "px-3"}`}>
            {NAV.map((section) => (
              <div key={section.group} className="mb-5 last:mb-0">
                {!collapsed && (
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300 px-2 mb-2">
                    {section.group}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `flex items-center rounded-md text-sm transition ${
                            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-2 py-2"
                          } ${
                            isActive
                              ? "bg-[var(--panel)] text-slate-900 dark:text-white shadow-sm border border-edge"
                              : "text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-[var(--panel-muted)]"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`flex items-center justify-center shrink-0 ${
                                isActive ? "text-amber" : ""
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </span>
                            {!collapsed && (
                              <>
                                <span className="flex-1 font-medium leading-tight">{item.label}</span>
                                {item.badge ? (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-300">{item.badge}</span>
                                ) : null}
                              </>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className={`shrink-0 border-t border-edge space-y-2 ${collapsed ? "p-2" : "p-3"}`}>
            {!collapsed && run && (
              <p className="text-[10px] px-1 text-slate-500 dark:text-slate-300 leading-relaxed">
                {run.source === "import" ? "import" : "démo"}, {run.summary.n_postes} postes, {run.summary.n_abonnes}{" "}
                abonnés
              </p>
            )}
            <button
              type="button"
              className={`gl-btn-ghost w-full ${collapsed ? "px-0" : ""}`}
              title={collapsed ? "Étendre le menu" : "Réduire le menu"}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? <IconPanelOpen className="w-5 h-5" /> : <IconPanelClose className="w-5 h-5" />}
              {!collapsed && <span>Réduire le menu</span>}
            </button>
            <button
              type="button"
              className={`gl-btn-ghost w-full ${collapsed ? "px-0" : ""}`}
              title="Quitter la console"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <IconLogout className="w-5 h-5" />
              {!collapsed && <span>Quitter la console</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-8 gl-app-main">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-edge bg-[var(--header)] px-2 py-1.5 grid grid-cols-4 gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-200">
        <NavLink
          to="/app/analyse"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 rounded-md ${isActive ? "text-amber" : ""}`
          }
        >
          <IconUpload className="w-5 h-5" />
          Run
        </NavLink>
        <NavLink
          to="/app/resultats"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 rounded-md ${isActive ? "text-amber" : ""}`
          }
        >
          <IconDashboard className="w-5 h-5" />
          Console
        </NavLink>
        <NavLink
          to="/app/carte"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 rounded-md ${isActive ? "text-amber" : ""}`
          }
        >
          <IconMap className="w-5 h-5" />
          Carte
        </NavLink>
        <NavLink
          to="/app/abonnes"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 rounded-md ${isActive ? "text-amber" : ""}`
          }
        >
          <IconUser className="w-5 h-5" />
          Abonnés
        </NavLink>
      </nav>
    </div>
  );
}

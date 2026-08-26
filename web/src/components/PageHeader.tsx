import { ReactNode } from "react";
import type { NavIcon } from "./icons";

export default function PageHeader({
  icon: Icon,
  kicker,
  title,
  children,
}: {
  icon: NavIcon;
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-5 border-b border-edge">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-1 h-10 w-10 rounded-lg border border-edge bg-[var(--panel)] text-amber flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{kicker}</p>
          <h1 className="font-display text-2xl md:text-[1.85rem] font-bold tracking-tight text-slate-900 dark:text-white leading-tight mt-0.5">
            {title}
          </h1>
        </div>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

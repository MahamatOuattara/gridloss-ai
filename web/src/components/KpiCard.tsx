export default function KpiCard({
  label,
  value,
  note,
  color,
}: {
  label: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <div className="gl-kpi">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
        <p className="gl-kpi-label">{label}</p>
      </div>
      <p className="gl-kpi-value">{value}</p>
      <p className="gl-kpi-note">{note}</p>
    </div>
  );
}

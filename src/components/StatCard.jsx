function StatCard({ label, value, trend }) {
  return (
    <article className="card-surface fade-slide-in group relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-accent via-brand-secondary to-transparent opacity-70" />
      <p className="text-sm font-medium text-brand-muted">{label}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-brand-text">{value}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-accent">
        {trend}
      </p>
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-brand-secondary/20 blur-2xl transition duration-300 group-hover:opacity-90" />
    </article>
  );
}

export default StatCard;

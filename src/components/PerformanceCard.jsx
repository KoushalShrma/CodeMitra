const performanceRows = [
  { label: 'Great Moves', value: 42, color: 'bg-emerald-500' },
  { label: 'Mistakes', value: 7, color: 'bg-amber-400' },
  { label: 'Blunders', value: 2, color: 'bg-rose-500' },
];

function PerformanceCard() {
  const total = performanceRows.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="card-surface fade-slide-in p-6 sm:p-7" style={{ animationDelay: '180ms' }}>
      <h2 className="section-title">Performance Insights</h2>
      <p className="mt-1 text-sm text-brand-muted">Your decision quality this week</p>

      <div className="mt-6 space-y-5">
        {performanceRows.map((row) => {
          const width = `${Math.round((row.value / total) * 100)}%`;

          return (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-brand-muted">{row.label}</span>
                <span className="font-semibold text-brand-text">{row.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-elevated/80">
                <div
                  className={`h-full rounded-full ${row.color} shadow-[0_0_12px_rgba(255,255,255,0.2)]`}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PerformanceCard;

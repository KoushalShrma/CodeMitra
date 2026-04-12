import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#34d399', '#fbbf24', '#f87171'];

function ProgressDistributionChart({ data }) {
  return (
    <div className="premium-card flex h-[320px] flex-col overflow-hidden">
      <div className="mb-2 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
          Verdict Distribution
        </p>
        <h3 className="mt-1 text-base font-semibold text-brand-text">How your runs are landing</h3>
      </div>

      <div className="min-h-0 flex-1 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 17, 36, 0.96)',
                border: '1px solid rgba(129,153,255,0.18)',
                borderRadius: '16px',
                color: '#f2f6ff',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid shrink-0 grid-cols-3 gap-2 text-xs">
        {data.map((entry, index) => (
          <div
            key={entry.name}
            className="rounded-xl border border-brand-border/60 bg-brand-elevated/25 p-2.5"
          >
            <p style={{ color: COLORS[index % COLORS.length] }} className="font-semibold">
              {entry.name}
            </p>
            <p className="mt-1 text-brand-text">{entry.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgressDistributionChart;

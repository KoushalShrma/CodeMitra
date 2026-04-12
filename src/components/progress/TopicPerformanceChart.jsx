import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function getBarColor(value) {
  if (value >= 75) {
    return '#34d399';
  }

  if (value >= 50) {
    return '#fbbf24';
  }

  return '#f87171';
}

function TopicPerformanceChart({ data }) {
  return (
    <div className="premium-card h-[320px]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
          Topic Performance
        </p>
        <h3 className="mt-2 text-lg font-semibold text-brand-text">Strong and weak zones</h3>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(129,153,255,0.1)" strokeDasharray="4 4" />
          <XAxis dataKey="topic" stroke="#8ea1d6" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#8ea1d6"
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 17, 36, 0.96)',
              border: '1px solid rgba(129,153,255,0.18)',
              borderRadius: '16px',
              color: '#f2f6ff',
            }}
            formatter={(value) => [`${value}%`, 'Accuracy']}
          />
          <Bar dataKey="accuracy" radius={[10, 10, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.topic} fill={getBarColor(entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TopicPerformanceChart;

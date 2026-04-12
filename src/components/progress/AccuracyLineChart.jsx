import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function AccuracyLineChart({ data }) {
  return (
    <div className="premium-card h-[320px]">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
          Accuracy Over Time
        </p>
        <h3 className="mt-2 text-lg font-semibold text-brand-text">Consistency curve</h3>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(129,153,255,0.1)" strokeDasharray="4 4" />
          <XAxis dataKey="label" stroke="#8ea1d6" tickLine={false} axisLine={false} />
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
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#4dd7b4"
            strokeWidth={3}
            dot={{ r: 4, fill: '#4dd7b4' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AccuracyLineChart;

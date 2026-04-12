function ServiceCard({ audience, points, accentClass }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/40 p-6 shadow-[0_20px_40px_rgba(3,8,20,0.28)] backdrop-blur-xl">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${accentClass}`}
      >
        {audience}
      </div>
      <div className="mt-5 space-y-3">
        {points.map((point) => (
          <div
            key={point}
            className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"
          >
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-accent" />
            <p className="text-sm leading-6 text-slate-200">{point}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default ServiceCard;

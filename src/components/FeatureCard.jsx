function FeatureCard({ icon, title, description }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_20px_45px_rgba(4,10,26,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-brand-secondary/50 hover:bg-slate-950/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-secondary/25 to-brand-accent/25 text-xl text-brand-text shadow-[0_12px_30px_rgba(73,113,255,0.18)]">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}

export default FeatureCard;

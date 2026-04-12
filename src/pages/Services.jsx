const services = [
  {
    code: 'AI',
    title: 'AI Coding Coach',
    description:
      'Contextual, progressive guidance that nudges you toward the right strategy while preserving independent thinking.',
  },
  {
    code: 'PB',
    title: 'Pattern-based Learning',
    description:
      'Master recurring algorithmic patterns and decision trees to solve unseen variations with confidence.',
  },
  {
    code: 'CP',
    title: 'Coding Practice',
    description:
      'Interactive coding environment with test validation, runtime feedback, and structured progression.',
  },
  {
    code: 'IT',
    title: 'Institutional Testing',
    description:
      'Assessment workflows for schools and training programs with performance insights and integrity checks.',
  },
];

function Services() {
  return (
    <section className="premium-page">
      <header className="premium-hero">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
            Services
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
            Tools designed to accelerate coding growth
          </h1>
          <p className="mt-3 text-sm leading-7 text-brand-muted sm:text-base">
            Every service is built around measurable learning progress, cleaner workflows, and
            stronger problem-solving outcomes.
          </p>
        </div>
      </header>

      <div className="staggered grid gap-5 sm:grid-cols-2">
        {services.map((service) => (
          <article
            key={service.title}
            className="group premium-card bg-gradient-to-b from-brand-surface/85 to-brand-surface/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-secondary/60 bg-brand-secondary/15 text-sm font-semibold text-brand-text transition group-hover:scale-105 group-hover:border-brand-secondary">
                {service.code}
              </div>
              <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                Service
              </span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-brand-text">{service.title}</h2>
            <p className="mt-2 text-sm leading-7 text-brand-muted">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Services;

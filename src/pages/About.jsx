const highlights = [
  {
    title: 'What is CodeMitra',
    description:
      'CodeMitra is a focused coding growth platform designed to help learners progress from syntax to strong problem-solving patterns.',
  },
  {
    title: 'Core Purpose',
    description:
      'We emphasize pattern-based learning and AI-powered guidance so users build intuition, not just memorized solutions.',
  },
  {
    title: 'Key Features',
    description:
      'Smart practice workspace, performance analytics, adaptive hints, and anti-cheat signals that encourage authentic learning.',
  },
];

function About() {
  return (
    <section className="premium-page">
      <header className="premium-hero">
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
            About CodeMitra
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
            A modern learning studio for problem-solving coders
          </h1>
          <p className="mt-3 text-sm leading-7 text-brand-muted sm:text-base">
            We blend deep practice, AI mentorship, and structured feedback so every session moves
            you closer to interview-level confidence.
          </p>
        </div>
      </header>

      <div className="staggered grid gap-5 lg:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="premium-card">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-secondary/60 bg-brand-secondary/15 text-sm font-semibold text-brand-text">
              CM
            </div>
            <h2 className="text-lg font-semibold text-brand-text">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-brand-muted">{item.description}</p>
          </article>
        ))}
      </div>

      <section className="premium-card">
        <h2 className="text-lg font-semibold text-brand-text">Why learners choose CodeMitra</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-border/65 bg-brand-elevated/30 p-4">
            <p className="text-sm font-semibold text-brand-text">Pattern-first roadmap</p>
            <p className="mt-1 text-sm text-brand-muted">
              Build reusable solving frameworks instead of isolated one-off tricks.
            </p>
          </div>
          <div className="rounded-xl border border-brand-border/65 bg-brand-elevated/30 p-4">
            <p className="text-sm font-semibold text-brand-text">AI hints with control</p>
            <p className="mt-1 text-sm text-brand-muted">
              Receive staged guidance that supports thinking without exposing full answers.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

export default About;

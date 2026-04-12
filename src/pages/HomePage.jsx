import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import ServiceCard from '../components/ServiceCard';

const features = [
  {
    icon: 'AI',
    title: 'AI-Powered Coding Assistant',
    description:
      'Receive guided help that nudges you toward the pattern instead of handing over the final answer.',
  },
  {
    icon: '{}',
    title: 'Pattern-Based Learning',
    description:
      'Practice through structured problem families so concepts stick across interviews and contests.',
  },
  {
    icon: '>>',
    title: 'Real-Time Code Execution',
    description:
      'Run code instantly against meaningful test cases and understand why each attempt passed or failed.',
  },
  {
    icon: '4x',
    title: 'Multi-Language Support',
    description:
      'Write and validate solutions in JavaScript, Python, C++, or Java through one consistent workflow.',
  },
  {
    icon: '!!',
    title: 'Smart Debugging',
    description:
      'Spot weak assumptions faster with structured verdicts, outputs, and attempt-by-attempt feedback.',
  },
  {
    icon: 'XP',
    title: 'Gamified Learning',
    description:
      'Track great moves, streaks, and accuracy so improvement feels visible and motivating every day.',
  },
];

const studentServices = [
  'Practice coding problems with guided hints after genuine effort.',
  'Build interview-ready pattern recognition instead of memorizing isolated solutions.',
  'Track performance trends, mistakes, and streaks in one place.',
  'Prepare with realistic coding tests and clear post-attempt insights.',
];

const instituteServices = [
  'Create coding tests from existing problems or custom challenges.',
  'Run structured assessments with timers, anti-cheating signals, and language support.',
  'Auto-evaluate submissions against test cases using Judge0.',
  'Review leaderboards, reports, and student-level analytics after the test.',
];

const testimonials = [
  {
    name: 'Learner Story',
    role: 'Final Year Student',
    quote:
      "CodeMitra turned random practice into a clear routine. I finally know which patterns I'm weak at and how to improve them.",
  },
  {
    name: 'Institute Story',
    role: 'Placement Coordinator',
    quote:
      'The test workflow feels organized and dependable. It gives us a professional way to run coding rounds and review outcomes quickly.',
  },
  {
    name: 'Bootcamp Story',
    role: 'Bootcamp Learner',
    quote:
      'The feedback feels practical, not intimidating. I can run solutions, inspect mistakes, and keep building confidence.',
  },
];

const steps = ['Register', 'Practice or Create Test', 'Solve Problems', 'Get Insights and Improve'];

function HomePage() {
  return (
    <div className="text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(129,153,255,0.22),transparent_30%),radial-gradient(circle_at_75%_20%,rgba(41,199,162,0.18),transparent_25%),linear-gradient(180deg,rgba(8,13,31,0.96),rgba(4,8,20,1))]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(129,153,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(129,153,255,0.07)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-brand-secondary/35 bg-brand-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-brand-secondary">
                AI-guided coding growth for learners and institutes
              </div>

              <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Master Coding with{' '}
                <span className="bg-gradient-to-r from-brand-secondary via-white to-brand-accent bg-clip-text text-transparent">
                  AI-Powered Guidance
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Learn patterns, not just solutions. Practice smarter with CodeMitra through guided
                hints, live code execution, institutional tests, and rich performance insights.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
                <Link
                  to="/signup"
                  className="rounded-2xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-5 py-4 text-center text-sm font-semibold text-slate-950 shadow-[0_18px_35px_rgba(34,198,163,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Register as Student
                </Link>
                <Link
                  to="/institute-signup"
                  className="rounded-2xl border border-brand-secondary/45 bg-brand-secondary/10 px-5 py-4 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-brand-secondary hover:bg-brand-secondary/15"
                >
                  Register as Institute
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Login as Student
                </Link>
                <Link
                  to="/login?role=institute"
                  className="rounded-2xl border border-white/12 bg-white/5 px-5 py-4 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Login as Institute
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Judge0-powered execution
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Multi-language test system
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                  Reports for students and institutes
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-12 top-12 h-32 w-32 rounded-full bg-brand-secondary/25 blur-3xl" />
              <div className="absolute -right-8 bottom-6 h-40 w-40 rounded-full bg-brand-accent/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_32px_60px_rgba(3,8,20,0.45)] backdrop-blur-2xl">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Session Snapshot
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Focused progress, measured clearly
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Live
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Accuracy</p>
                    <p className="mt-3 text-3xl font-bold text-white">91%</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Across recent practice and assessments.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Verdict Split
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                      <p>Great: 18</p>
                      <p>Mistake: 5</p>
                      <p>Blunder: 2</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-brand-secondary/12 to-brand-accent/10 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                    Institution Flow
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {['Create test', 'Monitor attempts', 'Review analytics'].map((label, index) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                      >
                        <p className="text-xs text-slate-400">Step {index + 1}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-secondary">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Practice, evaluate, and improve with a system built for real coding growth
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-slate-950/45">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
              Services
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One platform designed for both learners and institutions
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ServiceCard
              audience="For Students"
              points={studentServices}
              accentClass="bg-brand-accent/15 text-brand-accent"
            />
            <ServiceCard
              audience="For Institutes"
              points={instituteServices}
              accentClass="bg-brand-secondary/15 text-brand-secondary"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-secondary">
              How It Works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              A clear workflow from first login to measurable improvement
            </h2>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/35 px-5 py-5 shadow-[0_14px_30px_rgba(4,10,26,0.2)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-secondary/25 to-brand-accent/25 text-lg font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-base font-medium text-slate-100">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-slate-950/35">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
              Testimonials
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Early users are already treating CodeMitra like their coding command center
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="rounded-3xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_20px_38px_rgba(4,10,26,0.22)] backdrop-blur-xl"
              >
                <p className="text-sm leading-7 text-slate-300">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;

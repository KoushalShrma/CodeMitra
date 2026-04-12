function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-secondary/35 to-brand-accent/35 text-sm text-brand-accent">
              C
            </span>
            Code<span className="text-brand-accent">Mitra</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            AI-guided coding practice and institution-ready test infrastructure built to help
            learners improve with clarity and confidence.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
            About
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Pattern-driven learning, code execution, test management, and reports in one platform.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
            Contact
          </h3>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>support@codemitra.dev</p>
            <p>+91 90000 00000</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
            GitHub
          </h3>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm text-brand-accent transition hover:text-brand-accentSoft"
          >
            View repository
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        Copyright {new Date().getFullYear()} CodeMitra. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;

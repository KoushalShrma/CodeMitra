function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_25px_rgba(39,190,156,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_32px_rgba(39,190,156,0.45)]"
    >
      {children}
      <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
        &rarr;
      </span>
    </button>
  );
}

export default PrimaryButton;

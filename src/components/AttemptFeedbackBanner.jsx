const typeStyles = {
  'Great Move': {
    text: 'Great Move!',
    className: 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200',
  },
  Mistake: {
    text: 'Mistake!',
    className: 'border-amber-400/45 bg-amber-400/15 text-amber-200',
  },
  Blunder: {
    text: 'Blunder!',
    className: 'border-rose-500/45 bg-rose-500/15 text-rose-200',
  },
};

function AttemptFeedbackBanner({ moveType }) {
  if (!moveType) {
    return null;
  }

  const style = typeStyles[moveType] ?? typeStyles.Blunder;

  return (
    <div
      className={`card-surface animate-[fadeSlideIn_0.35s_ease] border px-4 py-3 text-sm font-semibold ${style.className}`}
      role="status"
      aria-live="polite"
    >
      {style.text}
    </div>
  );
}

export default AttemptFeedbackBanner;

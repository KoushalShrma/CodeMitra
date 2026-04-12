function getInitials(name) {
  if (!name) {
    return 'CM';
  }

  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0].toUpperCase()).join('');
}

function formatJoinedDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatBlock({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-brand-border/65 bg-brand-elevated/35 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function ProfileCard({ user, isLoading, error, onEditClick }) {
  if (isLoading) {
    return (
      <section className="premium-card mx-auto w-full max-w-3xl text-center">
        <p className="text-brand-muted">Loading profile...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="premium-card mx-auto w-full max-w-3xl">
        <p className="status-error m-0">{error}</p>
      </section>
    );
  }

  return (
    <section className="premium-card mx-auto w-full max-w-3xl bg-gradient-to-b from-brand-surface/85 to-brand-surface/60">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-secondary/60 bg-gradient-to-br from-brand-secondary/35 to-brand-accent/35 text-xl font-bold text-brand-text shadow-[0_10px_26px_rgba(17,30,64,0.45)] transition-transform duration-200 hover:scale-[1.02]">
            {user?.profile_image ? (
              <img src={user.profile_image} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span>{getInitials(user?.name)}</span>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-brand-text">
              {user?.name || 'Unnamed User'}
            </h1>
            <p className="text-sm text-brand-muted">{user?.email || 'No email'}</p>
            <p className="text-xs uppercase tracking-widest text-brand-muted/80">
              Joined {formatJoinedDate(user?.created_at)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditClick}
          className="rounded-xl border border-brand-secondary/65 bg-brand-elevated px-4 py-2.5 text-sm font-semibold text-brand-text transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-secondary hover:shadow-[0_8px_20px_rgba(17,30,64,0.4)]"
        >
          Edit Profile
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-brand-border/65 bg-brand-elevated/25 p-4 transition-colors hover:bg-brand-elevated/35">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">Bio</p>
        <p className="mt-2 text-sm leading-7 text-brand-text/90">
          {user?.bio || 'No bio added yet. Click Edit Profile to add one.'}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Great Moves" value={user?.great_moves ?? 0} tone="text-emerald-300" />
        <StatBlock label="Mistakes" value={user?.mistakes ?? 0} tone="text-amber-300" />
        <StatBlock label="Blunders" value={user?.blunders ?? 0} tone="text-rose-300" />
        <StatBlock label="Streak" value={user?.streak ?? 0} tone="text-brand-secondary" />
      </div>
    </section>
  );
}

export default ProfileCard;

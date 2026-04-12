const recentItems = [
  { title: 'Solved Two Sum', meta: 'Easy • 6 minutes ago' },
  { title: 'Completed Binary Search', meta: 'Medium • 1 hour ago' },
  { title: 'Joined Weekly Contest 412', meta: 'Contest • Yesterday' },
];

function ActivityList() {
  return (
    <section className="card-surface fade-slide-in p-6 sm:p-7" style={{ animationDelay: '120ms' }}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="section-title">Recent Activity</h2>
        <button className="text-sm font-medium text-brand-muted transition hover:text-brand-text">
          View all
        </button>
      </div>

      <ul className="space-y-3.5">
        {recentItems.map((item) => (
          <li
            key={item.title}
            className="group rounded-xl border border-brand-border/60 bg-brand-elevated/35 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-secondary/65 hover:bg-brand-elevated/75"
          >
            <p className="font-semibold text-brand-text">{item.title}</p>
            <p className="mt-1 text-sm text-brand-muted">{item.meta}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ActivityList;

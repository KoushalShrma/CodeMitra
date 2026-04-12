import { Skeleton } from '../ui/Skeleton';

/**
 * Route-level skeleton layout used for lazy loaded pages.
 * @returns {JSX.Element} Skeleton page.
 */
export function RouteSkeleton() {
  return (
    <section className="route-skeleton page-main" aria-label="Loading page">
      <Skeleton height="18px" width="120px" />
      <Skeleton height="44px" width="50%" />
      <Skeleton height="18px" width="78%" />
      <Skeleton height="180px" width="100%" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <Skeleton height="160px" width="100%" />
        <Skeleton height="160px" width="100%" />
      </div>
    </section>
  );
}

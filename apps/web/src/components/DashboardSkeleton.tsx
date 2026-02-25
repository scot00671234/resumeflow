export default function DashboardSkeleton() {
  return (
    <section className="panel card dashboard-skeleton">
      <div className="dashboard-stats skeleton-block" style={{ height: 72, marginBottom: "1.5rem" }} />
      <div className="dashboard-create skeleton-block" style={{ height: 52, marginBottom: "1.5rem" }} />
      <div className="resume-cards-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="resume-card skeleton-card">
            <div className="skeleton-line" style={{ width: "70%", height: 20 }} />
            <div className="skeleton-line" style={{ width: "40%", height: 14, marginTop: 8 }} />
            <div className="skeleton-line" style={{ width: "50%", height: 14, marginTop: 4 }} />
            <div className="skeleton-actions" style={{ marginTop: 16 }} />
          </div>
        ))}
      </div>
    </section>
  );
}

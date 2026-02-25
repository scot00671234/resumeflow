import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { resumesApi } from "@/api/client";
import type { ResumeListItem } from "@/api/client";
import ConfirmModal from "@/components/ConfirmModal";
import DashboardSkeleton from "@/components/DashboardSkeleton";

const TEMPLATES = [
  { id: "modern", label: "Modern" },
  { id: "standard", label: "Standard" },
  { id: "compact", label: "Compact" },
] as const;

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [templateId, setTemplateId] = useState<string>("modern");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResumeListItem | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (opts?: { title?: string; templateId?: string }) =>
      resumesApi.create(opts?.title, opts?.templateId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setNewTitle("");
      setShowCreate(false);
      navigate(`/dashboard/resumes/${result.resume.id}`);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => resumesApi.duplicate(id),
    onMutate: (id) => setDuplicatingId(id),
    onSettled: () => setDuplicatingId(null),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      navigate(`/dashboard/resumes/${result.resume.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setDeleteTarget(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ title: newTitle || undefined, templateId });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) {
    return (
      <section className="panel card">
        <p className="status-text status-error">Failed to load resumes. Please refresh the page.</p>
      </section>
    );
  }

  const resumes = data?.resumes ?? [];
  const lastEdited = resumes.length > 0 ? resumes[0] : null;

  return (
    <section className="panel card dashboard-page">
      {/* Stats & welcome */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My resumes</h1>
          <p className="dashboard-subtitle">
            {resumes.length === 0
              ? "Create your first resume to get started."
              : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} · ${lastEdited ? `Last edited ${formatRelative(lastEdited.updatedAt)}` : ""}`}
          </p>
        </div>
        <div className="dashboard-stats-row">
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{resumes.length}</span>
            <span className="dashboard-stat-label">Total</span>
          </div>
          {lastEdited && (
            <div className="dashboard-stat">
              <span className="dashboard-stat-value">{formatRelative(lastEdited.updatedAt)}</span>
              <span className="dashboard-stat-label">Last active</span>
            </div>
          )}
        </div>
      </div>

      {/* Create CTA */}
      <div className="dashboard-create-row">
        {!showCreate ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn btn-primary dashboard-create-btn"
          >
            + New resume
          </button>
        ) : (
          <form onSubmit={handleCreate} className="dashboard-create-form">
            <input
              type="text"
              placeholder="Resume title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input dashboard-create-input"
              autoFocus
            />
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="select dashboard-create-select"
              aria-label="Template"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <div className="dashboard-create-actions">
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                {createMutation.isPending ? "Creating…" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setNewTitle(""); }} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List: empty state vs cards */}
      {resumes.length === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon" aria-hidden>📄</div>
          <h2 className="dashboard-empty-title">No resumes yet</h2>
          <p className="dashboard-empty-text">Create a resume above or use a template to start.</p>
          {!showCreate && (
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
              Create your first resume
            </button>
          )}
        </div>
      ) : (
        <ul className="resume-cards-grid" aria-label="Resume list">
          {resumes.map((r) => (
            <li key={r.id} className="resume-card">
              <Link to={`/dashboard/resumes/${r.id}`} className="resume-card-link">
                <span className="resume-card-title">{r.title || "Untitled"}</span>
                <span className="resume-card-meta">
                  <span className="resume-card-template">{r.templateId}</span>
                  <span className="resume-card-date">{formatRelative(r.updatedAt)}</span>
                </span>
              </Link>
              <div className="resume-card-actions">
                <Link to={`/dashboard/resumes/${r.id}`} className="btn btn-primary btn-sm">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => duplicateMutation.mutate(r.id)}
                  disabled={duplicatingId !== null}
                  className="btn btn-secondary btn-sm"
                  title="Duplicate"
                >
                  {duplicatingId === r.id ? "…" : "Duplicate"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(r)}
                  className="btn btn-danger btn-sm"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete resume?"
        message={deleteTarget ? `"${deleteTarget.title}" will be permanently deleted. This can't be undone.` : ""}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </section>
  );
}

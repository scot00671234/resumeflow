import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { resumesApi } from "@/api/client";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (title?: string) => resumesApi.create(title),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setNewTitle("");
      navigate(`/dashboard/resumes/${result.resume.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newTitle || undefined);
  };

  if (isLoading) return <p>Loading resumes…</p>;
  if (error) return <p className="status-text status-error">Failed to load resumes.</p>;

  const resumes = data?.resumes ?? [];

  return (
    <section className="panel card">
      <h1>My resumes</h1>
      <form onSubmit={handleCreate} className="form-grid" style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="New resume title (optional)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="input"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn btn-primary"
          style={{ justifySelf: "start" }}
        >
          {createMutation.isPending ? "Creating…" : "Create resume"}
        </button>
      </form>
      {resumes.length === 0 ? (
        <p className="muted">No resumes yet. Create one above.</p>
      ) : (
        <ul className="resume-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {resumes.map((r) => (
            <li key={r.id} className="resume-row">
              <Link to={`/dashboard/resumes/${r.id}`} className="resume-row-title">
                {r.title}
              </Link>
              <span className="muted" style={{ fontSize: "0.82rem" }}>
                {new Date(r.updatedAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(r.id)}
                disabled={deleteMutation.isPending}
                className="btn btn-danger"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumesApi } from "@/api/client";
import type { ResumeContent } from "@resume/shared";

const TEMPLATES = ["modern", "standard", "compact"] as const;

export default function ResumeEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState<string>("modern");
  const [summary, setSummary] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["resume", id],
    queryFn: () => resumesApi.get(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { title?: string; templateId?: string; content?: object }) =>
      resumesApi.update(id!, payload),
    onSuccess: (result) => {
      queryClient.setQueryData(["resume", id], { resume: result.resume });
    },
  });

  const resume = data?.resume;
  useEffect(() => {
    if (resume) {
      setTitle(resume.title);
      setTemplateId(resume.templateId);
      setSummary((resume.content as ResumeContent)?.summary ?? "");
    }
  }, [resume]);

  if (!id) {
    navigate("/dashboard");
    return null;
  }
  if (isLoading) return <p>Loading…</p>;
  if (error || !data) return <p className="status-text status-error">Resume not found.</p>;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const content = { ...(resume?.content as object), summary: summary || undefined };
    updateMutation.mutate({ title, templateId, content });
  };

  return (
    <section className="panel card">
      <p style={{ marginBottom: "1rem" }}>
        <Link to="/dashboard" className="editor-back">
          ← Back to dashboard
        </Link>
      </p>
      <form onSubmit={handleSave} className="form-grid">
        <label className="field">
          <span className="label">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </label>
        <label className="field">
          <span className="label">Template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="select"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Summary</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Professional summary..."
            className="textarea"
            style={{ resize: "vertical" }}
          />
        </label>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn btn-primary"
          style={{ justifySelf: "start" }}
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
        {updateMutation.isSuccess && (
          <span className="status-text status-success">
            Saved
          </span>
        )}
      </form>
    </section>
  );
}

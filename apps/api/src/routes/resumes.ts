import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { resumes } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthLocals } from "../middleware/auth.js";
import { DEFAULT_RESUME_CONTENT } from "@resume/shared";
import type { ResumeContent } from "@resume/shared";

const router = Router();
router.use(requireAuth);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const CreateResumeBody = z.object({
  title: z.string().min(1).max(200).optional(),
  templateId: z.enum(["modern", "standard", "compact"]).optional(),
});

const UpdateResumeBody = z.object({
  title: z.string().min(1).max(200).optional(),
  templateId: z.enum(["modern", "standard", "compact"]).optional(),
  content: z.record(z.unknown()).optional(),
});

// GET /resumes — list current user's resumes
router.get("/", async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const userId = res.locals.userId;
  const list = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      slug: resumes.slug,
      templateId: resumes.templateId,
      createdAt: resumes.createdAt,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt));
  res.json({ resumes: list });
});

// POST /resumes — create resume
router.post("/", async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const userId = res.locals.userId;
  const title = parsed.data.title ?? "Untitled Resume";
  const templateId = parsed.data.templateId ?? "modern";
  const slug = slugify(title) || "resume";
  const content = DEFAULT_RESUME_CONTENT as unknown as Record<string, unknown>;
  const [created] = await db
    .insert(resumes)
    .values({
      userId,
      title,
      slug: `${slug}-${Date.now().toString(36)}`,
      templateId,
      content,
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to create resume" });
    return;
  }
  res.status(201).json({
    resume: {
      id: created.id,
      title: created.title,
      slug: created.slug,
      templateId: created.templateId,
      content: created.content as ResumeContent,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  });
});

// GET /resumes/:id
router.get("/:id", async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const userId = res.locals.userId;
  const id = req.params.id;
  const [row] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  if (!row) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.json({
    resume: {
      id: row.id,
      title: row.title,
      slug: row.slug,
      templateId: row.templateId,
      content: row.content as ResumeContent,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
});

// PATCH /resumes/:id
router.patch("/:id", async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const userId = res.locals.userId;
  const id = req.params.id;
  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const [existing] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  if (!existing) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  const updates: Partial<{ title: string; slug: string; templateId: string; content: unknown }> = {};
  if (parsed.data.title !== undefined) {
    updates.title = parsed.data.title;
    updates.slug = slugify(parsed.data.title) || existing.slug;
  }
  if (parsed.data.templateId !== undefined) updates.templateId = parsed.data.templateId;
  if (parsed.data.content !== undefined) updates.content = parsed.data.content;
  const [updated] = await db
    .update(resumes)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(resumes.id, id))
    .returning();
  if (!updated) {
    res.status(500).json({ error: "Failed to update resume" });
    return;
  }
  res.json({
    resume: {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      templateId: updated.templateId,
      content: updated.content as ResumeContent,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
});

// POST /resumes/:id/duplicate — clone resume (same content, new title)
router.post("/:id/duplicate", async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const userId = res.locals.userId;
  const id = req.params.id;
  const [existing] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  if (!existing) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  const title = `${existing.title.replace(/\s*\(Copy( \d+)?\)\s*$/, "").trim()} (Copy)`;
  const slug = slugify(title) || "resume";
  const [created] = await db
    .insert(resumes)
    .values({
      userId,
      title,
      slug: `${slug}-${Date.now().toString(36)}`,
      templateId: existing.templateId,
      content: existing.content,
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to duplicate resume" });
    return;
  }
  res.status(201).json({
    resume: {
      id: created.id,
      title: created.title,
      slug: created.slug,
      templateId: created.templateId,
      content: created.content as ResumeContent,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  });
});

// DELETE /resumes/:id
router.delete("/:id", async (req: Request, res: Response<unknown, AuthLocals>): Promise<void> => {
  const userId = res.locals.userId;
  const id = req.params.id;
  const [deleted] = await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .returning({ id: resumes.id });
  if (!deleted) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.status(204).send();
});

export default router;

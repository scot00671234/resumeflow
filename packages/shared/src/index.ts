// Resume schema (aligned with resume-standard concepts)
export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  bullets?: string[];
}

export interface ResumeContent {
  contact: Contact;
  summary?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  certifications?: { name: string; date?: string }[];
  projects?: { name: string; description?: string; url?: string }[];
}

export const DEFAULT_RESUME_CONTENT: ResumeContent = {
  contact: {},
  experience: [],
  education: [],
  skills: [],
};

// API types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  slug: string;
  templateId: string;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

export type TemplateId = "modern" | "standard" | "compact";

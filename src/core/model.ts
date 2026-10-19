import { z } from 'zod';

export type Locale = 'ko' | 'en';
export type Localized = Record<Locale, string>;
export interface Category {
  id: string;
  title: Localized;
  mark: string;
}
export interface Knowledge {
  id: string;
  category: string;
  pack: string;
  factRevision: number;
  textRevision: number;
  title: Localized;
  explanation: Localized;
  source: { url: string; label: string; checkedAt: string | null; usage: string };
  review: 'candidate' | 'approved';
  visual?:
    | { kind: 'element'; symbol: string; atomicNumber: number }
    | { kind: 'moonPhase'; phase: number };
}
export interface Question {
  id: string;
  knowledgeId: string;
  prompt: Localized;
  options: { id: string; text: Localized }[];
  answerId: string;
}
export interface Catalog {
  version: string;
  categories: Category[];
  knowledge: Knowledge[];
  questions: Question[];
}
const integer = z.number().int().nonnegative();
const grade = z.enum(['correct', 'wrong', 'unsure']);
export const progressSchema = z.object({
  revision: integer,
  seenAt: integer,
  lastAt: integer,
  dueAt: integer,
  intervalDays: integer,
  stage: z.enum(['seen', 'practicing', 'remembered']),
  lapses: integer,
});
export const attemptSchema = z.object({
  knowledgeId: z.string(),
  revision: integer,
  questionId: z.string(),
  sessionId: z.string(),
  at: integer,
  grade,
  selectedId: z.string().nullable(),
  mode: z.enum(['quiz', 'card']),
  retry: z.boolean(),
  delayDays: z.number().nonnegative(),
  recovered: z.boolean(),
  practice: z.boolean().optional(),
});
const itemSchema = z.object({
  knowledgeId: z.string(),
  revision: integer,
  questionId: z.string(),
  order: z.array(z.string()).length(4),
  retry: z.boolean(),
  practice: z.boolean().optional(),
});
export const stateSchema = z.object({
  schema: z.literal(1),
  locale: z.enum(['ko', 'en']),
  interests: z.array(z.string()).max(3),
  onboarded: z.boolean(),
  mode: z.enum(['quiz', 'card']),
  progress: z.record(z.string(), progressSchema),
  attempts: z.array(attemptSchema),
  completions: z.array(z.object({ sessionId: z.string(), at: integer })),
  session: z
    .object({
      id: z.string(),
      startedAt: integer,
      mode: z.enum(['quiz', 'card']),
      items: z.array(itemSchema).min(1).max(20),
      cursor: integer,
      feedback: z.object({ grade, selectedId: z.string().nullable() }).nullable(),
    })
    .nullable(),
});
export type State = z.infer<typeof stateSchema>;
export type Progress = z.infer<typeof progressSchema>;
export type Grade = z.infer<typeof grade>;
export type Attempt = z.infer<typeof attemptSchema>;
export type SessionItem = z.infer<typeof itemSchema>;
export interface StoragePort {
  load(): Promise<State | null>;
  save(state: State): Promise<void>;
}
export const initialState = (locale: Locale = 'ko'): State => ({
  schema: 1,
  locale,
  interests: [],
  onboarded: false,
  mode: 'quiz',
  progress: {},
  attempts: [],
  completions: [],
  session: null,
});

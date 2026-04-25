import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { parse as parseToml } from "smol-toml";

const FITNESS_ROOT = path.join(process.cwd(), "..");

const LOGS_DIR = path.join(FITNESS_ROOT, "logs");
const REPORTS_DIR = path.join(FITNESS_ROOT, "reports");
const INBODY_DIR = path.join(FITNESS_ROOT, "inbody");
const PROFILE_PATH = path.join(FITNESS_ROOT, "profile.toml");
const EXERCISES_PATH = path.join(FITNESS_ROOT, "exercises.toml");

export type Profile = {
  goal: { primary: string; target_muscles: string[]; description: string };
  weaknesses: { last_updated: string; areas: string[]; notes: string };
  muscle_groups: Record<string, string[]>;
};

export type Exercise = {
  id: string;
  name: string;
  target: string[];
  category: string;
};

export type WorkoutSet = {
  exercise: string;
  sets?: number;
  reps_per_set?: number;
  weight_kg?: number;
  duration_sec?: number;
  unstable?: boolean;
  notes?: string;
};

export type WorkoutLog = {
  date: string;
  session_type?: string;
  workouts: WorkoutSet[];
  skipped: WorkoutSet[];
};

export type Report = {
  date: string;
  filename: string;
  content: string;
};

export type InbodyEntry = {
  date: string;
  data: Record<string, unknown>;
};

function yymmddToDate(stem: string): string {
  // "260416" -> "2026-04-16"
  if (!/^\d{6}$/.test(stem)) return stem;
  return `20${stem.slice(0, 2)}-${stem.slice(2, 4)}-${stem.slice(4, 6)}`;
}

export async function loadProfile(): Promise<Profile> {
  const raw = await fs.readFile(PROFILE_PATH, "utf-8");
  return parseToml(raw) as unknown as Profile;
}

export async function loadExercises(): Promise<Record<string, Exercise>> {
  const raw = await fs.readFile(EXERCISES_PATH, "utf-8");
  const parsed = parseToml(raw) as Record<
    string,
    Omit<Exercise, "id"> | undefined
  >;
  const out: Record<string, Exercise> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (value && typeof value === "object" && "name" in value) {
      out[id] = { id, ...(value as Omit<Exercise, "id">) };
    }
  }
  return out;
}

async function readDirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

export async function loadLogs(): Promise<WorkoutLog[]> {
  const files = await readDirSafe(LOGS_DIR);
  const tomls = files.filter((f) => f.endsWith(".toml"));
  const logs = await Promise.all(
    tomls.map(async (f) => {
      const raw = await fs.readFile(path.join(LOGS_DIR, f), "utf-8");
      const parsed = parseToml(raw) as Partial<WorkoutLog>;
      const stem = f.replace(/\.toml$/, "");
      return {
        date: parsed.date ?? yymmddToDate(stem),
        session_type: parsed.session_type,
        workouts: (parsed.workouts as WorkoutSet[] | undefined) ?? [],
        skipped: (parsed.skipped as WorkoutSet[] | undefined) ?? [],
      };
    })
  );
  return logs.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function loadReports(): Promise<Report[]> {
  const files = await readDirSafe(REPORTS_DIR);
  const mds = files.filter((f) => f.endsWith(".md"));
  const reports = await Promise.all(
    mds.map(async (f) => {
      const content = await fs.readFile(path.join(REPORTS_DIR, f), "utf-8");
      const stem = f.replace(/\.md$/, "");
      return { date: yymmddToDate(stem), filename: f, content };
    })
  );
  return reports.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function loadInbody(): Promise<InbodyEntry[]> {
  const files = await readDirSafe(INBODY_DIR);
  const tomls = files.filter((f) => f.endsWith(".toml"));
  const entries = await Promise.all(
    tomls.map(async (f) => {
      const raw = await fs.readFile(path.join(INBODY_DIR, f), "utf-8");
      const parsed = parseToml(raw) as Record<string, unknown>;
      const stem = f.replace(/\.toml$/, "");
      const date = (parsed.date as string | undefined) ?? yymmddToDate(stem);
      return { date, data: parsed };
    })
  );
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export type WeeklyVolume = {
  weekStart: string;
  byCategory: Record<string, number>;
  total: number;
};

function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const diff = (day + 6) % 7; // back to Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function aggregateWeeklyVolume(
  logs: WorkoutLog[],
  exercises: Record<string, Exercise>
): WeeklyVolume[] {
  const buckets = new Map<string, Record<string, number>>();
  for (const log of logs) {
    const week = isoWeekStart(log.date);
    const bucket = buckets.get(week) ?? {};
    for (const w of log.workouts) {
      const ex = exercises[w.exercise];
      if (!ex) continue;
      const sets = w.sets ?? 0;
      bucket[ex.category] = (bucket[ex.category] ?? 0) + sets;
    }
    buckets.set(week, bucket);
  }
  return [...buckets.entries()]
    .map(([weekStart, byCategory]) => ({
      weekStart,
      byCategory,
      total: Object.values(byCategory).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
}

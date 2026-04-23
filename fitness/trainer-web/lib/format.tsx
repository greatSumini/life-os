import type { Exercise, WorkoutLog, WorkoutSet } from "./data";

export const CATEGORY_LABEL: Record<string, string> = {
  back: "등",
  chest: "가슴",
  shoulder: "어깨",
  arms: "팔",
  legs: "하체",
  core: "코어",
};

export const CATEGORY_ORDER = [
  "back",
  "chest",
  "shoulder",
  "arms",
  "legs",
  "core",
];

export const MEV = 10;
export const MAV = 20;

export function volumeBarColor(sets: number): string {
  if (sets === 0) return "bg-[#3C3C43]/15";
  if (sets < MEV) return "bg-[#FF9500]";
  return "bg-[#34C759]";
}

export function volumeTextColor(sets: number): string {
  if (sets === 0) return "text-[#3C3C43]/40";
  if (sets < MEV) return "text-[#FF9500]";
  return "text-[#34C759]";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  const m = iso.slice(5, 7);
  const day = iso.slice(8, 10);
  return `${m}월 ${day}일 (${dow})`;
}

export function workoutLine(
  w: WorkoutSet,
  exercises: Record<string, Exercise>,
): string {
  const name = exercises[w.exercise]?.name ?? w.exercise;
  const detail: string[] = [];
  if (w.weight_kg !== undefined) detail.push(`${w.weight_kg}kg`);
  if (w.sets !== undefined && w.reps_per_set !== undefined) {
    detail.push(`${w.sets}세트 × ${w.reps_per_set}회`);
  } else if (w.sets !== undefined) {
    detail.push(`${w.sets}세트`);
  } else if (w.reps_per_set !== undefined) {
    detail.push(`${w.reps_per_set}회`);
  }
  if (w.duration_sec !== undefined) detail.push(`${w.duration_sec}초`);
  return detail.length ? `${name} · ${detail.join(" / ")}` : name;
}

export function categoryCounts(
  log: WorkoutLog,
  exercises: Record<string, Exercise>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of log.workouts) {
    const cat = exercises[w.exercise]?.category;
    if (!cat) continue;
    out[cat] = (out[cat] ?? 0) + (w.sets ?? 0);
  }
  return out;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-[#3C3C43]/60">
      {children}
    </h2>
  );
}

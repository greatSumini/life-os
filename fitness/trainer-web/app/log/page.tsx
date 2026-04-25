import WeekStrip from "@/components/WeekStrip";
import { loadExercises, loadLogs, loadReports, type WorkoutLog } from "@/lib/data";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  SectionTitle,
  categoryCounts,
  formatDate,
  formatWeekLabel,
  formatWeekRange,
  weekStart,
  workoutLine,
} from "@/lib/format";

export default async function LogPage() {
  const [exercises, logs, reports] = await Promise.all([
    loadExercises(),
    loadLogs(),
    loadReports(),
  ]);

  return (
    <main className="min-h-screen bg-[#F2F2F7]">
      <div className="mx-auto max-w-lg px-4 pt-12 pb-8">
        <h1 className="px-1 text-[34px] font-bold leading-tight tracking-tight text-black">
          기록
        </h1>
        <p className="mt-1 px-1 text-[15px] text-[#3C3C43]/70">
          {logs.length}개 세션 · {reports.length}개 리포트
        </p>

        <div className="mt-6">
          <WeekStrip workoutDates={logs.map((l) => l.date)} />
        </div>

        <section className="mt-8">
          <SectionTitle>운동 세션</SectionTitle>
          {logs.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-[14px] text-[#3C3C43]/50">
              기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {groupLogsByWeek(logs).map(([week, weekLogs]) => (
                <div key={week}>
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <h3 className="text-[14px] font-semibold text-[#1C1C1E]">
                      {formatWeekLabel(week)}
                    </h3>
                    <span className="text-[11px] text-[#3C3C43]/50">
                      {formatWeekRange(week)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {weekLogs.map((log) => {
                      const counts = categoryCounts(log, exercises);
                      const totalSets = Object.values(counts).reduce(
                        (a, b) => a + b,
                        0,
                      );
                      return (
                        <article
                          key={log.date}
                          className="rounded-2xl bg-white p-4"
                        >
                          <div className="flex items-baseline justify-between">
                            <p className="text-[15px] font-semibold text-black">
                              {formatDate(log.date)}
                            </p>
                            <p className="text-[12px] text-[#3C3C43]/50">
                              {log.session_type ? `${log.session_type} · ` : ""}
                              {totalSets}세트
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {CATEGORY_ORDER.filter((c) => counts[c]).map((c) => (
                              <span
                                key={c}
                                className="rounded-md bg-[#3C3C43]/8 px-1.5 py-0.5 text-[11px] text-[#3C3C43]/70"
                              >
                                {CATEGORY_LABEL[c]} {counts[c]}
                              </span>
                            ))}
                          </div>
                          <ul className="mt-3 space-y-1.5 text-[14px] text-[#1C1C1E]">
                            {log.workouts.map((w, i) => (
                              <li key={i} className="leading-snug">
                                <span>{workoutLine(w, exercises)}</span>
                                {w.notes && (
                                  <span className="ml-1 text-[12px] text-[#3C3C43]/50">
                                    ({w.notes})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {reports.length > 0 && (
          <section className="mt-8">
            <SectionTitle>트레이너 리포트</SectionTitle>
            <div className="space-y-3">
              {reports.map((r) => (
                <details
                  key={r.filename}
                  className="group rounded-2xl bg-white p-4"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-[15px] font-medium text-black [&::-webkit-details-marker]:hidden">
                    <span>{r.date}</span>
                    <span className="text-[#3C3C43]/40 transition-transform group-open:rotate-90">
                      ›
                    </span>
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-[#3C3C43]">
                    {r.content}
                  </pre>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function groupLogsByWeek(
  logs: WorkoutLog[],
): Array<[string, WorkoutLog[]]> {
  const groups = new Map<string, WorkoutLog[]>();
  for (const log of logs) {
    const key = weekStart(log.date);
    const bucket = groups.get(key) ?? [];
    bucket.push(log);
    groups.set(key, bucket);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
}

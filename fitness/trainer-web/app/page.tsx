import TrainerComposer from "@/components/TrainerComposer";
import {
  aggregateWeeklyVolume,
  loadExercises,
  loadInbody,
  loadLogs,
  loadProfile,
} from "@/lib/data";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  MAV,
  MEV,
  SectionTitle,
  volumeBarColor,
  volumeTextColor,
} from "@/lib/format";

export default async function Home() {
  const [profile, exercises, logs, inbody] = await Promise.all([
    loadProfile(),
    loadExercises(),
    loadLogs(),
    loadInbody(),
  ]);

  const weekly = aggregateWeeklyVolume(logs, exercises);
  const currentWeek = weekly[0];
  const latestInbody = inbody[0];

  return (
    <main className="min-h-screen bg-[#F2F2F7]">
      <div className="mx-auto max-w-lg px-4 pt-12 pb-8">
        <h1 className="px-1 text-[34px] font-bold leading-tight tracking-tight text-black">
          홈
        </h1>

        <div className="mt-6">
          <TrainerComposer />
        </div>

        <section className="mt-8">
          <SectionTitle>목표</SectionTitle>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[17px] font-semibold text-black">
              {profile.goal.primary}
            </p>
            <p className="mt-1 text-[14px] leading-snug text-[#3C3C43]/70">
              {profile.goal.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.goal.target_muscles.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-[#007AFF]/10 px-2.5 py-0.5 text-[12px] font-medium text-[#007AFF]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </section>

        {profile.weaknesses.areas.length > 0 && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between px-1 pb-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#3C3C43]/60">
                보강 영역
              </h2>
              {profile.weaknesses.last_updated && (
                <span className="text-[11px] text-[#3C3C43]/50">
                  {profile.weaknesses.last_updated} 갱신
                </span>
              )}
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="flex flex-wrap gap-1.5">
                {profile.weaknesses.areas.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-[#FF9500]/15 px-2.5 py-0.5 text-[12px] font-medium text-[#A75A00]"
                  >
                    {a}
                  </span>
                ))}
              </div>
              {profile.weaknesses.notes && (
                <pre className="mt-3 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#3C3C43]/80">
                  {profile.weaknesses.notes.trim()}
                </pre>
              )}
            </div>
          </section>
        )}

        {currentWeek && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between px-1 pb-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#3C3C43]/60">
                이번 주 볼륨
              </h2>
              <span className="text-[11px] text-[#3C3C43]/50">
                {currentWeek.weekStart} 시작 · 총 {currentWeek.total}세트
              </span>
            </div>
            <div className="space-y-px overflow-hidden rounded-2xl bg-white">
              {CATEGORY_ORDER.map((cat, idx) => {
                const sets = currentWeek.byCategory[cat] ?? 0;
                const pct = Math.min((sets / MAV) * 100, 100);
                const status =
                  sets >= MAV
                    ? "MAV"
                    : sets >= MEV
                      ? "MEV+"
                      : sets > 0
                        ? "부족"
                        : "—";
                return (
                  <div
                    key={cat}
                    className={`px-4 py-3 ${
                      idx > 0 ? "border-t border-[#3C3C43]/10" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between text-[15px]">
                      <span className="font-medium text-black">
                        {CATEGORY_LABEL[cat]}
                      </span>
                      <span className="text-[#3C3C43]/60">
                        {sets}세트
                        <span
                          className={`ml-2 text-[12px] font-semibold ${volumeTextColor(sets)}`}
                        >
                          {status}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3C3C43]/10">
                      <div
                        className={`h-full rounded-full transition-all ${volumeBarColor(sets)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="px-1 pt-2 text-[11px] text-[#3C3C43]/50">
              MEV 10세트 / MAV 20세트 기준
            </p>
          </section>
        )}

        {latestInbody && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between px-1 pb-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#3C3C43]/60">
                최근 인바디
              </h2>
              <span className="text-[11px] text-[#3C3C43]/50">
                {latestInbody.date}
              </span>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-[#3C3C43]">
                {Object.entries(latestInbody.data)
                  .filter(([k]) => k !== "date")
                  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                  .join("\n")}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

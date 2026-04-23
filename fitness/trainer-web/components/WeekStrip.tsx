"use client";

import { useEffect, useMemo, useState } from "react";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // 월요일 시작
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeekStrip({
  workoutDates,
}: {
  workoutDates: string[];
}) {
  // 클라이언트에서만 today/start 결정 → hydration mismatch 회피
  const [start, setStart] = useState<Date | null>(null);
  const [todayIso, setTodayIso] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setStart(startOfWeek(now));
    setTodayIso(toIso(now));
  }, []);

  const workoutSet = useMemo(() => new Set(workoutDates), [workoutDates]);

  if (!start || !todayIso) {
    return <div className="h-[112px] rounded-2xl bg-white" aria-hidden />;
  }

  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const monthLabel = `${start.getFullYear()}년 ${start.getMonth() + 1}월`;

  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => setStart(addDays(start, -7))}
          aria-label="이전 주"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#007AFF] active:bg-[#3C3C43]/10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-[#3C3C43]">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => setStart(addDays(start, 7))}
          aria-label="다음 주"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#007AFF] active:bg-[#3C3C43]/10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div className="flex items-start">
        {dates.map((d) => {
          const iso = toIso(d);
          const isToday = iso === todayIso;
          const isFuture = iso > todayIso;
          const hasWorkout = workoutSet.has(iso);
          const dowLabel = DOW[d.getDay()];
          const dayNum = d.getDate();

          return (
            <div
              key={iso}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <span
                className={`text-[10px] font-medium ${
                  isFuture ? "text-[#3C3C43]/30" : "text-[#3C3C43]/55"
                }`}
              >
                {dowLabel}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-semibold ${
                  isToday
                    ? "bg-[#007AFF] text-white"
                    : isFuture
                      ? "text-[#3C3C43]/30"
                      : "text-black"
                }`}
              >
                {dayNum}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  hasWorkout ? "bg-[#34C759]" : "bg-transparent"
                }`}
                aria-label={hasWorkout ? "운동함" : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

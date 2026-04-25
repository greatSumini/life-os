"use client";

import { useEffect, useRef, useState } from "react";

export default function ColorLegend() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="색상 안내"
        onClick={() => setOpen((v) => !v)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-[#3C3C43]/25 text-[11px] font-semibold text-[#3C3C43]/60 transition hover:bg-[#3C3C43]/8"
      >
        ?
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 w-60 rounded-xl bg-white p-3 text-[12px] leading-relaxed text-[#1C1C1E] shadow-lg ring-1 ring-black/5">
          <p className="mb-2 font-semibold">색상 안내</p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF9500]" />
              <span>
                <span className="font-medium text-[#FF9500]">주황</span>: 자세
                불안정 — 트레이너 점검 필요
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF3B30]" />
              <span>
                <span className="font-medium text-[#FF3B30]">빨강</span>: 계획
                했으나 미실시
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

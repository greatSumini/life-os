"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function TrainerComposer() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 시트가 열린 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    if (status === "sending") return;
    setOpen(false);
    setStatus("idle");
    setErrorMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setStatus("error");
      setErrorMessage("내용을 입력해주세요.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    const message = `[PT 트레이너 운동 기록]\n\n${content.trim()}`;

    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "전송 실패");

      setStatus("sent");
      setContent("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 900);
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "전송 중 오류 발생");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#007AFF] px-5 py-4 text-[17px] font-semibold text-white shadow-sm transition active:scale-[0.98] active:bg-[#0066D6]"
      >
        <span className="text-xl leading-none">＋</span>
        새 기록 입력하기 (트레이너)
      </button>

      {/* Backdrop + Sheet */}
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={close}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 transform transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] bg-[#F2F2F7] pb-[env(safe-area-inset-bottom)] shadow-2xl">
            {/* Grabber */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="h-1 w-9 rounded-full bg-[#3C3C43]/30" />
            </div>

            {/* Header */}
            <div className="grid grid-cols-3 items-center px-4 py-2">
              <button
                type="button"
                onClick={close}
                disabled={status === "sending"}
                className="justify-self-start text-[17px] text-[#007AFF] disabled:opacity-40"
              >
                취소
              </button>
              <h2 className="justify-self-center text-[17px] font-semibold text-black">
                새 운동 기록
              </h2>
              <button
                type="submit"
                form="trainer-composer-form"
                disabled={status === "sending" || !content.trim()}
                className="justify-self-end text-[17px] font-semibold text-[#007AFF] disabled:opacity-40"
              >
                {status === "sending" ? "전송중" : "전송"}
              </button>
            </div>

            <form
              id="trainer-composer-form"
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4"
            >
              {/* 가이드 */}
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[13px] font-semibold text-black">
                  입력 가이드
                </p>
                <p className="mt-1 text-[13px] text-[#3C3C43]/80">
                  운동 이름 / 세트 횟수 / 무게 / 주의사항
                </p>
                <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-[#F2F2F7] p-3 font-mono text-[12px] leading-relaxed text-[#3C3C43]">
{`랫풀다운 / 4세트 12회 / 50kg / 치팅 주의
시티드 로우 / 3세트 15회 / 40kg
페이스풀 / 3세트 15회 / 15kg

전반적으로 등 수축 감각이 좋아지고 있음.`}
                </pre>
              </div>

              {/* 입력 */}
              <textarea
                placeholder="오늘의 운동을 자유롭게 작성하세요…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                autoFocus
                className="min-h-[200px] flex-1 rounded-2xl bg-white px-4 py-3.5 text-[16px] text-black placeholder-[#3C3C43]/40 outline-none ring-0 focus:ring-2 focus:ring-[#007AFF]/30"
              />

              {status === "sent" && (
                <div className="rounded-2xl bg-[#34C759]/15 px-4 py-3 text-center text-[14px] font-medium text-[#1F8B3F]">
                  전송 완료
                </div>
              )}
              {status === "error" && (
                <div className="rounded-2xl bg-[#FF3B30]/15 px-4 py-3 text-center text-[14px] font-medium text-[#C8261C]">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

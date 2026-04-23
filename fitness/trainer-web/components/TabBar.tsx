"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "홈",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M3.5 11.5L12 4l8.5 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1v-8.5Z" />
      </svg>
    ),
  },
  {
    href: "/log",
    label: "기록",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.8}
        strokeLinecap="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
        <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3C3C43]/15 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors ${
                active ? "text-[#007AFF]" : "text-[#8E8E93]"
              }`}
            >
              {tab.icon(active)}
              <span className="text-[10px] font-medium tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

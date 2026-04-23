import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "운동 기록",
  description: "PT 운동 기록 대시보드",
};

export const viewport: Viewport = {
  themeColor: "#F2F2F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full pb-[calc(56px+env(safe-area-inset-bottom))]">
        {children}
        <TabBar />
      </body>
    </html>
  );
}

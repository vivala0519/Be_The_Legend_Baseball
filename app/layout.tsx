import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "비 더 레전드",
  description: "KBO, NPB, MLB, CPBL. 첫 타석부터 마지막 인사까지, 선택으로 완성하는 나만의 야구 커리어.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "fieldNote — GPX 경로 그리기",
  description: "네이버 지도 위에서 경로를 그리고 GPX로 내보내기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}

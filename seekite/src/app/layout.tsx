import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seekite - 말씀 나눔",
  description: "예배 말씀을 나누는 소그룹 공간",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-dvh">
        <div className="mx-auto max-w-[480px] min-h-dvh bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공교육 중심 에듀테크 기업 가치평가 | KERIS",
  description: "KERIS 공교육 중심 에듀테크 기업 가치평가 모형을 기반으로 한 자가진단 도구. 공교육 환경에 적합한 에듀테크 기업의 가치를 체계적으로 평가합니다.",
  keywords: ["에듀테크", "가치평가", "공교육", "KERIS", "교육기술", "EdTech"],
  authors: [{ name: "EdTech Valuation" }],
  openGraph: {
    title: "공교육 중심 에듀테크 기업 가치평가",
    description: "공교육 환경에 적합한 에듀테크 기업의 가치를 체계적으로 평가하는 자가진단 도구",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}


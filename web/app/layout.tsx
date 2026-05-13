import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "硅基文明消费股交易系统",
  description: "Silicon-civilization consumer-stock strategy system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

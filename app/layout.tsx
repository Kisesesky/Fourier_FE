// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Fourier",
  description:
    "Fourier is a workspace where teams find their rhythm. We transform scattered information into a clear, unified flow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Script
          src="https://mcp.figma.com/mcp/html-to-design/capture.js"
          strategy="afterInteractive"
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

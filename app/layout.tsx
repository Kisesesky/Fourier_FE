// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

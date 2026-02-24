'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/api";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/sign-in");
      return;
    }
    setAuthToken(token);
    setAuthorized(true);
    const handleUnauthorized = () => {
      setAuthorized(false);
      router.replace("/sign-in");
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized as EventListener);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized as EventListener);
    };
  }, [router]);

  if (!authorized) return null;

  return <>{children}</>;
}

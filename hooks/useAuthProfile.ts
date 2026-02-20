// hooks/useAuthProfile.ts
import { useEffect, useState } from "react";
import { fetchProfile, type AuthProfile } from "@/lib/auth";

export function useAuthProfile() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("accessToken")) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfile()
      .then(setProfile)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading, error };
}

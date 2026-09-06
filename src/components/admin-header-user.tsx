"use client";

import { useEffect, useState } from "react";
import { getOfficerSession } from "@/lib/client-storage";

export default function AdminHeaderUser({
  fallbackUsername,
}: {
  fallbackUsername: string;
}) {
  const [name, setName] = useState(fallbackUsername);

  useEffect(() => {
    const update = () => {
      const s = getOfficerSession();
      if (s && s.user) {
        setName(s.user.username);
      }
    };
    update();
    window.addEventListener("officer_auth_updated", update);
    return () => window.removeEventListener("officer_auth_updated", update);
  }, []);

  return (
    <span className="hidden rounded border border-white/20 bg-white/5 px-3 py-1 text-xs text-white sm:inline">
      Signed in as <strong className="text-saffron">{name}</strong>
    </span>
  );
}

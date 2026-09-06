"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearOfficerSession } from "@/lib/client-storage";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    clearOfficerSession();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/officer-login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
    >
      {loading ? "Logging out…" : "Logout"}
    </button>
  );
}

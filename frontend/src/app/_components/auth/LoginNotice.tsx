"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

export function LoginNotice() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";

  if (!isExpired) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500 mb-2">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">
        Your session has expired. Please sign in again to continue.
      </p>
    </div>
  );
}

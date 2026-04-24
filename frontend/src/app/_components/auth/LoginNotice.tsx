"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginNotice() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (isExpired && !hasShownToast.current) {
      toast.error("Your session has expired. Please sign in again to continue.", {
        id: "session-expired", // Prevent duplicate toasts
      });
      hasShownToast.current = true;
    }
  }, [isExpired]);

  return null;
}

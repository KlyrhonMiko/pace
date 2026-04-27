"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function LoginNotice() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";
  const isDeactivated = searchParams.get("deactivated") === "true";
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (hasShownToast.current) return;

    if (isDeactivated) {
      toast.error("Your account has been deactivated. Please contact the administrator.", {
        id: "account-deactivated",
      });
      hasShownToast.current = true;
    } else if (isExpired) {
      toast.error("Your session has expired. Please sign in again to continue.", {
        id: "session-expired",
      });
      hasShownToast.current = true;
    }
  }, [isExpired, isDeactivated]);

  return null;
}

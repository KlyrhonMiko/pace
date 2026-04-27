import { format } from "date-fns";

/**
 * Formats a date string or Date object into a premium human-readable format.
 * Example: "May 28, 2026 at 1:15 AM"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return "Not scheduled";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid date";

    return format(d, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Formats a date string or Date object into a friendly long format with weekday.
 * Example: "Wed, May 28, 2026"
 */
export function formatFriendlyDate(date: string | Date | null | undefined): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";

    return format(d, "EEE, MMM d, yyyy");
}

/**
 * Formats a date precisely for display in lists.
 * Example: "May 28, 1:15 AM"
 */
export function formatCompactDateTime(date: string | Date | null | undefined): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";

    return format(d, "MMM d, h:mm a");
}

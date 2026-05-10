import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-base-url";

export async function GET() {
    try {
        const res = await fetch(`${getApiBaseUrl()}/settings/platform/public`, {
            cache: "no-store",
        });
        const json = await res.json();
        return NextResponse.json(json.data ?? { maintenance_mode: false, public_registrations: true });
    } catch {
        // Fail open — don't break the home page if backend is down
        return NextResponse.json({ maintenance_mode: false, public_registrations: true });
    }
}

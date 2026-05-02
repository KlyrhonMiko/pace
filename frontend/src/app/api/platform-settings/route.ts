import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
    try {
        const res = await fetch(`${BACKEND}/settings/platform/public`, {
            cache: "no-store",
        });
        const json = await res.json();
        return NextResponse.json(json.data ?? { maintenance_mode: false, public_registrations: true });
    } catch {
        // Fail open — don't break the home page if backend is down
        return NextResponse.json({ maintenance_mode: false, public_registrations: true });
    }
}

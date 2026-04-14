import { NextRequest, NextResponse } from "next/server";
import { getCalls, getNotes, getTextMessages, getEmailMessages } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

interface ActivitySummary {
  timestamp: string;
  type: string;
}

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  try {
    const params = { limit: "200" };
    const [calls, notes, texts, emails] = await Promise.all([
      getCalls(auth, credentialId, params).catch(() => ({ calls: [] })),
      getNotes(auth, credentialId, params).catch(() => ({ notes: [] })),
      getTextMessages(auth, credentialId, params).catch(() => ({ textMessages: [] })),
      getEmailMessages(auth, credentialId, params).catch(() => ({ emailMessages: [] })),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extract = (result: any, key: string) => result[key] || result.data || [];

    const map = new Map<string, ActivitySummary>();

    const toIso = (v: string | number | undefined): string | undefined => {
      if (v == null) return undefined;
      if (typeof v === "number") {
        // Unix seconds (< 1e12) vs milliseconds
        return new Date(v < 1e12 ? v * 1000 : v).toISOString();
      }
      // If it's a string that looks like a plain number, parse it
      if (/^\d+$/.test(v)) {
        const n = Number(v);
        return new Date(n < 1e12 ? n * 1000 : n).toISOString();
      }
      return v;
    };

    const update = (personId: string | undefined, timestamp: string | number | undefined, type: string) => {
      if (!personId || !timestamp) return;
      const iso = toIso(timestamp);
      if (!iso) return;
      const existing = map.get(personId);
      if (!existing || new Date(iso) > new Date(existing.timestamp)) {
        map.set(personId, { timestamp: iso, type });
      }
    };

    for (const c of extract(calls, "calls")) {
      update(c.personId, c.created, "call");
    }
    for (const n of extract(notes, "notes")) {
      update(n.personId, n.created, "note");
    }
    for (const t of extract(texts, "textMessages")) {
      update(t.personId, t.created, "text");
    }
    for (const e of extract(emails, "emailMessages")) {
      update(e.personId, e.created, "email");
    }

    const result: Record<string, ActivitySummary> = Object.fromEntries(map);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch people activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}

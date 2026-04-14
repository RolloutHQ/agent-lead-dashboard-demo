import { NextRequest, NextResponse } from "next/server";
import { getCalls, getNotes, getTextMessages, getEmailMessages } from "@/lib/rollout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractData(result: any, key: string) {
  return result[key] || result.data || [];
}

export async function GET(request: NextRequest) {
  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  const personId = request.nextUrl.searchParams.get("personId");
  const params: Record<string, string> = {};
  if (personId) params.personId = personId;

  try {
    const [calls, notes, texts, emails] = await Promise.all([
      getCalls(credentialId, params).catch(() => ({ calls: [] })),
      getNotes(credentialId, params).catch(() => ({ notes: [] })),
      getTextMessages(credentialId, params).catch(() => ({ textMessages: [] })),
      getEmailMessages(credentialId, params).catch(() => ({ emailMessages: [] })),
    ]);

    return NextResponse.json({
      calls: extractData(calls, "calls"),
      notes: extractData(notes, "notes"),
      textMessages: extractData(texts, "textMessages"),
      emailMessages: extractData(emails, "emailMessages"),
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

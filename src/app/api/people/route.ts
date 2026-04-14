import { NextRequest, NextResponse } from "next/server";
import { getPeople } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  try {
    const params: Record<string, string> = {};
    const limit = request.nextUrl.searchParams.get("limit");
    const offset = request.nextUrl.searchParams.get("offset");
    params.limit = limit || "50";
    if (offset) params.offset = offset;

    const result = await getPeople(auth, credentialId, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = result as any;
    const normalized = {
      data: raw.people || raw.data || [],
      _metadata: raw._metadata,
    };
    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to fetch people:", error);
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 });
  }
}

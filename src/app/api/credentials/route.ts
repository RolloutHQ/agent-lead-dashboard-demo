import { NextRequest, NextResponse } from "next/server";
import { listCredentials } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  try {
    const credentials = await listCredentials(auth);
    return NextResponse.json(credentials);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch credentials";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

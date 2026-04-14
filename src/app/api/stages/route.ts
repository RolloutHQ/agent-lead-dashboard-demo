import { NextRequest, NextResponse } from "next/server";
import { getStages } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  try {
    const result = await getStages(auth, credentialId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = result as any;
    const stages = raw.stages || raw.data || (Array.isArray(raw) ? raw : []);
    return NextResponse.json({ data: stages });
  } catch (error) {
    console.error("Failed to fetch stages:", error);
    return NextResponse.json({ data: [] });
  }
}

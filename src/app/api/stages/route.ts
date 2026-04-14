import { NextRequest, NextResponse } from "next/server";
import { getStages } from "@/lib/rollout";

export async function GET(request: NextRequest) {
  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  try {
    const result = await getStages(credentialId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = result as any;
    const stages = raw.stages || raw.data || (Array.isArray(raw) ? raw : []);
    return NextResponse.json({ data: stages });
  } catch (error) {
    console.error("Failed to fetch stages:", error);
    return NextResponse.json({ data: [] });
  }
}

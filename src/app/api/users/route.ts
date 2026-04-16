import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  try {
    const result = await getUsers(auth, credentialId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = result as any;
    const users = raw.users || raw.data || (Array.isArray(raw) ? raw : []);
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ data: [] });
  }
}

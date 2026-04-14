import { NextRequest, NextResponse } from "next/server";
import { getPerson, getUser } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const personResult = await getPerson(auth, credentialId, id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = personResult as any;
    const person = raw.person || raw.data || raw;

    let assignedAgent = null;
    if (person.assignedUserId) {
      try {
        const userResult = await getUser(auth, credentialId, person.assignedUserId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRaw = userResult as any;
        assignedAgent = userRaw.user || userRaw.data || userRaw;
      } catch { /* ok */ }
    }

    return NextResponse.json({ person, assignedAgent });
  } catch (error) {
    console.error("Failed to fetch person:", error);
    return NextResponse.json({ error: "Failed to fetch person" }, { status: 500 });
  }
}

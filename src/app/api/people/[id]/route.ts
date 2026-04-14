import { NextRequest, NextResponse } from "next/server";
import { getPerson, getUser } from "@/lib/rollout";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const personResult = await getPerson(credentialId, id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const person = (personResult as any).person || (personResult as any).data || personResult;

    let assignedAgent = null;
    if (person.assignedUserId) {
      try {
        const userResult = await getUser(credentialId, person.assignedUserId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assignedAgent = (userResult as any).user || (userResult as any).data || userResult;
      } catch {
        // Agent lookup may fail
      }
    }

    return NextResponse.json({ person, assignedAgent });
  } catch (error) {
    console.error("Failed to fetch person:", error);
    return NextResponse.json({ error: "Failed to fetch person" }, { status: 500 });
  }
}

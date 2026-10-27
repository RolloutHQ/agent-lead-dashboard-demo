import { NextRequest, NextResponse } from "next/server";
import { getTransactions, getTmsPeopleByIds, getTmsUsersByIds } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";
import { personName, userName } from "@/lib/tms-format";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const credentialId = request.headers.get("x-credential-id");
  if (!credentialId) {
    return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });
  }

  try {
    const params: Record<string, string> = {
      limit: request.nextUrl.searchParams.get("limit") || "100",
    };
    const offset = request.nextUrl.searchParams.get("offset");
    if (offset) params.offset = offset;

    const result = await getTransactions(auth, credentialId, params);
    const transactions = result.transactions || [];

    const personIds = transactions.flatMap((t) => (t.peopleParticipants || []).map((p) => p.personId));
    const userIds = transactions.flatMap((t) => (t.userParticipants || []).map((u) => u.userId));
    const [people, users] = await Promise.all([
      getTmsPeopleByIds(auth, credentialId, personIds).catch(() => []),
      getTmsUsersByIds(auth, credentialId, userIds).catch(() => []),
    ]);

    return NextResponse.json({
      data: transactions,
      _metadata: result._metadata,
      names: {
        people: Object.fromEntries(people.map((p) => [p.id, personName(p)])),
        users: Object.fromEntries(users.map((u) => [u.id, userName(u)])),
      },
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

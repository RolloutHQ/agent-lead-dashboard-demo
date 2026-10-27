import { NextRequest, NextResponse } from "next/server";
import {
  getTransaction,
  getTmsPeopleByIds,
  getTmsUsersByIds,
  getTransactionNotes,
  getTransactionDocuments,
} from "@/lib/rollout";
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
    const transaction = await getTransaction(auth, credentialId, id);
    const personIds = (transaction.peopleParticipants || []).map((p) => p.personId);
    const userIds = (transaction.userParticipants || []).map((u) => u.userId);

    const [people, notes, documents] = await Promise.all([
      getTmsPeopleByIds(auth, credentialId, personIds).catch(() => []),
      getTransactionNotes(auth, credentialId, id),
      getTransactionDocuments(auth, credentialId, id),
    ]);

    const noteAuthorIds = notes.available ? notes.items.map((n) => n.createdByUserId || "") : [];
    const users = await getTmsUsersByIds(auth, credentialId, [...userIds, ...noteAuthorIds]).catch(() => []);

    return NextResponse.json({ transaction, people, users, notes, documents });
  } catch (error) {
    console.error("Failed to fetch transaction:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAppKeysForCategory, listCredentials } from "@/lib/rollout";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const category = request.nextUrl.searchParams.get("category") === "tms" ? "tms" : "crm";

  try {
    const [credentials, appKeys] = await Promise.all([
      listCredentials(auth),
      getAppKeysForCategory(category),
    ]);
    return NextResponse.json(
      credentials
        .filter((c) => appKeys.has(c.appKey))
        .map(({ id, appKey, label, createdAt }) => ({ id, appKey, label, createdAt }))
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch credentials";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

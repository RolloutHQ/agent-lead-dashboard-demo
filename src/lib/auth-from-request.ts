import { NextRequest, NextResponse } from "next/server";
import type { RolloutAuth } from "./rollout";

export function getAuth(request: NextRequest): RolloutAuth | null {
  const clientId = request.headers.get("x-rollout-client-id");
  const clientSecret = request.headers.get("x-rollout-client-secret");
  const consumerKey = request.headers.get("x-rollout-consumer-key");

  if (!clientId || !clientSecret || !consumerKey) return null;
  return { clientId, clientSecret, consumerKey };
}

export function missingAuthResponse() {
  return NextResponse.json(
    { error: "Missing Rollout credentials. Please configure Client ID, Client Secret, and Consumer Key." },
    { status: 401 }
  );
}

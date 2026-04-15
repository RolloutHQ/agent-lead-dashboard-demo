import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getAuth, missingAuthResponse } from "@/lib/auth-from-request";

export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) return missingAuthResponse();

  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: auth.clientId,
      sub: auth.consumerKey,
      iat: now,
      exp: now + 900,
    },
    auth.clientSecret,
    { algorithm: "HS512" }
  );

  return NextResponse.json({ token });
}

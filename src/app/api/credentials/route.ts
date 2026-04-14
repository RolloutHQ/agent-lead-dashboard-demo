import { NextResponse } from "next/server";
import { listCredentials } from "@/lib/rollout";

export async function GET() {
  try {
    const credentials = await listCredentials();
    return NextResponse.json(credentials);
  } catch (error) {
    console.error("Failed to fetch credentials:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

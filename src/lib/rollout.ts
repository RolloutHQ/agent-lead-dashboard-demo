import jwt from "jsonwebtoken";
import type {
  Person,
  Call,
  Note,
  TextMessage,
  EmailMessage,
  Stage,
  CrmUser,
  ApiListResponse,
} from "./types";

const CRM_BASE = "https://crm.universal.rollout.com/api";
const ROLLOUT_BASE = "https://universal.rollout.com/api";

export interface Credential {
  id: string;
  appKey: string;
  label?: string;
  createdAt: string;
}

function generateToken(): string {
  const clientId = process.env.ROLLOUT_CLIENT_ID!;
  const clientSecret = process.env.ROLLOUT_CLIENT_SECRET!;
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: clientId,
      sub: "user123",
      iat: now,
      exp: now + 900,
    },
    clientSecret,
    { algorithm: "HS512" }
  );
}

async function rolloutFetch<T>(
  path: string,
  credentialId: string,
  params?: Record<string, string>
): Promise<T> {
  const token = generateToken();
  const url = new URL(`${CRM_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Rollout-Credential-Id": credentialId,
      "Content-Type": "application/json",
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rollout API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getPeople(credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<Person>>("/people", credentialId, params);
}

export async function getPerson(credentialId: string, personId: string) {
  return rolloutFetch<{ data: Person }>(`/people/${personId}`, credentialId);
}

export async function getCalls(credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<Call>>("/calls", credentialId, params);
}

export async function getNotes(credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<Note>>("/notes", credentialId, params);
}

export async function getTextMessages(credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<TextMessage>>("/textMessages", credentialId, params);
}

export async function getEmailMessages(credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<EmailMessage>>("/emailMessages", credentialId, params);
}

export async function getStages(credentialId: string) {
  return rolloutFetch<ApiListResponse<Stage>>("/stages", credentialId);
}

export async function getUsers(credentialId: string) {
  return rolloutFetch<ApiListResponse<CrmUser>>("/users", credentialId);
}

export async function getUser(credentialId: string, userId: string) {
  return rolloutFetch<{ data: CrmUser }>(`/users/${userId}`, credentialId);
}

export async function listCredentials(): Promise<Credential[]> {
  const token = generateToken();
  const res = await fetch(`${ROLLOUT_BASE}/credentials`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rollout API error ${res.status}: ${text}`);
  }

  return res.json();
}

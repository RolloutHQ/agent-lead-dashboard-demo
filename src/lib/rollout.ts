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

export interface RolloutAuth {
  clientId: string;
  clientSecret: string;
  consumerKey: string;
}

function generateToken(auth: RolloutAuth): string {
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: auth.clientId,
      sub: auth.consumerKey,
      iat: now,
      exp: now + 900,
    },
    auth.clientSecret,
    { algorithm: "HS512" }
  );
}

async function rolloutFetch<T>(
  auth: RolloutAuth,
  path: string,
  credentialId: string,
  params?: Record<string, string>
): Promise<T> {
  const token = generateToken(auth);
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

export async function getPeople(auth: RolloutAuth, credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<Person>>(auth, "/people", credentialId, params);
}

export async function getPerson(auth: RolloutAuth, credentialId: string, personId: string) {
  return rolloutFetch<{ data: Person }>(auth, `/people/${personId}`, credentialId);
}

export async function getCalls(auth: RolloutAuth, credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<Call>>(auth, "/calls", credentialId, params);
}

export async function getNotes(auth: RolloutAuth, credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<Note>>(auth, "/notes", credentialId, params);
}

export async function getTextMessages(auth: RolloutAuth, credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<TextMessage>>(auth, "/textMessages", credentialId, params);
}

export async function getEmailMessages(auth: RolloutAuth, credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<ApiListResponse<EmailMessage>>(auth, "/emailMessages", credentialId, params);
}

export async function getStages(auth: RolloutAuth, credentialId: string) {
  return rolloutFetch<ApiListResponse<Stage>>(auth, "/stages", credentialId);
}

export async function getUsers(auth: RolloutAuth, credentialId: string) {
  return rolloutFetch<ApiListResponse<CrmUser>>(auth, "/users", credentialId);
}

export async function getUser(auth: RolloutAuth, credentialId: string, userId: string) {
  return rolloutFetch<{ data: CrmUser }>(auth, `/users/${userId}`, credentialId);
}

async function rolloutMutate<T>(
  auth: RolloutAuth,
  path: string,
  credentialId: string,
  method: "POST" | "PUT",
  body: Record<string, unknown>
): Promise<T> {
  const token = generateToken(auth);
  const url = `${CRM_BASE}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Rollout-Credential-Id": credentialId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rollout API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function createPerson(
  auth: RolloutAuth,
  credentialId: string,
  data: Record<string, unknown>
) {
  return rolloutMutate<{ id: string } & Record<string, unknown>>(
    auth,
    "/people",
    credentialId,
    "POST",
    data
  );
}

export async function updatePerson(
  auth: RolloutAuth,
  credentialId: string,
  personId: string,
  data: Record<string, unknown>
) {
  return rolloutMutate<{ id: string } & Record<string, unknown>>(
    auth,
    `/people/${personId}`,
    credentialId,
    "PUT",
    data
  );
}

export async function listCredentials(auth: RolloutAuth): Promise<Credential[]> {
  const token = generateToken(auth);
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

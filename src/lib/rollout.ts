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
  Transaction,
  TmsPerson,
  TmsUser,
  TransactionNote,
  TransactionDocument,
} from "./types";

const CRM_BASE = "https://crm.universal.rollout.com/api";
const TMS_BASE = "https://tms.universal.rollout.com/api";
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
  params?: Record<string, string>,
  base: string = CRM_BASE
): Promise<T> {
  const token = generateToken(auth);
  const url = new URL(`${base}${path}`);
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

export async function getTransactions(auth: RolloutAuth, credentialId: string, params?: Record<string, string>) {
  return rolloutFetch<{ transactions: Transaction[]; _metadata: ApiListResponse<Transaction>["_metadata"] }>(
    auth,
    "/transactions",
    credentialId,
    params,
    TMS_BASE
  );
}

export async function getTransaction(auth: RolloutAuth, credentialId: string, id: string): Promise<Transaction> {
  const raw = await rolloutFetch<{ transaction?: Transaction } & Transaction>(
    auth,
    `/transactions/${encodeURIComponent(id)}`,
    credentialId,
    undefined,
    TMS_BASE
  );
  return raw.transaction ?? raw;
}

async function getTmsByIds<T>(
  auth: RolloutAuth,
  credentialId: string,
  path: "/people" | "/users",
  collection: "people" | "users",
  ids: string[]
): Promise<T[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) batches.push(unique.slice(i, i + 50));
  const fetchBatches = (base: string) =>
    Promise.all(
      batches.map((batch) =>
        rolloutFetch<Record<string, T[]>>(auth, path, credentialId, { id: batch.join(","), limit: "100" }, base)
          .then((r) => r[collection] ?? [])
      )
    ).then((r) => r.flat());
  // Some connectors (e.g. Lofty) only expose people/users through the CRM API, with the same IDs.
  return fetchBatches(TMS_BASE).catch(() => fetchBatches(CRM_BASE));
}

export function getTmsPeopleByIds(auth: RolloutAuth, credentialId: string, ids: string[]) {
  return getTmsByIds<TmsPerson>(auth, credentialId, "/people", "people", ids);
}

export function getTmsUsersByIds(auth: RolloutAuth, credentialId: string, ids: string[]) {
  return getTmsByIds<TmsUser>(auth, credentialId, "/users", "users", ids);
}

export type Optional<T> = { available: true; items: T[] } | { available: false; reason: string };

async function getTmsForTransaction<T extends { transactionId?: string | null }>(
  auth: RolloutAuth,
  credentialId: string,
  path: string,
  collection: string,
  transactionId: string
): Promise<Optional<T>> {
  try {
    const r = await rolloutFetch<Record<string, T[]>>(
      auth,
      path,
      credentialId,
      { transactionId, limit: "100" },
      TMS_BASE
    );
    return { available: true, items: (r[collection] ?? []).filter((x) => x.transactionId === transactionId) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const match = msg.match(/"errorMessage":"([^"]+)"/);
    return { available: false, reason: match?.[1] ?? "Not available for this connection." };
  }
}

export function getTransactionNotes(auth: RolloutAuth, credentialId: string, transactionId: string) {
  return getTmsForTransaction<TransactionNote>(auth, credentialId, "/transaction-notes", "transactionNotes", transactionId);
}

export function getTransactionDocuments(auth: RolloutAuth, credentialId: string, transactionId: string) {
  return getTmsForTransaction<TransactionDocument>(auth, credentialId, "/documents", "documents", transactionId);
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

export type ApiCategory = "crm" | "tms";

export async function getAppKeysForCategory(category: ApiCategory): Promise<Set<string>> {
  const res = await fetch(`${ROLLOUT_BASE}/connectors`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rollout API error ${res.status}: ${text}`);
  }
  const connectors: Record<string, { entities?: Record<string, unknown> }> = await res.json();
  return new Set(
    Object.entries(connectors)
      .filter(([, c]) => c.entities?.[category])
      .map(([appKey]) => appKey)
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

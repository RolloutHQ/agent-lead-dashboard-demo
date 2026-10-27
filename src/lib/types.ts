export interface ContactInfo {
  value: string;
  type: string;
  status?: string;
  isPrimary?: boolean | null;
}

export interface Person {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  emails: ContactInfo[];
  phones: ContactInfo[];
  stage: string;
  stageId: string;
  source: string;
  assignedUserId: string;
  tags: string[];
  lastActivity: string;
  lastActivityType: string;
  created: string;
  updated: string;
  contactTypes?: string[];
  addresses?: { type: string; street: string; city: string; state: string; code: string }[];
}

export interface Call {
  id: string;
  personId: string;
  userId: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  isIncoming: boolean;
  outcome: string;
  note: string;
  created: string;
}

export interface Note {
  id: string;
  personId: string;
  body: string;
  subject: string;
  createdByUserId: string;
  created: string;
}

export interface TextMessage {
  id: string;
  personId: string;
  body: string;
  fromNumber: string;
  toNumber: string;
  created: string;
}

export interface EmailMessage {
  id: string;
  personId: string;
  subject: string;
  body: string;
  created: string;
}

export interface Stage {
  id: string;
  name: string;
  orderWeight: number;
}

export interface CrmUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type ActivityItem = {
  id: string;
  type: "call" | "note" | "text" | "email" | "stage_change";
  title: string;
  description: string;
  timestamp: string;
  personId?: string;
  userId?: string;
};

export interface LeadWithDetails extends Person {
  assignedAgent?: CrmUser;
  activities: ActivityItem[];
  crmSource?: string;
}

export interface Transaction {
  id: string;
  created: string;
  updated: string;
  transactionName?: string | null;
  transactionType?: string | null;
  status?: string | null;
  stage?: string | null;
  sideRepresented?: string | null;
  titleCompany?: string | null;
  mortgageCompany?: string | null;
  property?: {
    address?: { street?: string; city?: string; state?: string; code?: string; county?: string; country?: string } | null;
    mlsNumber?: string | null;
    price?: number | null;
    yearBuilt?: number | null;
  } | null;
  closingDate?: string | null;
  escrowClosingDate?: string | null;
  acceptanceDate?: string | null;
  expirationDate?: string | null;
  listingDate?: string | null;
  clientRepAgreementSignedDate?: string | null;
  totalCommissionRate?: number | null;
  totalCommissionAmount?: number | null;
  sellSideCommissionRate?: number | null;
  sellSideCommissionAmount?: number | null;
  buySideCommissionRate?: number | null;
  buySideCommissionAmount?: number | null;
  brokerageCommissionAmount?: number | null;
  referralAmount?: number | null;
  userParticipants?: { userId: string; roles?: string[] | null; totalCommissionAmount?: number | null }[] | null;
  peopleParticipants?: { personId: string; roles?: string[] | null }[] | null;
  source?: string | null;
  description?: string | null;
}

export interface TmsPerson {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emails?: ContactInfo[] | null;
  phones?: ContactInfo[] | null;
}

export interface TmsUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface TransactionNote {
  id: string;
  transactionId?: string | null;
  createdByUserId?: string | null;
  subject?: string | null;
  body?: string | null;
  isHtml?: boolean | null;
  created: string;
}

export interface TransactionDocument {
  id: string;
  transactionId?: string | null;
  name?: string | null;
  category?: string | null;
  status?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  isSigned?: boolean | null;
  created: string;
}

export interface ApiListResponse<T> {
  data: T[];
  _metadata: {
    offset: number;
    limit: number;
    total: number;
  };
}

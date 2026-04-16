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

export interface ApiListResponse<T> {
  data: T[];
  _metadata: {
    offset: number;
    limit: number;
    total: number;
  };
}

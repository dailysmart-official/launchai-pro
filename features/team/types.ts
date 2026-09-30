import type { Role } from "./schema";

export interface TeamMember {
  id: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "pending";
  joinedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  lastUsedAt: string | null;
  createdAt: string;
}

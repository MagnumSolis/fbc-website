// Shared data types. These mirror the Firestore documents described in firestore.rules.
export type Role = "founder" | "builder" | "explorer";

export interface Venture {
  id?: string;
  founderUid: string;
  founderName?: string;
  founderYear?: string;
  name: string;
  stage: number; // index into STAGES
  pitch: string;
  problem?: string;
  domains: string[];
  needs: string[];
  commitment?: string;
  equity?: string;
  status?: "live" | "paused" | "hidden";
  pitchNight?: boolean;
  updatedAt?: string;
}

export interface FbcEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  venue?: string;
  type: string;
  desc: string;
  published: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  org: string;
  type: string;
  mode?: string;
  duration?: string;
  stipend?: string;
  tags: string[];
  deadline?: string;
  url?: string;
  status: "live" | "hidden";
}

export interface Post {
  id: string;
  cat: string;
  title: string;
  author: string;
  date: string;
  read?: string;
  excerpt: string;
  body: string;
  featured?: boolean;
  published: boolean;
}

export interface Resource {
  id: string;
  shelf: string;
  title: string;
  desc: string;
  url?: string;
  order?: number;
  featured?: boolean;
}

export interface Member {
  uid: string;
  name: string;
  email: string;
  role: Role;
  year?: string;
  bio?: string;
  avail?: string;
  skills?: string[];
  domains?: string[];
  looking?: string;
}

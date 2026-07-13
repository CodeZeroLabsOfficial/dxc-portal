export type OrgRole = "admin" | "manager" | "staff";
export type ClientMemberRole = "admin" | "manager" | "staff";
export type ClientStatus = "active" | "inactive";

export type UserPreferences = {
  theme?: "light" | "dark" | "system";
  notifications?: {
    serviceRequestUpdates?: boolean;
    projectUpdates?: boolean;
    leaveApprovals?: boolean;
    emailDigest?: boolean;
  };
  display?: {
    showProjects?: boolean;
    showServiceRequests?: boolean;
    showCalendar?: boolean;
  };
};

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  coverURL?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  phone?: string | null;
  location?: string | null;
  skills?: string[];
  language?: string;
  role: OrgRole;
  activeClientId?: string | null;
  preferences?: UserPreferences;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type Client = {
  id: string;
  name: string;
  status: ClientStatus;
  logoURL?: string | null;
  color?: string | null;
  createdBy: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ClientMember = {
  userId: string;
  role: ClientMemberRole;
  createdBy: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ServiceRequestStage =
  | "created"
  | "in_progress"
  | "review"
  | "submitted"
  | "feedback"
  | "completed";

export const SERVICE_REQUEST_STAGE_PROGRESS: Record<ServiceRequestStage, number> = {
  created: 0,
  in_progress: 20,
  review: 40,
  submitted: 60,
  feedback: 80,
  completed: 100
};

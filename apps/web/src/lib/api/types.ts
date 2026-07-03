export interface MasterItem {
  id: string;
  masterTypeId: string;
  code: string;
  name: string;
  description?: string | null;
  colorHex?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  sortOrder: number;
  _count?: { items: number };
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  sortOrder: number;
  _count?: { users: number; rolePermissions: number };
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string | null;
}

export interface User {
  id: string;
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  roleId: string;
  role: Role;
  departmentId?: string | null;
  department?: MasterItem | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  productAccess?: { product: MasterItem }[];
  environmentAccess?: { environment: MasterItem }[];
  moduleAccess?: { module: MasterItem }[];
  permissions?: string[];
}

export interface Version {
  id: string;
  versionNumber: string;
  releaseName: string;
  releaseTitle?: string | null;
  releaseDescription?: string | null;
  releaseDate?: string | null;
  deploymentDate?: string | null;
  releaseTypeId: string;
  releaseType: MasterItem;
  environmentId: string;
  environment: MasterItem;
  productId: string;
  product: MasterItem;
  moduleId?: string | null;
  module?: MasterItem | null;
  priorityId?: string | null;
  priority?: MasterItem | null;
  severityId?: string | null;
  severity?: MasterItem | null;
  statusId: string;
  status: MasterItem;
  clientId?: string | null;
  client?: MasterItem | null;
  developerId?: string | null;
  developer?: UserSummary | null;
  testerId?: string | null;
  tester?: UserSummary | null;
  approvedById?: string | null;
  approvedBy?: UserSummary | null;
  gitCommitId?: string | null;
  gitBranch?: string | null;
  buildNumber?: string | null;
  sprintNumber?: string | null;
  ticketNumber?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  deploymentWindowStart?: string | null;
  deploymentWindowEnd?: string | null;
  downtimeMinutes?: number | null;
  rollbackAvailable: boolean;
  rollbackVersionId?: string | null;
  rollbackVersion?: { id: string; versionNumber: string; releaseName: string } | null;
  deploymentNotes?: string | null;
  databaseChanges?: string | null;
  apiChanges?: string | null;
  configurationChanges?: string | null;
  breakingChanges: boolean;
  backwardCompatible: boolean;
  releaseNotes?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { changeLogs: number; bugFixes: number; deploymentHistory: number };
  changeLogs?: ChangeLog[];
  bugFixes?: BugFix[];
  deploymentHistory?: DeploymentRecord[];
}

export interface ChangeLog {
  id: string;
  versionId: string;
  version?: { id: string; versionNumber: string; releaseName: string };
  title: string;
  description?: string | null;
  moduleId?: string | null;
  module?: MasterItem | null;
  screenName?: string | null;
  oldBehaviour?: string | null;
  newBehaviour?: string | null;
  reason?: string | null;
  businessRequirement?: string | null;
  ticketNumber?: string | null;
  developerId?: string | null;
  developer?: UserSummary | null;
  testerId?: string | null;
  tester?: UserSummary | null;
  reviewerId?: string | null;
  reviewer?: UserSummary | null;
  date?: string | null;
  statusId?: string | null;
  status?: MasterItem | null;
  createdAt: string;
}

export interface BugFix {
  id: string;
  bugCode: string;
  ticketNumber?: string | null;
  moduleId?: string | null;
  module?: MasterItem | null;
  issue: string;
  rootCause?: string | null;
  fixedById?: string | null;
  fixedBy?: UserSummary | null;
  testedById?: string | null;
  testedBy?: UserSummary | null;
  environmentId?: string | null;
  environment?: MasterItem | null;
  statusId?: string | null;
  status?: MasterItem | null;
  versionId?: string | null;
  version?: { id: string; versionNumber: string; releaseName: string } | null;
  severityId?: string | null;
  severity?: MasterItem | null;
  priorityId?: string | null;
  priority?: MasterItem | null;
  remarks?: string | null;
  createdAt: string;
}

export interface DeploymentRecord {
  id: string;
  versionId: string;
  version?: { id: string; versionNumber: string; releaseName: string; productId?: string };
  environmentId: string;
  environment: MasterItem;
  deployedAt: string;
  deployedById?: string | null;
  deployedBy?: UserSummary | null;
  durationMinutes?: number | null;
  result: "SUCCESS" | "FAILED" | "PARTIAL" | "ROLLED_BACK";
  rollback: boolean;
  remarks?: string | null;
}

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  category: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById?: string | null;
  uploadedBy?: UserSummary | null;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  entityType: "VERSION" | "BUG_FIX" | "DEPLOYMENT";
  entityId: string;
  action: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedById: string;
  requestedBy?: UserSummary;
  approverId?: string | null;
  approver?: UserSummary | null;
  comments?: string | null;
  requestedAt: string;
  decidedAt?: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  priority: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actor?: UserSummary | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId?: string | null;
  email: string;
  success: boolean;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure: boolean;
  smtpUser?: string | null;
  smtpFrom?: string | null;
  smtpPasswordSet: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordExpiryDays?: number | null;
  sessionTimeoutMinutes: number;
  maxUploadSizeMb: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

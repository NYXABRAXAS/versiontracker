import { api, qs } from "./client";
import type {
  Announcement,
  ApprovalRequest,
  Attachment,
  AuditLog,
  BugFix,
  ChangeLog,
  DeploymentRecord,
  LoginHistoryEntry,
  MasterItem,
  MasterType,
  Notification,
  Paginated,
  Permission,
  Role,
  SystemSettings,
  User,
  Version,
} from "./types";

export const authApi = {
  login: (email: string, password: string, rememberMe?: boolean) => api.post<User>("/auth/login", { email, password, rememberMe }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<User>("/auth/me"),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) => api.post<{ message: string }>("/auth/reset-password", { token, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) => api.post<{ message: string }>("/auth/change-password", { currentPassword, newPassword }),
};

export const mastersApi = {
  types: () => api.get<MasterType[]>("/masters/types"),
  itemsForType: (typeId: string) => api.get<MasterItem[]>(`/masters/types/${typeId}/items`),
  itemsByCode: (code: string, includeInactive = false) => api.get<MasterItem[]>(`/masters/items/by-code/${code}${qs({ includeInactive })}`),
  createType: (data: { code: string; name: string; description?: string }) => api.post<MasterType>("/masters/types", data),
  updateType: (id: string, data: Partial<{ name: string; description: string }>) => api.patch<MasterType>(`/masters/types/${id}`, data),
  removeType: (id: string) => api.delete(`/masters/types/${id}`),
  createItem: (data: Partial<MasterItem> & { masterTypeId: string; name: string }) => api.post<MasterItem>("/masters/items", data),
  updateItem: (id: string, data: Partial<MasterItem>) => api.patch<MasterItem>(`/masters/items/${id}`, data),
  removeItem: (id: string) => api.delete(`/masters/items/${id}`),
};

export const usersApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<User>>(`/users${qs(params)}`),
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: object) => api.post<User & { tempPassword?: string }>("/users", data),
  update: (id: string, data: object) => api.patch<User>(`/users/${id}`, data),
  enable: (id: string) => api.patch<User>(`/users/${id}/enable`),
  disable: (id: string) => api.patch<User>(`/users/${id}/disable`),
  remove: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, password?: string) =>
    api.post<{ success: boolean; tempPassword?: string }>(`/users/${id}/reset-password`, password ? { password } : undefined),
};

export const rolesApi = {
  list: () => api.get<Role[]>("/roles"),
  get: (id: string) => api.get<Role & { rolePermissions: { permission: Permission }[] }>(`/roles/${id}`),
  permissionCatalog: () => api.get<Permission[]>("/roles/permissions/catalog"),
  create: (data: { code: string; name: string; description?: string }) => api.post<Role>("/roles", data),
  update: (id: string, data: Partial<{ name: string; description: string }>) => api.patch<Role>(`/roles/${id}`, data),
  setPermissions: (id: string, permissionCodes: string[]) => api.patch(`/roles/${id}/permissions`, { permissionCodes }),
  remove: (id: string) => api.delete(`/roles/${id}`),
};

export const versionsApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<Version>>(`/versions${qs(params)}`),
  get: (id: string) => api.get<Version>(`/versions/${id}`),
  create: (data: object) => api.post<Version>("/versions", data),
  update: (id: string, data: object) => api.patch<Version>(`/versions/${id}`, data),
  remove: (id: string) => api.delete(`/versions/${id}`),
  rollback: (id: string, rollbackVersionId: string) => api.patch(`/versions/${id}/rollback`, { rollbackVersionId }),
  exportUrl: (params: Record<string, string | number | undefined>) => `/versions/export${qs(params)}`,
};

export const changeLogsApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<ChangeLog>>(`/change-logs${qs(params)}`),
  get: (id: string) => api.get<ChangeLog>(`/change-logs/${id}`),
  create: (data: object) => api.post<ChangeLog>("/change-logs", data),
  update: (id: string, data: object) => api.patch<ChangeLog>(`/change-logs/${id}`, data),
  remove: (id: string) => api.delete(`/change-logs/${id}`),
};

export const bugFixesApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<BugFix>>(`/bug-fixes${qs(params)}`),
  get: (id: string) => api.get<BugFix>(`/bug-fixes/${id}`),
  create: (data: object) => api.post<BugFix>("/bug-fixes", data),
  update: (id: string, data: object) => api.patch<BugFix>(`/bug-fixes/${id}`, data),
  remove: (id: string) => api.delete(`/bug-fixes/${id}`),
};

export const deploymentsApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<DeploymentRecord>>(`/deployments${qs(params)}`),
  pipeline: (versionId: string) => api.get<DeploymentRecord[]>(`/deployments/pipeline/${versionId}`),
  create: (data: object) => api.post<DeploymentRecord>("/deployments", data),
  remove: (id: string) => api.delete(`/deployments/${id}`),
};

export const attachmentsApi = {
  listForEntity: (entityType: string, entityId: string) => api.get<Attachment[]>(`/attachments${qs({ entityType, entityId })}`),
  upload: (entityType: string, entityId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Attachment>(`/attachments${qs({ entityType, entityId })}`, form, { isForm: true });
  },
  remove: (id: string) => api.delete(`/attachments/${id}`),
  downloadUrl: (id: string) => `/attachments/${id}/download`,
};

export const comparisonApi = {
  compare: (versionAId: string, versionBId: string) => api.get(`/comparison${qs({ versionAId, versionBId })}`),
};

export const releaseNotesApi = {
  get: (versionId: string) => api.get(`/release-notes/${versionId}`),
  exportUrl: (versionId: string, format: string) => `/release-notes/${versionId}/export${qs({ format })}`,
  email: (versionId: string, recipients: string[]) => api.post(`/release-notes/${versionId}/email`, { recipients }),
};

export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  charts: () => api.get("/dashboard/charts"),
  recentActivity: () => api.get<AuditLog[]>("/dashboard/recent-activity"),
  latestDeployments: () => api.get<DeploymentRecord[]>("/dashboard/latest-deployments"),
  pendingApprovals: () => api.get<ApprovalRequest[]>("/dashboard/pending-approvals"),
};

export const reportsApi = {
  build: (type: string, params: Record<string, string | undefined> = {}) => api.get<{ title: string; columns: { key: string; label: string }[]; rows: object[] }>(`/reports/${type}${qs(params)}`),
  exportUrl: (type: string, params: Record<string, string | undefined>) => `/reports/${type}/export${qs(params)}`,
};

export const searchApi = {
  search: (q: string) => api.get(`/search${qs({ q })}`),
};

export const auditLogsApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<AuditLog>>(`/audit-logs${qs(params)}`),
  exportUrl: (params: Record<string, string | number | undefined>) => `/audit-logs/export${qs(params)}`,
};

export const loginHistoryApi = {
  list: (params: Record<string, string | number | undefined> = {}) => api.get<Paginated<LoginHistoryEntry>>(`/login-history${qs(params)}`),
};

export const notificationsApi = {
  list: (params: Record<string, string | number | boolean | undefined> = {}) => api.get<Paginated<Notification> & { unreadCount: number }>(`/notifications${qs(params)}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch(`/notifications/read-all`),
};

export const settingsApi = {
  get: () => api.get<SystemSettings>("/settings"),
  update: (data: Partial<SystemSettings> & { smtpPassword?: string }) => api.patch<SystemSettings>("/settings", data),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append("logo", file);
    return api.post<{ logoUrl: string }>("/settings/logo", form, { isForm: true });
  },
};

export const approvalsApi = {
  list: (status?: string) => api.get<ApprovalRequest[]>(`/approvals${qs({ status })}`),
  create: (data: { entityType: string; entityId: string; action: string; comments?: string }) => api.post<ApprovalRequest>("/approvals", data),
  approve: (id: string, comments?: string) => api.patch<ApprovalRequest>(`/approvals/${id}/approve`, { comments }),
  reject: (id: string, comments?: string) => api.patch<ApprovalRequest>(`/approvals/${id}/reject`, { comments }),
};

export const announcementsApi = {
  list: () => api.get<Announcement[]>("/announcements"),
  active: () => api.get<Announcement[]>("/announcements/active"),
  create: (data: Partial<Announcement>) => api.post<Announcement>("/announcements", data),
  update: (id: string, data: Partial<Announcement>) => api.patch<Announcement>(`/announcements/${id}`, data),
  remove: (id: string) => api.delete(`/announcements/${id}`),
};

export const bookmarksApi = {
  list: () => api.get<Version[]>("/bookmarks"),
  toggle: (versionId: string) => api.post<{ bookmarked: boolean }>("/bookmarks/toggle", { versionId }),
};

export const calendarApi = {
  get: (dateFrom: string, dateTo: string) => api.get(`/calendar${qs({ dateFrom, dateTo })}`),
  freezeWindows: () => api.get("/calendar/freeze-windows"),
  createFreezeWindow: (data: object) => api.post("/calendar/freeze-windows", data),
  updateFreezeWindow: (id: string, data: object) => api.patch(`/calendar/freeze-windows/${id}`, data),
  removeFreezeWindow: (id: string) => api.delete(`/calendar/freeze-windows/${id}`),
};

export const backupApi = {
  list: () => api.get("/backup"),
  run: () => api.post("/backup/run"),
  downloadUrl: (id: string) => `/backup/${id}/download`,
};

export const healthApi = {
  get: () => api.get("/health"),
};

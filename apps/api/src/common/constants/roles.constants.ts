export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEV_LEAD: 'DEV_LEAD',
  DEVELOPER: 'DEVELOPER',
  QA_LEAD: 'QA_LEAD',
  QA_ENGINEER: 'QA_ENGINEER',
  UAT_COORDINATOR: 'UAT_COORDINATOR',
  SUPPORT_TEAM: 'SUPPORT_TEAM',
  READ_ONLY_USER: 'READ_ONLY_USER',
  CLIENT_VIEWER: 'CLIENT_VIEWER',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export const SEED_ROLES: { code: RoleCode; name: string; description: string; sortOrder: number }[] = [
  { code: ROLE_CODES.SUPER_ADMIN, name: 'Super Admin', description: 'Full unrestricted access to every module and setting.', sortOrder: 1 },
  { code: ROLE_CODES.ADMIN, name: 'Admin', description: 'Administers users, masters and day-to-day operations.', sortOrder: 2 },
  { code: ROLE_CODES.PROJECT_MANAGER, name: 'Project Manager', description: 'Oversees releases across products and approves release plans.', sortOrder: 3 },
  { code: ROLE_CODES.DEV_LEAD, name: 'Development Lead', description: 'Leads development, reviews and approves change logs.', sortOrder: 4 },
  { code: ROLE_CODES.DEVELOPER, name: 'Developer', description: 'Creates versions, change logs and bug fixes.', sortOrder: 5 },
  { code: ROLE_CODES.QA_LEAD, name: 'QA Lead', description: 'Leads QA sign-off and testing approvals.', sortOrder: 6 },
  { code: ROLE_CODES.QA_ENGINEER, name: 'QA Engineer', description: 'Tests versions and logs bug fixes.', sortOrder: 7 },
  { code: ROLE_CODES.UAT_COORDINATOR, name: 'UAT Coordinator', description: 'Coordinates UAT sign-off with client/bank stakeholders.', sortOrder: 8 },
  { code: ROLE_CODES.SUPPORT_TEAM, name: 'Support Team', description: 'Handles production support, hotfixes and incident tracking.', sortOrder: 9 },
  { code: ROLE_CODES.READ_ONLY_USER, name: 'Read Only User', description: 'View-only access across the portal.', sortOrder: 10 },
  { code: ROLE_CODES.CLIENT_VIEWER, name: 'Client Viewer', description: 'External bank/NBFC viewer scoped to their own client data.', sortOrder: 11 },
];

// Seed catalog for the generic Masters engine. MasterType rows marked isSystem
// cannot be deleted by Admin (only deactivated) since core screens depend on
// their code; MasterItem rows marked isSystem likewise. Everything else -
// new types, new items - Admin manages entirely through the UI, no code change.

export const MASTER_TYPE_CODES = {
  PRODUCT: 'PRODUCT',
  ENVIRONMENT: 'ENVIRONMENT',
  MODULE: 'MODULE',
  RELEASE_TYPE: 'RELEASE_TYPE',
  PRIORITY: 'PRIORITY',
  SEVERITY: 'SEVERITY',
  STATUS: 'STATUS',
  DEPARTMENT: 'DEPARTMENT',
  PROJECT: 'PROJECT',
  BRANCH: 'BRANCH',
  CLIENT: 'CLIENT',
} as const;

export const SEED_MASTER_TYPES: { code: string; name: string; sortOrder: number }[] = [
  { code: MASTER_TYPE_CODES.PRODUCT, name: 'Product', sortOrder: 1 },
  { code: MASTER_TYPE_CODES.ENVIRONMENT, name: 'Environment', sortOrder: 2 },
  { code: MASTER_TYPE_CODES.MODULE, name: 'Module', sortOrder: 3 },
  { code: MASTER_TYPE_CODES.RELEASE_TYPE, name: 'Release Type', sortOrder: 4 },
  { code: MASTER_TYPE_CODES.PRIORITY, name: 'Priority', sortOrder: 5 },
  { code: MASTER_TYPE_CODES.SEVERITY, name: 'Severity', sortOrder: 6 },
  { code: MASTER_TYPE_CODES.STATUS, name: 'Status', sortOrder: 7 },
  { code: MASTER_TYPE_CODES.DEPARTMENT, name: 'Department', sortOrder: 8 },
  { code: MASTER_TYPE_CODES.PROJECT, name: 'Project', sortOrder: 9 },
  { code: MASTER_TYPE_CODES.BRANCH, name: 'Branch', sortOrder: 10 },
  { code: MASTER_TYPE_CODES.CLIENT, name: 'Client', sortOrder: 11 },
];

export const SEED_PRODUCTS = [
  'New Two Wheeler',
  'Used Two Wheeler',
  'New Car',
  'Used Car',
  'New Commercial',
  'Used Commercial',
  'New Tractor',
  'Used Tractor',
  'Personal Loan',
  'Gold Loan',
  'LAP',
];

export const SEED_ENVIRONMENTS = [
  { name: 'Development (PRO)', code: 'DEV_PRO', colorHex: '#64748b' },
  { name: 'QA', code: 'QA', colorHex: '#0ea5e9' },
  { name: 'SIT', code: 'SIT', colorHex: '#6366f1' },
  { name: 'UAT', code: 'UAT', colorHex: '#f59e0b' },
  { name: 'Production', code: 'PRODUCTION', colorHex: '#16a34a' },
  { name: 'Hotfix', code: 'HOTFIX', colorHex: '#dc2626' },
  { name: 'Patch', code: 'PATCH', colorHex: '#db2777' },
  { name: 'Disaster Recovery', code: 'DR', colorHex: '#7c3aed' },
];

export const SEED_RELEASE_TYPES = [
  'Major Release',
  'Minor Release',
  'Patch',
  'Emergency Fix',
  'Bug Fix',
  'Hot Fix',
  'Security Update',
  'Enhancement',
  'Configuration Change',
  'Database Change',
  'API Change',
  'Rollback',
];

export const SEED_PRIORITIES = [
  { name: 'Critical', colorHex: '#dc2626' },
  { name: 'High', colorHex: '#f97316' },
  { name: 'Medium', colorHex: '#f59e0b' },
  { name: 'Low', colorHex: '#22c55e' },
];

export const SEED_SEVERITIES = [
  { name: 'Blocker', colorHex: '#7f1d1d' },
  { name: 'Critical', colorHex: '#dc2626' },
  { name: 'Major', colorHex: '#f97316' },
  { name: 'Minor', colorHex: '#eab308' },
  { name: 'Trivial', colorHex: '#84cc16' },
];

export const SEED_STATUSES = [
  { name: 'Draft', colorHex: '#94a3b8' },
  { name: 'Planned', colorHex: '#60a5fa' },
  { name: 'In Development', colorHex: '#6366f1' },
  { name: 'In QA', colorHex: '#0ea5e9' },
  { name: 'Ready for UAT', colorHex: '#f59e0b' },
  { name: 'In UAT', colorHex: '#eab308' },
  { name: 'Approved', colorHex: '#22c55e' },
  { name: 'Deployed', colorHex: '#16a34a' },
  { name: 'Rejected', colorHex: '#ef4444' },
  { name: 'Rolled Back', colorHex: '#7c3aed' },
  { name: 'On Hold', colorHex: '#64748b' },
  { name: 'Closed', colorHex: '#334155' },
];

export const SEED_DEPARTMENTS = ['Development', 'Quality Assurance', 'Project Management', 'Support', 'DevOps', 'Business Analysis'];

export const SEED_BRANCHES = ['main', 'develop', 'release', 'hotfix', 'staging'];

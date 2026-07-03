import { PrismaClient, ApprovalStatus, DeploymentResult } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  SEED_MASTER_TYPES,
  SEED_PRODUCTS,
  SEED_ENVIRONMENTS,
  SEED_RELEASE_TYPES,
  SEED_PRIORITIES,
  SEED_SEVERITIES,
  SEED_STATUSES,
  SEED_DEPARTMENTS,
  SEED_BRANCHES,
  MASTER_TYPE_CODES,
} from '../src/common/constants/masters.constants';
import { SEED_ROLES, ROLE_CODES, RoleCode } from '../src/common/constants/roles.constants';
import { PERMISSION_MODULES, PermissionModule, PermissionAction } from '../src/common/constants/permissions.constants';

const prisma = new PrismaClient();

function slugCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Which actions make sense for each module - drives the Permission catalog.
const MODULE_ACTIONS: Record<PermissionModule, PermissionAction[]> = {
  DASHBOARD: ['view'],
  USERS: ['view', 'create', 'edit', 'delete', 'export'],
  ROLES: ['view', 'create', 'edit', 'delete'],
  MASTERS: ['view', 'create', 'edit', 'delete', 'export'],
  VERSIONS: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  CHANGE_LOGS: ['view', 'create', 'edit', 'delete', 'export'],
  BUG_FIXES: ['view', 'create', 'edit', 'delete', 'export'],
  DEPLOYMENTS: ['view', 'create', 'edit', 'approve', 'export'],
  ATTACHMENTS: ['view', 'create', 'delete'],
  COMPARISON: ['view', 'export'],
  REPORTS: ['view', 'export'],
  AUDIT_LOGS: ['view', 'export'],
  LOGIN_HISTORY: ['view', 'export'],
  SETTINGS: ['view', 'edit'],
  APPROVALS: ['view', 'approve'],
  ANNOUNCEMENTS: ['view', 'create', 'edit', 'delete'],
  BOOKMARKS: ['view', 'create', 'delete'],
  CALENDAR: ['view', 'create', 'edit', 'delete'],
  SEARCH: ['view'],
  BACKUP: ['view', 'create', 'export'],
  NOTIFICATIONS: ['view', 'edit'],
};

// Which module:action pairs each role gets. ALL = every permission.
const ROLE_PERMISSIONS: Record<RoleCode, 'ALL' | Partial<Record<PermissionModule, PermissionAction[]>>> = {
  [ROLE_CODES.SUPER_ADMIN]: 'ALL',
  [ROLE_CODES.ADMIN]: 'ALL',
  [ROLE_CODES.PROJECT_MANAGER]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'create', 'edit', 'approve', 'export'],
    CHANGE_LOGS: ['view', 'export'],
    BUG_FIXES: ['view', 'export'],
    DEPLOYMENTS: ['view', 'approve', 'export'],
    ATTACHMENTS: ['view', 'create'],
    COMPARISON: ['view', 'export'],
    REPORTS: ['view', 'export'],
    APPROVALS: ['view', 'approve'],
    ANNOUNCEMENTS: ['view', 'create', 'edit', 'delete'],
    CALENDAR: ['view', 'create', 'edit', 'delete'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.DEV_LEAD]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'create', 'edit', 'approve', 'export'],
    CHANGE_LOGS: ['view', 'create', 'edit', 'delete', 'export'],
    BUG_FIXES: ['view', 'create', 'edit', 'export'],
    DEPLOYMENTS: ['view', 'create', 'edit', 'export'],
    ATTACHMENTS: ['view', 'create', 'delete'],
    COMPARISON: ['view', 'export'],
    REPORTS: ['view', 'export'],
    APPROVALS: ['view', 'approve'],
    CALENDAR: ['view', 'create', 'edit'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.DEVELOPER]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'create', 'edit', 'export'],
    CHANGE_LOGS: ['view', 'create', 'edit', 'export'],
    BUG_FIXES: ['view', 'create', 'edit', 'export'],
    DEPLOYMENTS: ['view'],
    ATTACHMENTS: ['view', 'create'],
    COMPARISON: ['view'],
    REPORTS: ['view'],
    CALENDAR: ['view'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.QA_LEAD]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'edit', 'approve', 'export'],
    CHANGE_LOGS: ['view', 'edit', 'export'],
    BUG_FIXES: ['view', 'create', 'edit', 'export'],
    DEPLOYMENTS: ['view', 'export'],
    ATTACHMENTS: ['view', 'create'],
    COMPARISON: ['view', 'export'],
    REPORTS: ['view', 'export'],
    APPROVALS: ['view', 'approve'],
    CALENDAR: ['view'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.QA_ENGINEER]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'export'],
    CHANGE_LOGS: ['view', 'export'],
    BUG_FIXES: ['view', 'create', 'edit', 'export'],
    DEPLOYMENTS: ['view'],
    ATTACHMENTS: ['view', 'create'],
    COMPARISON: ['view'],
    REPORTS: ['view'],
    CALENDAR: ['view'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.UAT_COORDINATOR]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'export'],
    CHANGE_LOGS: ['view'],
    BUG_FIXES: ['view', 'create', 'export'],
    DEPLOYMENTS: ['view', 'export'],
    ATTACHMENTS: ['view', 'create'],
    COMPARISON: ['view'],
    REPORTS: ['view', 'export'],
    APPROVALS: ['view', 'approve'],
    CALENDAR: ['view'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.SUPPORT_TEAM]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view', 'create', 'edit', 'export'],
    CHANGE_LOGS: ['view', 'create', 'export'],
    BUG_FIXES: ['view', 'create', 'edit', 'export'],
    DEPLOYMENTS: ['view', 'create', 'export'],
    ATTACHMENTS: ['view', 'create'],
    COMPARISON: ['view'],
    REPORTS: ['view', 'export'],
    CALENDAR: ['view'],
    BOOKMARKS: ['view', 'create', 'delete'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view', 'edit'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.READ_ONLY_USER]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view'],
    CHANGE_LOGS: ['view'],
    BUG_FIXES: ['view'],
    DEPLOYMENTS: ['view'],
    COMPARISON: ['view'],
    REPORTS: ['view'],
    CALENDAR: ['view'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view'],
    MASTERS: ['view'],
  },
  [ROLE_CODES.CLIENT_VIEWER]: {
    DASHBOARD: ['view'],
    VERSIONS: ['view'],
    CHANGE_LOGS: ['view'],
    DEPLOYMENTS: ['view'],
    COMPARISON: ['view'],
    REPORTS: ['view'],
    CALENDAR: ['view'],
    SEARCH: ['view'],
    NOTIFICATIONS: ['view'],
  },
};

async function seedPermissionsAndRoles() {
  const permissionByCode = new Map<string, string>(); // "MODULE:action" -> id

  for (const moduleName of PERMISSION_MODULES) {
    for (const action of MODULE_ACTIONS[moduleName]) {
      const perm = await prisma.permission.upsert({
        where: { module_action: { module: moduleName, action } },
        update: {},
        create: { module: moduleName, action, description: `${action} access to ${moduleName}` },
      });
      permissionByCode.set(`${moduleName}:${action}`, perm.id);
    }
  }

  const roleByCode = new Map<string, string>();
  for (const r of SEED_ROLES) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, sortOrder: r.sortOrder },
      create: { code: r.code, name: r.name, description: r.description, sortOrder: r.sortOrder, isSystem: true },
    });
    roleByCode.set(r.code, role.id);
  }

  for (const [roleCode, grant] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleByCode.get(roleCode)!;
    const codes: string[] =
      grant === 'ALL'
        ? Array.from(permissionByCode.keys())
        : Object.entries(grant).flatMap(([mod, actions]) => (actions as string[]).map((a) => `${mod}:${a}`));

    for (const code of codes) {
      const permissionId = permissionByCode.get(code);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  return roleByCode;
}

async function seedMasterType(code: string, name: string, sortOrder: number) {
  return prisma.masterType.upsert({
    where: { code },
    update: { name, sortOrder },
    create: { code, name, sortOrder, isSystem: true },
  });
}

async function seedItem(
  masterTypeId: string,
  name: string,
  opts: { code?: string; colorHex?: string; sortOrder?: number; isSystem?: boolean } = {},
) {
  const code = opts.code ?? slugCode(name);
  return prisma.masterItem.upsert({
    where: { masterTypeId_code: { masterTypeId, code } },
    update: { name, colorHex: opts.colorHex, sortOrder: opts.sortOrder ?? 0 },
    create: {
      masterTypeId,
      code,
      name,
      colorHex: opts.colorHex,
      sortOrder: opts.sortOrder ?? 0,
      isSystem: opts.isSystem ?? true,
    },
  });
}

type MasterItemRow = Awaited<ReturnType<typeof seedItem>>;

async function seedMasters() {
  const typeByCode = new Map<string, string>();
  for (const t of SEED_MASTER_TYPES) {
    const mt = await seedMasterType(t.code, t.name, t.sortOrder);
    typeByCode.set(t.code, mt.id);
  }

  const products: MasterItemRow[] = [];
  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    products.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.PRODUCT)!, SEED_PRODUCTS[i], { sortOrder: i }));
  }

  const environments: MasterItemRow[] = [];
  for (let i = 0; i < SEED_ENVIRONMENTS.length; i++) {
    const e = SEED_ENVIRONMENTS[i];
    environments.push(
      await seedItem(typeByCode.get(MASTER_TYPE_CODES.ENVIRONMENT)!, e.name, { code: e.code, colorHex: e.colorHex, sortOrder: i }),
    );
  }

  const releaseTypes: MasterItemRow[] = [];
  for (let i = 0; i < SEED_RELEASE_TYPES.length; i++) {
    releaseTypes.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.RELEASE_TYPE)!, SEED_RELEASE_TYPES[i], { sortOrder: i }));
  }

  const priorities: MasterItemRow[] = [];
  for (let i = 0; i < SEED_PRIORITIES.length; i++) {
    const p = SEED_PRIORITIES[i];
    priorities.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.PRIORITY)!, p.name, { colorHex: p.colorHex, sortOrder: i }));
  }

  const severities: MasterItemRow[] = [];
  for (let i = 0; i < SEED_SEVERITIES.length; i++) {
    const s = SEED_SEVERITIES[i];
    severities.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.SEVERITY)!, s.name, { colorHex: s.colorHex, sortOrder: i }));
  }

  const statuses: MasterItemRow[] = [];
  for (let i = 0; i < SEED_STATUSES.length; i++) {
    const s = SEED_STATUSES[i];
    statuses.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.STATUS)!, s.name, { colorHex: s.colorHex, sortOrder: i }));
  }

  const departments: MasterItemRow[] = [];
  for (let i = 0; i < SEED_DEPARTMENTS.length; i++) {
    departments.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.DEPARTMENT)!, SEED_DEPARTMENTS[i], { sortOrder: i }));
  }

  const branches: MasterItemRow[] = [];
  for (let i = 0; i < SEED_BRANCHES.length; i++) {
    branches.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.BRANCH)!, SEED_BRANCHES[i], { sortOrder: i }));
  }

  const SEED_CLIENTS = ['Horizon Bank', 'Prodata NBFC', 'Meridian Finance', 'Capital Trust Bank', 'Summit Credit Union'];
  const clients: MasterItemRow[] = [];
  for (let i = 0; i < SEED_CLIENTS.length; i++) {
    clients.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.CLIENT)!, SEED_CLIENTS[i], { sortOrder: i, isSystem: false }));
  }

  const SEED_PROJECTS = ['LOS Core Platform', 'Loan Origination Mobile App', 'Underwriting Engine', 'Bureau Integration'];
  const projects: MasterItemRow[] = [];
  for (let i = 0; i < SEED_PROJECTS.length; i++) {
    projects.push(
      await seedItem(typeByCode.get(MASTER_TYPE_CODES.PROJECT)!, SEED_PROJECTS[i], { sortOrder: i, isSystem: false }),
    );
  }

  const SEED_MODULES = [
    'Loan Application',
    'KYC & Document Verification',
    'Credit Bureau Integration',
    'Underwriting',
    'Sanction & Approval',
    'Disbursement',
    'Collections',
    'Reports & MIS',
    'User Management',
    'Notifications',
    'Payment Gateway',
    'Dealer Portal',
  ];
  const modules: MasterItemRow[] = [];
  for (let i = 0; i < SEED_MODULES.length; i++) {
    modules.push(await seedItem(typeByCode.get(MASTER_TYPE_CODES.MODULE)!, SEED_MODULES[i], { sortOrder: i, isSystem: false }));
  }

  return { products, environments, releaseTypes, priorities, severities, statuses, departments, branches, clients, projects, modules };
}

async function seedUsers(roleByCode: Map<string, string>, departments: { id: string }[]) {
  const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@company.com';
  const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@123';

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      employeeCode: 'EMP-0001',
      passwordHash: await hash(superAdminPassword),
      roleId: roleByCode.get(ROLE_CODES.SUPER_ADMIN)!,
      departmentId: departments[0]?.id,
      mustChangePassword: true,
      isActive: true,
    },
  });

  const demoUsers: { email: string; firstName: string; lastName: string; role: RoleCode; code: string }[] = [
    { email: 'admin2@company.com', firstName: 'Alice', lastName: 'Admin', role: ROLE_CODES.ADMIN, code: 'EMP-0002' },
    { email: 'pm@company.com', firstName: 'Priya', lastName: 'Menon', role: ROLE_CODES.PROJECT_MANAGER, code: 'EMP-0003' },
    { email: 'devlead@company.com', firstName: 'Rahul', lastName: 'Verma', role: ROLE_CODES.DEV_LEAD, code: 'EMP-0004' },
    { email: 'dev1@company.com', firstName: 'Sara', lastName: 'Khan', role: ROLE_CODES.DEVELOPER, code: 'EMP-0005' },
    { email: 'dev2@company.com', firstName: 'Arjun', lastName: 'Nair', role: ROLE_CODES.DEVELOPER, code: 'EMP-0006' },
    { email: 'qalead@company.com', firstName: 'Meera', lastName: 'Iyer', role: ROLE_CODES.QA_LEAD, code: 'EMP-0007' },
    { email: 'qa1@company.com', firstName: 'Karan', lastName: 'Shah', role: ROLE_CODES.QA_ENGINEER, code: 'EMP-0008' },
    { email: 'uat@company.com', firstName: 'Neha', lastName: 'Joshi', role: ROLE_CODES.UAT_COORDINATOR, code: 'EMP-0009' },
    { email: 'support@company.com', firstName: 'Vikram', lastName: 'Rao', role: ROLE_CODES.SUPPORT_TEAM, code: 'EMP-0010' },
    { email: 'viewer@company.com', firstName: 'Ananya', lastName: 'Gupta', role: ROLE_CODES.READ_ONLY_USER, code: 'EMP-0011' },
    { email: 'client@company.com', firstName: 'David', lastName: 'Client', role: ROLE_CODES.CLIENT_VIEWER, code: 'EMP-0012' },
  ];

  const users = [superAdmin];
  for (const u of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        employeeCode: u.code,
        passwordHash: await hash('Demo@123'),
        roleId: roleByCode.get(u.role)!,
        departmentId: departments[users.length % departments.length]?.id,
        mustChangePassword: false,
        isActive: true,
      },
    });
    users.push(created);
  }

  return users;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function seedVersionsAndActivity(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  users: { id: string }[],
) {
  const [superAdmin, admin, pm, devLead, dev1, dev2, qaLead, qa1, uat, support] = users;
  const developers = [dev1, dev2, devLead];
  const testers = [qa1, qaLead];
  const approvers = [pm, devLead, qaLead];

  const today = new Date();
  const statusesByName = (name: string) => masters.statuses.find((s) => s.name === name)!;
  const envByCode = (code: string) => masters.environments.find((e) => e.code === code)!;

  const versionSeeds = Array.from({ length: 18 }).map((_, i) => {
    const product = pick(masters.products, i);
    const env = pick(masters.environments, i + 1);
    const releaseType = pick(masters.releaseTypes, i + 2);
    const priority = pick(masters.priorities, i);
    const severity = pick(masters.severities, i + 1);
    const isDeployed = i % 3 !== 0;
    const status = isDeployed ? statusesByName('Deployed') : pick(masters.statuses, i);
    const developer = pick(developers, i);
    const tester = pick(testers, i);
    const approver = pick(approvers, i);
    const releaseDate = addDays(today, -30 + i * 2);
    const deploymentDate = isDeployed ? addDays(releaseDate, 1) : null;
    const major = 1 + Math.floor(i / 6);
    const minor = i % 6;

    return {
      versionNumber: `${major}.${minor}.0`,
      releaseName: `${product.name} Release ${major}.${minor}.0`,
      releaseTitle: `${releaseType.name} for ${product.name}`,
      releaseDescription: `${releaseType.name} covering enhancements and fixes to the ${product.name} workflow.`,
      releaseDate,
      deploymentDate,
      releaseTypeId: releaseType.id,
      environmentId: env.id,
      productId: product.id,
      moduleId: pick(masters.modules, i).id,
      priorityId: priority.id,
      severityId: severity.id,
      statusId: status.id,
      clientId: pick(masters.clients, i).id,
      developerId: developer.id,
      testerId: tester.id,
      approvedById: isDeployed ? approver.id : null,
      gitCommitId: `${Math.random().toString(16).slice(2, 9)}`,
      gitBranch: pick(['release/1.x', 'develop', 'hotfix/prod', 'release/2.x'], i),
      buildNumber: `BUILD-${1000 + i}`,
      sprintNumber: `Sprint-${20 + (i % 8)}`,
      ticketNumber: `LOS-${4000 + i}`,
      estimatedHours: 8 + (i % 5) * 4,
      actualHours: 6 + (i % 7) * 4,
      deploymentWindowStart: deploymentDate,
      deploymentWindowEnd: deploymentDate ? addDays(deploymentDate, 0) : null,
      downtimeMinutes: isDeployed ? (i % 4) * 5 : null,
      rollbackAvailable: i % 5 === 0,
      deploymentNotes: isDeployed ? 'Deployed during approved maintenance window. No incidents reported.' : null,
      databaseChanges: i % 4 === 0 ? 'Added new indexed columns to loan_application table.' : null,
      apiChanges: i % 3 === 0 ? 'New /v2/applications/status endpoint added.' : null,
      configurationChanges: i % 6 === 0 ? 'Updated bureau integration timeout to 30s.' : null,
      breakingChanges: i % 9 === 0,
      backwardCompatible: i % 9 !== 0,
      releaseNotes: `## ${product.name} ${major}.${minor}.0\n\n- ${releaseType.name}\n- Reviewed and approved by QA and Project Management.`,
      remarks: 'Seeded demo release for portal walkthrough.',
      createdById: developer.id,
      env,
    };
  });

  const versions: Array<Awaited<ReturnType<typeof prisma.version.upsert>> & { env: (typeof masters.environments)[number] }> = [];
  for (const v of versionSeeds) {
    const { env, ...data } = v;
    const created = await prisma.version.upsert({
      where: { versionNumber_productId_environmentId: { versionNumber: data.versionNumber, productId: data.productId, environmentId: data.environmentId } },
      update: {},
      create: data,
    });
    versions.push({ ...created, env });
  }

  // Change logs
  let clIndex = 0;
  for (const version of versions) {
    const count = 1 + (clIndex % 3);
    for (let j = 0; j < count; j++) {
      await prisma.changeLog.create({
        data: {
          versionId: version.id,
          title: `Update ${j + 1} in ${version.releaseName}`,
          description: 'Improved validation and error messaging for the affected screen.',
          moduleId: pick(masters.modules, clIndex + j).id,
          screenName: pick(['Application Form', 'Document Upload', 'Approval Queue', 'Disbursement Screen'], clIndex + j),
          oldBehaviour: 'Field allowed invalid values without inline validation.',
          newBehaviour: 'Field now validates in real time with clear inline error messages.',
          reason: 'Reduce data entry errors reported by branch users.',
          businessRequirement: 'BRD-' + (100 + clIndex),
          ticketNumber: `LOS-${5000 + clIndex}`,
          developerId: version.developerId,
          testerId: version.testerId,
          reviewerId: version.approvedById,
          date: version.releaseDate,
          statusId: statusesByName(version.deploymentDate ? 'Deployed' : 'In QA').id,
          createdById: version.developerId,
        },
      });
      clIndex++;
    }
  }

  // Bug fixes
  let bugIndex = 0;
  for (const version of versions) {
    if (bugIndex % 2 === 0) {
      await prisma.bugFix.create({
        data: {
          bugCode: `BUG-${1000 + bugIndex}`,
          ticketNumber: `LOS-${6000 + bugIndex}`,
          moduleId: pick(masters.modules, bugIndex).id,
          issue: 'Application submission fails when co-applicant details are incomplete.',
          rootCause: 'Missing server-side null check on co-applicant payload.',
          fixedById: version.developerId,
          testedById: version.testerId,
          environmentId: version.environmentId,
          statusId: statusesByName('Closed').id,
          versionId: version.id,
          severityId: pick(masters.severities, bugIndex).id,
          priorityId: pick(masters.priorities, bugIndex).id,
          remarks: 'Verified in regression pass.',
          createdById: version.testerId,
        },
      });
    }
    bugIndex++;
  }

  // Deployment history: PRO -> QA -> UAT -> Production pipeline for deployed versions
  const pipeline = ['DEV_PRO', 'QA', 'UAT', 'PRODUCTION'];
  for (const version of versions) {
    if (!version.deploymentDate) continue;
    let ts = addDays(version.releaseDate!, -6);
    for (const code of pipeline) {
      const env = envByCode(code);
      ts = addDays(ts, 2);
      await prisma.deploymentHistory.create({
        data: {
          versionId: version.id,
          environmentId: env.id,
          deployedAt: ts,
          deployedById: version.developerId,
          durationMinutes: 15 + Math.floor(Math.random() * 40),
          result: DeploymentResult.SUCCESS,
          rollback: false,
          remarks: `Deployed to ${env.name} successfully.`,
        },
      });
      if (env.id === version.environmentId) break;
    }
  }

  // A couple of pending approval requests for the workflow demo
  for (const version of versions.slice(0, 3)) {
    await prisma.approvalRequest.create({
      data: {
        entityType: 'VERSION',
        entityId: version.id,
        action: 'APPROVE_RELEASE',
        status: ApprovalStatus.PENDING,
        requestedById: version.developerId!,
        comments: 'Please review and approve for UAT sign-off.',
      },
    });
  }

  return versions;
}

async function seedSettingsAndAnnouncements(superAdminId: string) {
  await prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      companyName: 'Horizon ProData',
      companyEmail: 'info@horizonprodata.com',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER,
      smtpFrom: process.env.SMTP_FROM,
      updatedById: superAdminId,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Welcome to the LOS Version Management Portal',
      message: 'Track every release across Development, UAT and Production from one place. Reach out to the Admin team for access requests.',
      priority: 'INFO',
      createdById: superAdminId,
    },
  });
}

async function main() {
  console.log('Seeding permissions & roles...');
  const roleByCode = await seedPermissionsAndRoles();

  console.log('Seeding masters...');
  const masters = await seedMasters();

  console.log('Seeding users...');
  const users = await seedUsers(roleByCode, masters.departments);

  console.log('Seeding versions, change logs, bug fixes, deployments...');
  await seedVersionsAndActivity(masters, users);

  console.log('Seeding settings & announcements...');
  await seedSettingsAndAnnouncements(users[0].id);

  console.log('Seed complete.');
  console.log(`Super Admin login: ${users[0].email} / ${process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@123'} (must change password on first login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

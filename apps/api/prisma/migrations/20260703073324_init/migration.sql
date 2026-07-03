-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalEntityType" AS ENUM ('VERSION', 'BUG_FIX', 'DEPLOYMENT');

-- CreateEnum
CREATE TYPE "DeploymentResult" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RELEASE_APPROVED', 'RELEASE_DEPLOYED', 'ROLLBACK', 'VERSION_CREATED', 'PASSWORD_RESET', 'USER_CREATED', 'DEPLOYMENT_FAILED', 'APPROVAL_REQUESTED', 'ANNOUNCEMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'ROLE_CHANGE', 'DEPLOYMENT', 'APPROVE', 'REJECT', 'RESTORE');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('VERSION', 'CHANGE_LOG', 'BUG_FIX', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('IMAGE', 'PDF', 'WORD', 'EXCEL', 'ZIP', 'LOG', 'SQL', 'APK', 'IPA', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "lastPasswordChangeAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_product_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_product_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_environment_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_environment_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_module_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "replacedByTokenHash" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "master_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_items" (
    "id" TEXT NOT NULL,
    "masterTypeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorHex" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "master_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versions" (
    "id" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "releaseName" TEXT NOT NULL,
    "releaseTitle" TEXT,
    "releaseDescription" TEXT,
    "releaseDate" TIMESTAMP(3),
    "deploymentDate" TIMESTAMP(3),
    "releaseTypeId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "moduleId" TEXT,
    "priorityId" TEXT,
    "severityId" TEXT,
    "statusId" TEXT NOT NULL,
    "clientId" TEXT,
    "developerId" TEXT,
    "testerId" TEXT,
    "approvedById" TEXT,
    "gitCommitId" TEXT,
    "gitBranch" TEXT,
    "buildNumber" TEXT,
    "sprintNumber" TEXT,
    "ticketNumber" TEXT,
    "estimatedHours" DECIMAL(8,2),
    "actualHours" DECIMAL(8,2),
    "deploymentWindowStart" TIMESTAMP(3),
    "deploymentWindowEnd" TIMESTAMP(3),
    "downtimeMinutes" INTEGER,
    "rollbackAvailable" BOOLEAN NOT NULL DEFAULT false,
    "rollbackVersionId" TEXT,
    "deploymentNotes" TEXT,
    "databaseChanges" TEXT,
    "apiChanges" TEXT,
    "configurationChanges" TEXT,
    "breakingChanges" BOOLEAN NOT NULL DEFAULT false,
    "backwardCompatible" BOOLEAN NOT NULL DEFAULT true,
    "releaseNotes" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_logs" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "moduleId" TEXT,
    "screenName" TEXT,
    "oldBehaviour" TEXT,
    "newBehaviour" TEXT,
    "reason" TEXT,
    "businessRequirement" TEXT,
    "ticketNumber" TEXT,
    "developerId" TEXT,
    "testerId" TEXT,
    "reviewerId" TEXT,
    "date" TIMESTAMP(3),
    "statusId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_fixes" (
    "id" TEXT NOT NULL,
    "bugCode" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "moduleId" TEXT,
    "issue" TEXT NOT NULL,
    "rootCause" TEXT,
    "fixedById" TEXT,
    "testedById" TEXT,
    "environmentId" TEXT,
    "statusId" TEXT,
    "versionId" TEXT,
    "severityId" TEXT,
    "priorityId" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bug_fixes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_history" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deployedById" TEXT,
    "durationMinutes" INTEGER,
    "result" "DeploymentResult" NOT NULL DEFAULT 'SUCCESS',
    "rollback" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "deployment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" "AttachmentCategory" NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "entityType" "ApprovalEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "approverId" TEXT,
    "comments" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'INFO',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_freeze_windows" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "environmentId" TEXT,
    "productId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "release_freeze_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'Our Company',
    "companyLogoUrl" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpUser" TEXT,
    "smtpPasswordEnc" TEXT,
    "smtpFrom" TEXT,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordRequireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireSymbol" BOOLEAN NOT NULL DEFAULT true,
    "passwordExpiryDays" INTEGER,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxUploadSizeMb" INTEGER NOT NULL DEFAULT 25,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_history" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "status" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "backup_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeCode_key" ON "users"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_product_access_userId_productId_key" ON "user_product_access"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "user_environment_access_userId_environmentId_key" ON "user_environment_access"("userId", "environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_access_userId_moduleId_key" ON "user_module_access"("userId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "login_history_userId_idx" ON "login_history"("userId");

-- CreateIndex
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "master_types_code_key" ON "master_types"("code");

-- CreateIndex
CREATE INDEX "master_items_masterTypeId_idx" ON "master_items"("masterTypeId");

-- CreateIndex
CREATE INDEX "master_items_parentId_idx" ON "master_items"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "master_items_masterTypeId_code_key" ON "master_items"("masterTypeId", "code");

-- CreateIndex
CREATE INDEX "versions_productId_idx" ON "versions"("productId");

-- CreateIndex
CREATE INDEX "versions_environmentId_idx" ON "versions"("environmentId");

-- CreateIndex
CREATE INDEX "versions_releaseTypeId_idx" ON "versions"("releaseTypeId");

-- CreateIndex
CREATE INDEX "versions_statusId_idx" ON "versions"("statusId");

-- CreateIndex
CREATE INDEX "versions_releaseDate_idx" ON "versions"("releaseDate");

-- CreateIndex
CREATE INDEX "versions_rollbackVersionId_idx" ON "versions"("rollbackVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "versions_versionNumber_productId_environmentId_key" ON "versions"("versionNumber", "productId", "environmentId");

-- CreateIndex
CREATE INDEX "change_logs_versionId_idx" ON "change_logs"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "bug_fixes_bugCode_key" ON "bug_fixes"("bugCode");

-- CreateIndex
CREATE INDEX "bug_fixes_versionId_idx" ON "bug_fixes"("versionId");

-- CreateIndex
CREATE INDEX "bug_fixes_statusId_idx" ON "bug_fixes"("statusId");

-- CreateIndex
CREATE INDEX "deployment_history_versionId_idx" ON "deployment_history"("versionId");

-- CreateIndex
CREATE INDEX "deployment_history_environmentId_idx" ON "deployment_history"("environmentId");

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "approval_requests_entityType_entityId_idx" ON "approval_requests"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_versionId_key" ON "bookmarks"("userId", "versionId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product_access" ADD CONSTRAINT "user_product_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_product_access" ADD CONSTRAINT "user_product_access_productId_fkey" FOREIGN KEY ("productId") REFERENCES "master_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_environment_access" ADD CONSTRAINT "user_environment_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_environment_access" ADD CONSTRAINT "user_environment_access_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "master_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_access" ADD CONSTRAINT "user_module_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_access" ADD CONSTRAINT "user_module_access_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "master_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_items" ADD CONSTRAINT "master_items_masterTypeId_fkey" FOREIGN KEY ("masterTypeId") REFERENCES "master_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_items" ADD CONSTRAINT "master_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_releaseTypeId_fkey" FOREIGN KEY ("releaseTypeId") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_severityId_fkey" FOREIGN KEY ("severityId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_rollbackVersionId_fkey" FOREIGN KEY ("rollbackVersionId") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_fixedById_fkey" FOREIGN KEY ("fixedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_severityId_fkey" FOREIGN KEY ("severityId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_fixes" ADD CONSTRAINT "bug_fixes_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "master_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_history" ADD CONSTRAINT "deployment_history_deployedById_fkey" FOREIGN KEY ("deployedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_freeze_windows" ADD CONSTRAINT "release_freeze_windows_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_freeze_windows" ADD CONSTRAINT "release_freeze_windows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "master_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

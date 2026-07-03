import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MastersModule } from './masters/masters.module';
import { VersionsModule } from './versions/versions.module';
import { ChangeLogsModule } from './change-logs/change-logs.module';
import { BugFixesModule } from './bug-fixes/bug-fixes.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ComparisonModule } from './comparison/comparison.module';
import { ReleaseNotesModule } from './release-notes/release-notes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { LoginHistoryModule } from './login-history/login-history.module';
import { SettingsModule } from './settings/settings.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CalendarModule } from './calendar/calendar.module';
import { HealthModule } from './health/health.module';
import { BackupModule } from './backup/backup.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    MailModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MastersModule,
    VersionsModule,
    ChangeLogsModule,
    BugFixesModule,
    DeploymentsModule,
    AttachmentsModule,
    ComparisonModule,
    ReleaseNotesModule,
    DashboardModule,
    ReportsModule,
    SearchModule,
    AuditLogsModule,
    LoginHistoryModule,
    SettingsModule,
    ApprovalsModule,
    AnnouncementsModule,
    BookmarksModule,
    CalendarModule,
    HealthModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}

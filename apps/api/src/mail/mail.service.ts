import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '../config/configuration';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<AppConfig, true>,
  ) {}

  private async getTransportSettings() {
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    const envSmtp = this.configService.get('smtp', { infer: true });
    return {
      host: settings?.smtpHost || envSmtp.host,
      port: settings?.smtpPort || envSmtp.port,
      secure: settings?.smtpSecure ?? envSmtp.secure,
      user: settings?.smtpUser || envSmtp.user,
      password: envSmtp.password, // stored SMTP password kept in env only, never round-tripped to the client
      from: settings?.smtpFrom || envSmtp.from || 'LOS Version Portal <no-reply@example.com>',
    };
  }

  async sendMail(to: string, subject: string, html: string, template?: string): Promise<boolean> {
    const cfg = await this.getTransportSettings();
    let status: 'SENT' | 'FAILED' = 'SENT';
    let error: string | undefined;

    if (!cfg.host) {
      status = 'FAILED';
      error = 'SMTP host not configured';
      this.logger.warn(`Email not sent (SMTP not configured): "${subject}" -> ${to}`);
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host: cfg.host,
          port: cfg.port,
          secure: cfg.secure,
          auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
        });
        await transporter.sendMail({ from: cfg.from, to, subject, html });
      } catch (e) {
        status = 'FAILED';
        error = e instanceof Error ? e.message : 'Unknown error';
        this.logger.error(`Failed to send email to ${to}: ${error}`);
      }
    }

    await this.prisma.emailLog.create({ data: { toEmail: to, subject, template, status, error } });
    return status === 'SENT';
  }

  async sendPasswordResetEmail(to: string, firstName: string, rawToken: string) {
    const webUrl = this.configService.get('webUrl', { infer: true });
    const link = `${webUrl}/reset-password/${rawToken}`;
    return this.sendMail(
      to,
      'Reset your LOS Version Portal password',
      `<p>Hi ${firstName},</p><p>We received a request to reset your password. This link expires in 60 minutes:</p>
       <p><a href="${link}">${link}</a></p><p>If you did not request this, you can ignore this email.</p>`,
      'password-reset',
    );
  }

  async sendUserCreatedEmail(to: string, firstName: string, tempPassword: string) {
    const webUrl = this.configService.get('webUrl', { infer: true });
    return this.sendMail(
      to,
      'Your LOS Version Portal account has been created',
      `<p>Hi ${firstName},</p><p>An account has been created for you on the LOS Version Management Portal.</p>
       <p>Email: ${to}<br/>Temporary password: <b>${tempPassword}</b></p>
       <p>Please <a href="${webUrl}/login">log in</a> and change your password immediately.</p>`,
      'user-created',
    );
  }

  async sendReleaseNotificationEmail(to: string, subject: string, message: string) {
    return this.sendMail(to, subject, `<p>${message}</p>`, 'release-notification');
  }
}

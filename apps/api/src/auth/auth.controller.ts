import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { setAuthCookies, clearAuthCookies } from './cookie.util';
import { AppConfig } from '../config/configuration';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService<AppConfig, true>,
  ) {}

  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    const user = await this.authService.validateCredentials(dto.email, dto.password, meta);
    const tokens = await this.authService.issueTokens(user as any, { ...meta, rememberMe: dto.rememberMe });
    setAuthCookies(res, tokens, this.configService.get('cookie', { infer: true }));
    return this.authService.getProfile(user.id);
  }

  @Public()
  @SkipCsrf()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, tokenRecord } = req.user as any;
    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    const tokens = await this.authService.rotateRefreshToken(user, tokenRecord.id, tokenRecord.tokenHash, meta);
    setAuthCookies(res, tokens, this.configService.get('cookie', { infer: true }));
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const meta = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
    await this.authService.logout(user?.id, req.cookies?.refresh_token, meta);
    clearAuthCookies(res);
    return { success: true };
  }

  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset. You can now log in.' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { message: 'Password changed successfully.' };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}

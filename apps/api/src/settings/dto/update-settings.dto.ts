import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() companyEmail?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() smtpHost?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() smtpPort?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() smtpSecure?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() smtpUser?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() smtpPassword?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() smtpFrom?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() passwordMinLength?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() passwordRequireUppercase?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() passwordRequireNumber?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() passwordRequireSymbol?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() passwordExpiryDays?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sessionTimeoutMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() maxUploadSizeMb?: number;
}

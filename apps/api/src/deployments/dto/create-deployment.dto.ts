import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { DeploymentResult } from '@prisma/client';

export class CreateDeploymentDto {
  @ApiProperty()
  @IsUUID()
  versionId!: string;

  @ApiProperty()
  @IsUUID()
  environmentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deployedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deployedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: DeploymentResult, default: DeploymentResult.SUCCESS })
  @IsOptional()
  @IsEnum(DeploymentResult)
  result?: DeploymentResult;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rollback?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

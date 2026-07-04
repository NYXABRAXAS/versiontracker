import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty()
  @IsString()
  versionNumber!: string;

  @ApiProperty()
  @IsString()
  releaseName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  releaseTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  releaseDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deploymentDate?: Date;

  @ApiProperty()
  @IsUUID()
  releaseTypeId!: string;

  @ApiProperty()
  @IsUUID()
  environmentId!: string;

  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  priorityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  severityId?: string;

  @ApiProperty()
  @IsUUID()
  statusId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  developerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  testerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  approvedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gitCommitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gitBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sprintNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deploymentWindowStart?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deploymentWindowEnd?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  downtimeMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rollbackAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rollbackVersionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deploymentNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  databaseChanges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiChanges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  configurationChanges?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  breakingChanges?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  backwardCompatible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

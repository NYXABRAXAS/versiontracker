import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBugFixDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty()
  @IsString()
  issue!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fixedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  testedById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  statusId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  versionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  severityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  priorityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

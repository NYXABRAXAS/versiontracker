import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChangeLogDto {
  @ApiProperty()
  @IsUUID()
  versionId!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  screenName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oldBehaviour?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newBehaviour?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessRequirement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ticketNumber?: string;

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
  reviewerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  statusId?: string;
}

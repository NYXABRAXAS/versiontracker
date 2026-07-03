import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApprovalEntityType } from '@prisma/client';

export class CreateApprovalDto {
  @ApiProperty({ enum: ApprovalEntityType })
  @IsEnum(ApprovalEntityType)
  entityType!: ApprovalEntityType;

  @ApiProperty()
  @IsString()
  entityId!: string;

  @ApiProperty()
  @IsString()
  action!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}

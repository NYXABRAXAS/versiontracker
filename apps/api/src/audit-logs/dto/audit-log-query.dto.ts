import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuditAction } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() actorId?: string;
  @ApiPropertyOptional({ enum: AuditAction }) @IsOptional() @IsEnum(AuditAction) action?: AuditAction;
  @ApiPropertyOptional() @IsOptional() @IsString() entityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
}

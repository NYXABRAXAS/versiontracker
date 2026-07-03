import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class VersionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() environmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() releaseTypeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() priorityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() severityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() developerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() testerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
}

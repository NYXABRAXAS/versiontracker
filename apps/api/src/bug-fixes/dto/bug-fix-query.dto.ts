import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class BugFixQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() versionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() severityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() priorityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() environmentId?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ChangeLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() versionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() moduleId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() developerId?: string;
}

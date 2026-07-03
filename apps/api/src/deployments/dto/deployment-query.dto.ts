import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DeploymentResult } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class DeploymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() versionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() environmentId?: string;
  @ApiPropertyOptional({ enum: DeploymentResult }) @IsOptional() @IsEnum(DeploymentResult) result?: DeploymentResult;
}

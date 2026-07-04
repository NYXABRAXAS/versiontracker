import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFreezeWindowDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

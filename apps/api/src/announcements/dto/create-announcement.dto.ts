import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({ enum: ['INFO', 'WARNING', 'CRITICAL'] })
  @IsOptional()
  @IsIn(['INFO', 'WARNING', 'CRITICAL'])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

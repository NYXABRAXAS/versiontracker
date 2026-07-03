import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAnnouncementDto } from './create-announcement.dto';

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

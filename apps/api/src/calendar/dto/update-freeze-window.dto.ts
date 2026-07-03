import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateFreezeWindowDto } from './create-freeze-window.dto';

export class UpdateFreezeWindowDto extends PartialType(CreateFreezeWindowDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

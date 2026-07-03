import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { AttachmentEntityType } from '@prisma/client';

export class AttachmentQueryDto {
  @ApiProperty({ enum: AttachmentEntityType })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty()
  @IsString()
  entityId!: string;
}

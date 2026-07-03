import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateChangeLogDto } from './create-change-log.dto';

export class UpdateChangeLogDto extends PartialType(OmitType(CreateChangeLogDto, ['versionId'] as const)) {}

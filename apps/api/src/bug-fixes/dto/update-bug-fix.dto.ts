import { PartialType } from '@nestjs/swagger';
import { CreateBugFixDto } from './create-bug-fix.dto';

export class UpdateBugFixDto extends PartialType(CreateBugFixDto) {}

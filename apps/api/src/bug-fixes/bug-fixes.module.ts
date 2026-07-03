import { Module } from '@nestjs/common';
import { BugFixesController } from './bug-fixes.controller';
import { BugFixesService } from './bug-fixes.service';

@Module({
  controllers: [BugFixesController],
  providers: [BugFixesService],
  exports: [BugFixesService],
})
export class BugFixesModule {}

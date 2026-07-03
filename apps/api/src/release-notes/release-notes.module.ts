import { Module } from '@nestjs/common';
import { ReleaseNotesController } from './release-notes.controller';
import { ReleaseNotesService } from './release-notes.service';

@Module({
  controllers: [ReleaseNotesController],
  providers: [ReleaseNotesService],
})
export class ReleaseNotesModule {}

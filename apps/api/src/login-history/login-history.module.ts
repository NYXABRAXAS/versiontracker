import { Module } from '@nestjs/common';
import { LoginHistoryController } from './login-history.controller';
import { LoginHistoryService } from './login-history.service';

@Module({
  controllers: [LoginHistoryController],
  providers: [LoginHistoryService],
})
export class LoginHistoryModule {}

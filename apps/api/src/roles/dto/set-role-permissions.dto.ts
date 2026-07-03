import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'Permission codes in the form MODULE:action' })
  @IsArray()
  @IsString({ each: true })
  permissionCodes!: string[];
}

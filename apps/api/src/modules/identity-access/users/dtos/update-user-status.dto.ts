import { IsEnum } from 'class-validator';
import { UserStatus } from '../types/user-status';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus, { message: 'El status del usuario no es valido' })
  status: UserStatus;
}

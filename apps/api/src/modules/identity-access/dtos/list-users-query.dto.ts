import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../types/user-status';

export class ListUsersQueryDto {
  @IsOptional()
  @IsString({ message: 'El search debe ser una cadena de texto' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'El email debe ser una cadena de texto' })
  email?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'El status del usuario no es valido' })
  status?: UserStatus;

  @IsOptional()
  @IsString({ message: 'El page debe ser una cadena de texto' })
  page?: string;

  @IsOptional()
  @IsString({ message: 'El limit debe ser una cadena de texto' })
  limit?: string;
}

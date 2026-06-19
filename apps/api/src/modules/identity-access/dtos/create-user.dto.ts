import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../types/user-status';

export class CreateUserDto {
  @IsEmail({}, { message: 'El email debe ser valido' })
  email: string;

  @IsOptional()
  @IsString({ message: 'El password debe ser una cadena de texto' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El firstName debe ser una cadena de texto' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El lastName debe ser una cadena de texto' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'El displayName debe ser una cadena de texto' })
  displayName?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'El status del usuario no es valido' })
  status?: UserStatus;
}

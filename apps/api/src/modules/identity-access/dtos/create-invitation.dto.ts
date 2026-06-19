import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail({}, { message: 'El email debe ser valido' })
  email: string;

  @IsOptional()
  @IsUUID('4', { message: 'El organizationId debe ser un UUID valido' })
  organizationId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El teamId debe ser un UUID valido' })
  teamId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El roleId debe ser un UUID valido' })
  roleId?: string;

  @IsOptional()
  @IsString({ message: 'El expiresAt debe ser una cadena de texto' })
  expiresAt?: string;

  @IsOptional()
  @IsString({ message: 'El redirectUrl debe ser una cadena de texto' })
  redirectUrl?: string;

  @IsOptional()
  @IsString({ message: 'El message debe ser una cadena de texto' })
  message?: string;
}

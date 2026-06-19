import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMembershipDto {
  @IsUUID('4', { message: 'El userId debe ser un UUID valido' })
  userId: string;

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
  @IsString({ message: 'El status debe ser una cadena de texto' })
  status?: string;
}

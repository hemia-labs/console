import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TenantStatus } from '../types/tenant-status';

export class UpdateTenantDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El slug debe ser una cadena de texto' })
  slug?: string;

  @IsOptional()
  @IsEnum(TenantStatus, { message: 'El status del tenant no es valido' })
  status?: TenantStatus;

  @IsOptional()
  @IsString({ message: 'El plan debe ser una cadena de texto' })
  plan?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ownerUserId debe ser un UUID valido' })
  ownerUserId?: string;
}

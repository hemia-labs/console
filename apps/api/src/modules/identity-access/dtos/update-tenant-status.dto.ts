import { IsEnum } from 'class-validator';
import { TenantStatus } from '../types/tenant-status';

export class UpdateTenantStatusDto {
  @IsEnum(TenantStatus, { message: 'El status del tenant no es valido' })
  status: TenantStatus;
}

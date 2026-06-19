import { IsUUID } from 'class-validator';

export class TenantParamDto {
  @IsUUID('4', { message: 'El id del tenant debe ser un UUID valido' })
  id: string;
}

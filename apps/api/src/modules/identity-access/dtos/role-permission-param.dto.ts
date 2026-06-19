import { IsUUID } from 'class-validator';

export class RolePermissionParamDto {
  @IsUUID('4', { message: 'El id del role debe ser un UUID valido' })
  id: string;

  @IsUUID('4', { message: 'El permissionId debe ser un UUID valido' })
  permissionId: string;
}

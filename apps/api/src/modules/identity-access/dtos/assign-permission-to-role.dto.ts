import { IsUUID } from 'class-validator';

export class AssignPermissionToRoleDto {
  @IsUUID('4', { message: 'El permissionId debe ser un UUID valido' })
  permissionId: string;
}

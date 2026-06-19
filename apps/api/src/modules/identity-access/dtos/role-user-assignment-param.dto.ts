import { IsUUID } from 'class-validator';

export class RoleUserAssignmentParamDto {
  @IsUUID('4', { message: 'El userId debe ser un UUID valido' })
  userId: string;

  @IsUUID('4', { message: 'El roleId debe ser un UUID valido' })
  roleId: string;
}

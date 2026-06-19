import { IsUUID } from 'class-validator';

export class AssignRoleToUserDto {
  @IsUUID('4', { message: 'El roleId debe ser un UUID valido' })
  roleId: string;
}

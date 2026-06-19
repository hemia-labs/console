import { IsUUID } from 'class-validator';

export class RoleUserParamDto {
  @IsUUID('4', { message: 'El userId debe ser un UUID valido' })
  userId: string;
}

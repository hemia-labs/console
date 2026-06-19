import { IsUUID } from 'class-validator';

export class RoleParamDto {
  @IsUUID('4', { message: 'El id del role debe ser un UUID valido' })
  id: string;
}

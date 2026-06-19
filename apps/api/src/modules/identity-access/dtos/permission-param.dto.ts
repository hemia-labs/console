import { IsUUID } from 'class-validator';

export class PermissionParamDto {
  @IsUUID('4', { message: 'El id del permission debe ser un UUID valido' })
  id: string;
}

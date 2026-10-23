import { IsUUID } from 'class-validator';

export class UserParamDto {
  @IsUUID('4', { message: 'El id del usuario debe ser un UUID valido' })
  id: string;
}

import { IsUUID } from 'class-validator';

export class TeamParamDto {
  @IsUUID('4', { message: 'El id del equipo debe ser un UUID valido' })
  id: string;
}

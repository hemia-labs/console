import { IsUUID } from 'class-validator';

export class MembershipParamDto {
  @IsUUID('4', { message: 'El id de la membresia debe ser un UUID valido' })
  id: string;
}

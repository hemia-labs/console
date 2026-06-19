import { IsUUID } from 'class-validator';

export class InvitationParamDto {
  @IsUUID('4', { message: 'El id de la invitacion debe ser un UUID valido' })
  id: string;
}

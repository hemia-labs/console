import { IsUUID } from 'class-validator';

export class SsoClientParamDto {
  @IsUUID('4', { message: 'El id del SSO client debe ser un UUID valido' })
  id: string;
}

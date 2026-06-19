import { IsUUID } from 'class-validator';

export class OAuthClientParamDto {
  @IsUUID('4', { message: 'El id del OAuth client debe ser un UUID valido' })
  id: string;
}

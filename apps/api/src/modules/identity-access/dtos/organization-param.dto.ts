import { IsUUID } from 'class-validator';

export class OrganizationParamDto {
  @IsUUID('4', { message: 'El id de la organizacion debe ser un UUID valido' })
  id: string;
}

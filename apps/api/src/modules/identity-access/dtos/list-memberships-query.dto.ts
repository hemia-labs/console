import { IsOptional, IsUUID } from 'class-validator';

export class ListMembershipsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El userId debe ser un UUID valido' })
  userId?: string;
}

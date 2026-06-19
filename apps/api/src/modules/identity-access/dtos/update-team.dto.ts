import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTeamDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El organizationId debe ser un UUID valido' })
  organizationId?: string;

  @IsOptional()
  @IsString({ message: 'El slug debe ser una cadena de texto' })
  slug?: string;

  @IsOptional()
  @IsString({ message: 'La descripcion debe ser una cadena de texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El status debe ser una cadena de texto' })
  status?: string;
}

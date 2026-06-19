import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'El name debe ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El description debe ser una cadena de texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El key debe ser una cadena de texto' })
  key?: string;

  @IsOptional()
  @IsString({ message: 'El scope debe ser una cadena de texto' })
  scope?: string;

  @IsOptional()
  @IsBoolean({ message: 'El isSystem debe ser booleano' })
  isSystem?: boolean;
}

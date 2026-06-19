import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString({ message: 'El key debe ser una cadena de texto' })
  key: string;

  @IsOptional()
  @IsString({ message: 'El description debe ser una cadena de texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El resource debe ser una cadena de texto' })
  resource?: string;

  @IsOptional()
  @IsString({ message: 'El action debe ser una cadena de texto' })
  action?: string;
}

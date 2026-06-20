import { IsNotEmpty, IsString } from 'class-validator';

export class ExternalUserSubParamDto {
  @IsString({ message: 'El sub debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El sub no puede estar vacio' })
  sub: string;
}

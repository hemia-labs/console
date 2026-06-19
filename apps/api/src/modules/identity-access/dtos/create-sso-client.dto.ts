import { IsArray, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { SsoClientStatus } from '../types/sso-client-status';

export class CreateSsoClientDto {
  @IsString({ message: 'El clientId debe ser una cadena de texto' })
  clientId: string;

  @IsString({ message: 'El name debe ser una cadena de texto' })
  name: string;

  @IsArray({ message: 'El allowedRedirectUris debe ser un arreglo' })
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { each: true, message: 'Cada allowedRedirectUri debe ser una URL valida' },
  )
  allowedRedirectUris: string[];

  @IsOptional()
  @IsArray({ message: 'El allowedOrigins debe ser un arreglo' })
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { each: true, message: 'Cada allowedOrigin debe ser una URL valida' },
  )
  allowedOrigins?: string[];

  @IsOptional()
  @IsEnum(SsoClientStatus, {
    message: 'El status del SSO client no es valido',
  })
  status?: SsoClientStatus;
}

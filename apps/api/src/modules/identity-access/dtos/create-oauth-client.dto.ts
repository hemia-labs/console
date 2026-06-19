import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { OAuthClientStatus } from '../types/oauth-client-status';
import { OAuthClientType } from '../types/oauth-client-type';

export class CreateOAuthClientDto {
  @IsString({ message: 'El clientId debe ser una cadena de texto' })
  clientId: string;

  @IsString({ message: 'El audience debe ser una cadena de texto' })
  audience: string;

  @IsEnum(OAuthClientType, { message: 'El type del OAuth client no es valido' })
  type: OAuthClientType;

  @IsOptional()
  @IsArray({ message: 'El redirectUris debe ser un arreglo' })
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { each: true, message: 'Cada redirectUri debe ser una URL valida' },
  )
  redirectUris?: string[];

  @IsOptional()
  @IsArray({ message: 'El grantTypes debe ser un arreglo' })
  @IsString({ each: true, message: 'Cada grantType debe ser texto' })
  grantTypes?: string[];

  @IsOptional()
  @IsArray({ message: 'El responseTypes debe ser un arreglo' })
  @IsString({ each: true, message: 'Cada responseType debe ser texto' })
  responseTypes?: string[];

  @IsOptional()
  @IsArray({ message: 'El scopes debe ser un arreglo' })
  @IsString({ each: true, message: 'Cada scope debe ser texto' })
  scopes?: string[];

  @IsOptional()
  @IsBoolean({ message: 'El requiresConsent debe ser booleano' })
  requiresConsent?: boolean;

  @IsOptional()
  @IsEnum(OAuthClientStatus, {
    message: 'El status del OAuth client no es valido',
  })
  status?: OAuthClientStatus;
}

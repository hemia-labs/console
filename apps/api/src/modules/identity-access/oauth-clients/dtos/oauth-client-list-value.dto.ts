import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class OAuthClientListValueDto {
  @IsString({ message: 'El value debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El value no puede estar vacio' })
  value: string;
}

export class OAuthClientRedirectUriValueDto extends OAuthClientListValueDto {
  @IsUrl(
    { require_protocol: true, require_tld: false },
    { message: 'El value debe ser una URL valida' },
  )
  declare value: string;
}

import {
  IsUrl,
  MaxLength,
  Matches,
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';
export class OAuthClientDestinationDto {
  @IsUrl({
    require_tld: false,
    protocols: ['https', 'http'],
    require_protocol: true,
  })
  @MaxLength(2048)
  @Matches(/^[^#]+$/)
  resource: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  audience: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @Matches(/^[\x21\x23-\x5B\x5D-\x7E]+$/, { each: true })
  @MaxLength(160, { each: true })
  scopes: string[];
}

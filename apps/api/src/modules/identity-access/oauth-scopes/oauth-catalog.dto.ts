import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsString,
  Length,
  Matches,
} from 'class-validator';
export class SaveOAuthScopeDto {
  @IsString()
  @Length(1, 160)
  @Matches(/^[\x21\x23-\x5B\x5D-\x7E]+$/)
  code: string;
  @IsString() @Length(1, 200) name: string;
  @IsString() @Length(0, 2000) description: string;
  @IsBoolean() enabled: boolean;
}
export class SaveOAuthApiDto {
  @IsString() @Length(1, 200) name: string;
  @IsString() @Length(1, 160) @Matches(/^\S+$/) audience: string;
  @IsString() @Length(1, 2048) resource: string;
  @IsBoolean() enabled: boolean;
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 160, { each: true })
  scopes: string[];
}

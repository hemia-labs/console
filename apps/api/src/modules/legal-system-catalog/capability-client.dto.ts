import {
  Matches,
  Length,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';
export class CreateCapabilityClientDto {
  @Matches(/^[a-z][a-zA-Z0-9_]{1,79}$/) capabilityCode: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @Matches(/^[a-z][a-z0-9_-]{1,79}$/, { each: true })
  roles: string[];
  @IsString()
  @Length(2, 120)
  @Matches(/^[a-z0-9][a-z0-9._-]+$/)
  clientId: string;
}

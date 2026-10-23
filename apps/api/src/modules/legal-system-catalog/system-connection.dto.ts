import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  IsUrl,
  ValidateNested,
} from 'class-validator';
export class ConnectionCapabilityDto {
  @Matches(/^[a-z][a-zA-Z0-9_]{1,79}$/) code: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  functions: string[];
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
}
export class ConnectionPaymentsDto {
  @IsOptional()
  @IsUrl({
    require_tld: false,
    protocols: ['https', 'http'],
    require_protocol: true,
  })
  @Length(1, 2048)
  backendBaseUrl?: string;
  @IsString() @Length(1, 80) productCode: string;
  @IsOptional()
  @IsIn(['organizations', 'all_for_allowed_products'])
  organizationScope?: 'organizations' | 'all_for_allowed_products';
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  organizationIds?: string[];
  @IsOptional()
  @IsUrl({
    require_tld: false,
    protocols: ['https', 'http'],
    require_protocol: true,
  })
  @Length(1, 2048)
  successUrl?: string;
  @IsOptional()
  @IsUrl({
    require_tld: false,
    protocols: ['https', 'http'],
    require_protocol: true,
  })
  @Length(1, 2048)
  cancelUrl?: string;
  @IsOptional() @Matches(/^[a-z][a-z0-9_-]{1,79}$/) receiverService?: string;
  @IsOptional() @Matches(/^[a-z][a-z0-9_-]{1,79}$/) checkService?: string;
}
export class ConnectionLegalDto {
  @IsUUID() applicationId: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  documentIds: string[];
}
export class SystemConnectionDto {
  @IsUUID() systemId: string;
  @IsOptional() @IsString() @Length(2, 120) clientId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ConnectionCapabilityDto)
  capabilities: ConnectionCapabilityDto[];
  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectionPaymentsDto)
  payments?: ConnectionPaymentsDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectionLegalDto)
  legal?: ConnectionLegalDto;
}

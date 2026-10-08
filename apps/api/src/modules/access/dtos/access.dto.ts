import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ListOrganizationsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateOrganizationDto {
  @IsString()
  code: string;

  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class MembershipIdentityDto {
  @IsString()
  issuer: string;

  @IsString()
  subject_id: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateMembershipDto {
  @ValidateNested()
  @Type(() => MembershipIdentityDto)
  identity: MembershipIdentityDto;

  @IsOptional()
  @IsIn(['member', 'owner'])
  membership_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  role_codes?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateMembershipDto {
  @IsOptional()
  @IsIn(['member', 'owner'])
  membership_type?: string;

  @IsOptional()
  @IsString()
  expires_at?: string;

  @IsInt()
  @Min(1)
  version: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateRoleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['organization'])
  scope?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: string;
}

export class AssignRoleDto {
  @IsString()
  roleCode: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class CreateProductDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['internal', 'customer', 'mixed'])
  audience?: string;

  @IsOptional()
  @IsIn(['manual', 'event_driven', 'api_callback', 'none'])
  provisioning_mode?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['internal', 'customer', 'mixed'])
  audience?: string;

  @IsOptional()
  @IsIn(['manual', 'event_driven', 'api_callback', 'none'])
  provisioning_mode?: string;

  @IsOptional()
  @IsIn(['active', 'deprecated', 'disabled'])
  status?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class EnableProductDto {
  @IsOptional()
  @IsIn(['manual', 'billing', 'contract', 'migration', 'internal'])
  source?: string;

  @IsOptional()
  @IsString()
  entitlement_reference?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  identity_issuer_hint?: string;

  @IsOptional()
  @IsString()
  product_code?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  role_codes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expires_in_hours?: number;
}

import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessContextError, type AuthenticatedUser } from '@hemia/auth';
import { AccessClient, type RequestAuthContext } from '@hemia/auth/nestjs';
import type { Request } from 'express';

export type ConsoleRequest = Request & {
  user?: AuthenticatedUser;
  ssoAuth?: RequestAuthContext;
};

const unavailable = () =>
  new ServiceUnavailableException({
    code: 'access_unavailable',
    message: 'Console authorization unavailable',
  });
const denied = () =>
  new ForbiddenException({
    code: 'access_denied',
    message: 'Platform superadministrator access required',
  });
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

@Injectable()
export class ConsoleAuthorizationService {
  constructor(
    private readonly accessClient: AccessClient,
    private readonly config: ConfigService,
  ) {}

  async accessTokenFor(request: ConsoleRequest): Promise<string> {
    if (!request.user?.sub || !request.ssoAuth?.accessToken)
      throw new UnauthorizedException('Missing authenticated session');
    try {
      return await this.accessClient.exchangeUserToken(
        request.ssoAuth.accessToken,
      );
    } catch (error) {
      if (
        error instanceof AccessContextError &&
        [401, 403].includes(error.status)
      )
        throw denied();
      throw unavailable();
    }
  }

  async authorize(request: ConsoleRequest): Promise<void> {
    if (!request.user?.sub || !request.ssoAuth?.accessToken) {
      throw new UnauthorizedException('Missing authenticated session');
    }

    let context: unknown;
    let token: string;
    try {
      token = await this.accessClient.exchangeUserToken(
        request.ssoAuth.accessToken,
      );
      context = await this.accessClient.getContext(token, 'console');
    } catch (error) {
      if (
        error instanceof AccessContextError &&
        [401, 403].includes(error.status)
      ) {
        throw denied();
      }
      // Exchange/configuration/transport failures do not expire the local session.
      throw unavailable();
    }

    if (
      !record(context) ||
      !record(context.identity) ||
      !nonempty(context.identity.issuer) ||
      !nonempty(context.identity.subject_id) ||
      !nonempty(context.identity.identity_reference_id) ||
      !Array.isArray(context.organizations)
    ) {
      throw unavailable();
    }
    if (
      context.identity.issuer !==
        this.config.getOrThrow<string>('sso.issuer') ||
      context.identity.issuer !== request.user.iss ||
      context.identity.subject_id !== request.user.sub
    ) {
      throw denied();
    }

    for (const organization of context.organizations) {
      if (
        !record(organization) ||
        !nonempty(organization.organization_id) ||
        !nonempty(organization.membership_id) ||
        !nonempty(organization.organization_status) ||
        !nonempty(organization.membership_status) ||
        !strings(organization.roles) ||
        !strings(organization.permissions) ||
        (organization.product != null &&
          (!record(organization.product) ||
            !nonempty(organization.product.code) ||
            !nonempty(organization.product.status)))
      ) {
        throw unavailable();
      }
    }

    // The unsigned context discovers memberships; only verified claims authorize.
    for (const organization of context.organizations as Record<
      string,
      unknown
    >[]) {
      if (
        organization.organization_status !== 'active' ||
        organization.membership_status !== 'active' ||
        !record(organization.product) ||
        organization.product.code !== 'console' ||
        organization.product.status !== 'enabled'
      ) {
        continue;
      }

      let claims: unknown;
      try {
        claims = await this.accessClient.resolveSystemContext(token, {
          organization_id: organization.organization_id as string,
          product_code: 'console',
          audience: 'console-api',
        });
      } catch (error) {
        if (
          error instanceof AccessContextError &&
          [401, 403].includes(error.status)
        ) {
          continue;
        }
        throw unavailable();
      }

      if (
        !record(claims) ||
        claims.contract_version !== 1 ||
        !Number.isSafeInteger(claims.context_version) ||
        (claims.context_version as number) < 0 ||
        !strings(claims.global_roles) ||
        !strings(claims.permissions) ||
        !nonempty(claims.identity_issuer) ||
        !nonempty(claims.identity_reference_id) ||
        !nonempty(claims.organization_id) ||
        !nonempty(claims.membership_id) ||
        !nonempty(claims.organization_status) ||
        !nonempty(claims.membership_status) ||
        !nonempty(claims.product_code) ||
        !nonempty(claims.product_status) ||
        !Number.isSafeInteger(claims.iat) ||
        !Number.isSafeInteger(claims.exp) ||
        !nonempty(claims.jti) ||
        claims.nbf !== claims.iat ||
        (claims.exp as number) <= (claims.iat as number) ||
        (claims.exp as number) - (claims.iat as number) > 300
      ) {
        throw unavailable();
      }

      if (
        claims.sub === request.user.sub &&
        claims.identity_issuer === request.user.iss &&
        claims.identity_reference_id ===
          context.identity.identity_reference_id &&
        claims.organization_id === organization.organization_id &&
        claims.membership_id === organization.membership_id &&
        claims.organization_status === 'active' &&
        claims.membership_status === 'active' &&
        claims.product_code === 'console' &&
        claims.product_status === 'enabled' &&
        claims.global_roles.includes('platform_super_admin') &&
        claims.permissions.includes('*')
      ) {
        return;
      }
    }
    throw denied();
  }
}

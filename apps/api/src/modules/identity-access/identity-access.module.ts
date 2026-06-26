import { Module } from '@nestjs/common';
import { HemiaIdModule } from '../../integrations/hemia-id/hemia-id.module';
import { RedisModule } from '../auth/redis.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ExternalIdentityAccessController } from './external-identity-access.controller';
import { ExternalIdentityAccessService } from './external-identity-access.service';
import { IdentityAccessController } from './identity-access.controller';
import { IdentityAccessService } from './identity-access.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { OAuthClientsController } from './oauth-clients.controller';
import { OAuthClientsService } from './oauth-clients.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { SsoClientsController } from './sso-clients.controller';
import { SsoClientsService } from './sso-clients.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [HemiaIdModule, RedisModule],
  controllers: [
    IdentityAccessController,
    TenantsController,
    UsersController,
    OrganizationsController,
    TeamsController,
    MembershipsController,
    InvitationsController,
    RolesController,
    PermissionsController,
    OAuthClientsController,
    SsoClientsController,
    AccountsController,
    ExternalIdentityAccessController,
  ],
  providers: [
    IdentityAccessService,
    TenantsService,
    UsersService,
    OrganizationsService,
    TeamsService,
    MembershipsService,
    InvitationsService,
    RolesService,
    SsoCurrentUserAuthGuard,
    PermissionsService,
    OAuthClientsService,
    SsoClientsService,
    AccountsService,
    ExternalIdentityAccessService,
  ],
})
export class IdentityAccessModule {}

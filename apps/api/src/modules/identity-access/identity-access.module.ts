import { OAuthScopesController } from './oauth-scopes/oauth-scopes.controller';
import { Module } from '@nestjs/common';
import { HemiaIdModule } from '../../integrations/hemia-id/hemia-id.module';
import { AuthModule } from '../auth/auth.module';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { IdentityAccessController } from './health/identity-access.controller';
import { IdentityAccessService } from './health/identity-access.service';
import { OAuthClientsController } from './oauth-clients/oauth-clients.controller';
import { OAuthClientsService } from './oauth-clients/oauth-clients.service';
import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [HemiaIdModule, AuthModule],
  controllers: [
    OAuthScopesController,
    IdentityAccessController,
    UsersController,
    OAuthClientsController,
    AccountsController,
  ],
  providers: [
    IdentityAccessService,
    UsersService,
    SsoCurrentUserAuthGuard,
    OAuthClientsService,
    AccountsService,
  ],
  exports: [SsoCurrentUserAuthGuard],
})
export class IdentityAccessModule {}

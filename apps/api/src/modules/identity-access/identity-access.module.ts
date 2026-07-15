import { Module } from '@nestjs/common';
import { HemiaIdModule } from '../../integrations/hemia-id/hemia-id.module';
import { AuthModule } from '../auth/auth.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { IdentityAccessController } from './identity-access.controller';
import { IdentityAccessService } from './identity-access.service';
import { OAuthClientsController } from './oauth-clients.controller';
import { OAuthClientsService } from './oauth-clients.service';
import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [HemiaIdModule, AuthModule],
  controllers: [
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
})
export class IdentityAccessModule {}

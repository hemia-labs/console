import { SystemRoleCatalogController } from './system-role-catalog.controller';
import { SystemRoleCatalogService } from './system-role-catalog.service';
import { Module } from '@nestjs/common';
import { AccessAdminModule } from '../../integrations/access/access-admin.module';
import { AuthModule } from '../auth/auth.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [AccessAdminModule, AuthModule],
  controllers: [
    SystemRoleCatalogController,
    OrganizationsController,
    MembershipsController,
    RolesController,
    ProductsController,
    InvitationsController,
  ],
  providers: [
    SystemRoleCatalogService,
    OrganizationsService,
    MembershipsService,
    RolesService,
    ProductsService,
    InvitationsService,
  ],
})
export class AccessModule {}

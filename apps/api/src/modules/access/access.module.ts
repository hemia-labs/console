import { SystemRoleCatalogController } from './system-role-catalogs/system-role-catalog.controller';
import { SystemRoleCatalogService } from './system-role-catalogs/system-role-catalog.service';
import { Module } from '@nestjs/common';
import { AccessAdminModule } from '../../integrations/access/access-admin.module';
import { AuthModule } from '../auth/auth.module';
import { InvitationsController } from './invitations/invitations.controller';
import { InvitationsService } from './invitations/invitations.service';
import { MembershipsController } from './memberships/memberships.controller';
import { MembershipsService } from './memberships/memberships.service';
import { OrganizationsController } from './organizations/organizations.controller';
import { OrganizationsService } from './organizations/organizations.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';

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

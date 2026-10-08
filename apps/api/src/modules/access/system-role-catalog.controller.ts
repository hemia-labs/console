import {
  Body,
  Controller,
  Header,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../identity-access/sso-current-user-auth.guard';
import type { ConsoleRequest } from '../auth/console-authorization.service';
import { SystemRoleCatalogService } from './system-role-catalog.service';

@Controller('access/system-role-catalogs')
@UseGuards(SsoCurrentUserAuthGuard)
export class SystemRoleCatalogController {
  constructor(private readonly catalogs: SystemRoleCatalogService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Req() request: ConsoleRequest) {
    return this.catalogs.list(request);
  }
  @Post(':productCode/:version')
  @Header('Cache-Control', 'no-store')
  publish(
    @Req() request: ConsoleRequest,
    @Param('productCode') productCode: string,
    @Param('version') version: string,
    @Body() body: unknown,
  ) {
    return this.catalogs.publish(request, productCode, version, body);
  }
}

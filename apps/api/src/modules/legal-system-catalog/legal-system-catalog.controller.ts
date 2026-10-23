import { SystemConnectionsService } from './system-connections.service';
import { SystemConnectionDto } from './system-connection.dto';
import { CapabilityClientsService } from './capability-clients.service';
import { CreateCapabilityClientDto } from './capability-client.dto';
import { SystemOAuthService } from './system-oauth.service';
import type { SystemDraft } from './system-contracts';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  Header,
  ValidationPipe,
} from '@nestjs/common';
import { ConsoleAdminGuard } from '../auth/authorization/console-admin.guard';
import type { ConsoleRequest } from '../auth/authorization/console-authorization.service';
import { LegalSystemCatalogClient } from './legal-system-catalog.client';
@Controller('legal/system-catalog')
@UseGuards(ConsoleAdminGuard)
export class LegalSystemCatalogController {
  constructor(
    private readonly legal: LegalSystemCatalogClient,
    private readonly connections: SystemConnectionsService,
    private readonly systemOAuth: SystemOAuthService,
    private readonly capabilityClients: CapabilityClientsService,
  ) {}
  @Get('systems') @Header('Cache-Control', 'no-store') list(
    @Req() req: ConsoleRequest,
  ) {
    return this.legal.request('GET', 'systems', req);
  }
  @Post('systems') create(
    @Req() req: ConsoleRequest,
    @Body() body: SystemDraft,
  ) {
    return this.systemOAuth.save(req, body);
  }
  @Put('systems/:id') update(
    @Req() req: ConsoleRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SystemDraft,
  ) {
    return this.systemOAuth.save(req, body, id);
  }
  @Get('capabilities') @Header('Cache-Control', 'no-store') capabilities(
    @Req() req: ConsoleRequest,
  ) {
    return this.legal.request('GET', 'capabilities', req);
  }
  @Post('capabilities') saveCapability(
    @Req() req: ConsoleRequest,
    @Body() body: Record<string, unknown>,
  ) {
    return this.legal.request('POST', 'capabilities', req, body);
  }
  @Post('clients') @Header('Cache-Control', 'no-store') createClient(
    @Req() req: ConsoleRequest,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateCapabilityClientDto,
  ) {
    return this.capabilityClients.create(req, dto);
  }
  @Get('choices') @Header('Cache-Control', 'no-store') choices(
    @Req() req: ConsoleRequest,
  ) {
    return this.systemOAuth.choices(req);
  }
  @Get('connections/options')
  @Header('Cache-Control', 'no-store')
  connectionOptions(@Req() req: ConsoleRequest) {
    return this.connections.options(req);
  }
  @Get('connections/options/payments')
  @Header('Cache-Control', 'no-store')
  paymentOptions(@Req() req: ConsoleRequest) {
    return this.connections.paymentOptions(req);
  }
  @Get('connections/options/legal')
  @Header('Cache-Control', 'no-store')
  legalOptions(@Req() req: ConsoleRequest) {
    return this.connections.legalOptions(req);
  }
  @Post('connections/activate') @Header('Cache-Control', 'no-store') activate(
    @Req() req: ConsoleRequest,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: SystemConnectionDto,
  ) {
    return this.connections.activate(req, dto);
  }
}

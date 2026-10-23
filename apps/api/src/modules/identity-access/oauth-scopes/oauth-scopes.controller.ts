import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ConsoleAdminGuard } from '../../auth/authorization/console-admin.guard';
import { HemiaIdAdminClient } from '../../../integrations/hemia-id/hemia-id-admin.client';
@Controller('identity-access/oauth-scopes')
@UseGuards(ConsoleAdminGuard)
export class OAuthScopesController {
  constructor(private readonly identity: HemiaIdAdminClient) {}
  @Get() @Header('Cache-Control', 'no-store') list() {
    return this.identity.requestService({
      method: 'GET',
      path: '/oauth-scopes',
    });
  }
  @Post() create(@Body() body: Record<string, unknown>) {
    return this.identity.requestService({
      method: 'POST',
      path: '/oauth-scopes',
      body,
    });
  }
  @Put(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.identity.requestService({
      method: 'PUT',
      path: `/oauth-scopes/${id}`,
      body,
    });
  }
}

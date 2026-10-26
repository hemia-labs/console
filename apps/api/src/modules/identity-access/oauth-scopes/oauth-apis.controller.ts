import { SaveOAuthApiDto } from './oauth-catalog.dto';
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
@Controller('identity-access/oauth-apis')
@UseGuards(ConsoleAdminGuard)
export class OAuthApisController {
  constructor(private readonly identity: HemiaIdAdminClient) {}
  @Get() @Header('Cache-Control', 'no-store') list() {
    return this.identity.requestService({
      method: 'GET',
      path: '/oauth-apis',
    });
  }
  @Post() create(@Body() body: SaveOAuthApiDto) {
    return this.identity.requestService({
      method: 'POST',
      path: '/oauth-apis',
      body,
    });
  }
  @Put(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SaveOAuthApiDto,
  ) {
    return this.identity.requestService({
      method: 'PUT',
      path: `/oauth-apis/${id}`,
      body,
    });
  }
}

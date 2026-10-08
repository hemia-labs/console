import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '@hemia/auth/nestjs';
import { ConsoleAdminGuard } from './console-admin.guard';
import { toConsoleUser, type ConsoleUser } from './console-user';

@Controller('me')
@UseGuards(ConsoleAdminGuard)
export class MeController {
  @Get()
  @Header('Cache-Control', 'no-store')
  me(@CurrentUser() user: CurrentUserPayload): ConsoleUser {
    return toConsoleUser(user);
  }
}
